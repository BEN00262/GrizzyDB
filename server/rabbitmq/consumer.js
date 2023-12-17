import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

import amqp from 'amqplib/callback_api.js';
import CryptoJS from "crypto-js";
import LzString from "lz-string";
import mongoose from "mongoose";
import { file, dir } from 'tmp-promise';
import {
    DatabaseModel,
    SnapshotModel,
} from "../models/index.js";
import { GrizzyDatabaseEngine } from '../services/index.js';
import md5 from 'md5';
import fs from 'fs/promises';
import { sendToSnapshotGeneratorQueue } from './client.js';
import { download_sql_dump_file } from '../utils/index.js';


;(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        amqp.connect(process.env.AMQP_SERVER_URI, function (error0, connection){
            console.log("Started the consumer");
        
            if (error0){ throw error0; }
        
            connection.createChannel((error1, channel) => {
                if (error1){ throw error1; }
        
                channel.assertQueue(process.env.SNAPSHOT_QUEUE, { durable: true });
        
                channel.prefetch(1);
        
                channel.consume(process.env.SNAPSHOT_QUEUE, async msg => {

                    const { database_id, snapshot_id, rehydrate_snapshot_id, task } = JSON.parse(msg.content.toString());

                    let [database, snapshot] = await Promise.all([
                        DatabaseModel.findOne({ _id: database_id }),
                        SnapshotModel.findOne({ _id: snapshot_id })
                    ]);

                    if (database && snapshot) {
                        // mark snapshot as being generated
                        await SnapshotModel.updateOne({ _id: snapshot._id },{ status: 'generating' });

                        const credentials = JSON.parse(
                            CryptoJS.AES.decrypt(
                              database.credentials,
                              process.env.MASTER_AES_ENCRYPTION_KEY
                            ).toString(CryptoJS.enc.Utf8)
                        );

                        const schema_generated = JSON.stringify(
                            await GrizzyDatabaseEngine.export_database_schema(
                              database.dialect,
                              credentials
                            )
                        );
                    
                        let schema_version_checksum = md5(schema_generated);

                        const upload_location = await GrizzyDatabaseEngine.dump_database_to_file(
                            database.dialect,
                            credentials
                        );
                
                        // we good at this point
                        await SnapshotModel.updateOne({ _id: snapshot._id },{
                            checksum: schema_version_checksum,
                            snapshot: LzString.compressToBase64(schema_generated),
                            status: 'done',
                            url_to_dump: upload_location
                        });

                        if (task === 'rehydrate') {
                            const rehydrate_snapshot = await SnapshotModel.findOne({
                                _id: rehydrate_snapshot_id
                            });

                            if (rehydrate_snapshot) {
                                // read the snapshot to a temp file
                                const { path, cleanup } = await file();

                                const sql_dump = await download_sql_dump_file(
                                    rehydrate_snapshot.url_to_dump
                                );

                                await fs.writeFile(path, sql_dump.Body);

                                await GrizzyDatabaseEngine.rehydrate_database_with_snapshot(
                                    database.dialect,
                                    credentials,
                                    path
                                );

                                const snapshot = await SnapshotModel.create({
                                    status: 'scheduled',
                                    checksum: md5(`${Date.now}`), // this is a placeholder checksum
                                    database: database._id,
                                    owner: database.owner,
                                    snapshot: LzString.compressToBase64("{}")
                                });

                                sendToSnapshotGeneratorQueue({
                                    database_id: database._id,
                                    snapshot_id: snapshot._id,
                                });

                                cleanup();
                            }
                        }
                    }

                    channel.ack(msg);
                }, { noAck: false });
            })
        });

    } catch (error) {
        console.log(error);
    }
})();