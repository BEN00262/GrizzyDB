import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

import amqp from 'amqplib/callback_api';
import CryptoJS from "crypto-js";
import LzString from "lz-string";
import {
    DatabaseModel,
    SnapshotModel,
} from "../models/index.js";


;(async () => {
    try {
        amqp.connect(process.env.AMQP_SERVER_URI, function (error0, connection){
            console.log("Started the consumer");
        
            if (error0){ throw error0; }
        
            connection.createChannel((error1, channel) => {
                if (error1){ throw error1; }
        
                channel.assertQueue(process.env.SNAPSHOT_QUEUE, { durable: true });
        
                channel.prefetch(1);
        
                channel.consume(process.env.SNAPSHOT_QUEUE, async msg => {
                    const { database_id, snapshot_id } = JSON.parse(msg.content.toString());

                    let [database, snapshot] = await Promise.all([
                        DatabaseModel.findOne({ _id: database_id }),
                        SnapshotModel.findOne({ _id: snapshot_id })
                    ]);

                    if (database && snapshot) {
                        // mark snapshot as being generated
                        await SnapshotModel.updateOne({ status: 'generating' }, {
                            _id: snapshot._id
                        });

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
                
                        // we good at this point
                        await SnapshotModel.updateOne({
                            checksum: schema_version_checksum,
                            snapshot: LzString.compressToBase64(schema_generated),
                            status: 'done'
                        }, { _id: snapshot._id });
                    }

                    channel.ack(msg);
                }, { noAck: false });
            })
        });

    } catch (error) {
        console.log(error);
    }
})();