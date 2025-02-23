// a very basic implementation of a CDC flow
// get the credentials -- log in 
// compute a total checksum store it as part of the database
import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

// import mongoose from 'mongoose';
import CryptoJS from "crypto-js";
import md5 from "md5";
import LzString from "lz-string";
import { DatabaseModel, SnapshotModel } from "../../models/index.js";
import { GrizzyDatabaseEngine } from "../../services/index.js";
import { sendToSnapshotGeneratorQueue } from '../../rabbitmq/client.js';

// this is a runner that pushes jobs to the consumer for checks
export async function mark_databases_for_snapshot_regeneration() {
    // get all the databases
    // check if its on free or paid sub subscription, if so run as required
    // for now we can run irregardless
    
    // NOTE: this is a very hacky way to mark dbs for snapshot regeneration
    
    const databases_to_watch = await DatabaseModel.find({
        dialect: {
            '$in': ['postgres', 'mariadb', 'mysql', 'sqllite']
        }
    });

    await Promise.allSettled(
        databases_to_watch.map(async database => {
            try {
            const credentials = JSON.parse(
                CryptoJS.AES.decrypt(
                    database.credentials,
                    process.env.MASTER_AES_ENCRYPTION_KEY
                ).toString(CryptoJS.enc.Utf8)
            )

            // get the checksum
            const cdc_checksum = await GrizzyDatabaseEngine.database_cdc_changes(
                database.dialect,
                credentials
            );

            // compare the cdc with what we have if there is a change, mark it for sweep
            if (cdc_checksum && (database.cdc_checksum !== cdc_checksum)) {
                const snapshot = await SnapshotModel.create({
                    status: 'scheduled',
                    checksum: md5(`${Date.now}`), // this is a placeholder checksum
                    database: database._id,
                    owner: database.owner,
                    snapshot: LzString.compressToBase64("{}")
                });
            
                await sendToSnapshotGeneratorQueue({ 
                    database_id: database._id,
                    snapshot_id: snapshot._id,
                    task: 'snapshot'
                });

                // mark the db as having being snapshoted
                await DatabaseModel.updateOne({ _id: database._id }, { cdc_checksum });   
            }
            } catch (error) {
                console.log(error);
            }
        })
    )
}

;(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await mark_databases_for_snapshot_regeneration()
})();