import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

import {Agenda} from '@hokify/agenda';
import moment from 'moment';
import { Sequelize } from 'sequelize';
import CryptoJS from "crypto-js";
import { DatabaseModel } from "../models/index.js";

const agenda = new Agenda({ 
    db: { address: process.env.MONGO_URI } 
});

agenda.define('delete expired databases', async job => {
	// get the database metadata
    const databases = await DatabaseModel.find({
        createdAt: {
            $gte: moment().subtract(24, 'hours')
        }
    });

    // make this generic
    // NOTE: look into database types first before spinning this up
    const sequelize = new Sequelize({
        host: process.env.MASTER_MARIADB_URI,
        username: process.env.MASTER_MARIADB_USERNAME,
        password: process.env.MASTER_MARIADB_PASSWORD,
        logging: false,
        dialect, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
    });

    await Promise.allSettled(
        databases.map(async database => {
            const credentials = JSON.parse(CryptoJS.AES.decrypt(
                database.credentials, process.env.MASTER_AES_ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8));

            await sequelize.query(`DROP DATABASE ${credentials.DB_NAME}`);
            await DatabaseModel.deleteOne({ _id: database._id })
        })
    )

    await sequelize.close();
});

;(async function () {
	await agenda.start();
	await agenda.every('8 hours', 'delete expired databases');
})();