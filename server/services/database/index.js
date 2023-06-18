import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import cryptoRandomString from 'crypto-random-string';
import mariadb from 'mariadb';
import { Sequelize } from 'sequelize';
import { identify } from 'sql-query-identifier';
import { json2csv } from 'json-2-csv';
import { GrizzyDBException } from '../../utils/index.js';
import { getDBSchemas } from '../../utils/generate_db_ui_schema.js';

export class GrizzyDatabaseEngine {
    // max size and everything in between
    static async provision_database() {
        const database_name = cryptoRandomString({ 
            length: 15,
            type: "distinguishable"
        });

        const random_password = cryptoRandomString({ length: 16 });

        const database_user = cryptoRandomString({ 
            length: 16,
            type: 'distinguishable',
        });

        const connection = await (mariadb.createPool({
            host: process.env.MASTER_DB_URI,
            // ssl: true,
            password: process.env.MASTER_DB_PASSWORD,
            user: process.env.MASTER_DB_USERNAME,
            connectionLimit: 1,
            port: 3306
        })).getConnection();

        

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${database_name};`
        );

        // TODO: research more on this
        // await connection.query(
            // `CREATE TRIGGER CheckDatabaseSizeFor${database_name}
            // BEFORE INSERT ON ${database_name}.*
            // FOR EACH ROW
            // BEGIN
            //     DECLARE MaxAllowedSizeMB INT;
            //     DECLARE CurrentSizeMB INT;
            
            //     SELECT MaxSizeMB INTO MaxAllowedSizeMB
            //     FROM ${database_name}.MaxAllowedSize
            //     WHERE DatabaseName = DATABASE();
            
            //     SELECT SUM(data_length + index_length) INTO CurrentSizeMB
            //     FROM information_schema.TABLES
            //     WHERE table_schema = DATABASE();
            
            //     IF CurrentSizeMB > MaxAllowedSizeMB THEN
            //         -- Rollback the insertion and display an error message
            //         SIGNAL SQLSTATE '45000'
            //             SET MESSAGE_TEXT = 'Database size exceeds the allowed limit. Data insertion not permitted.';
            //     END IF;
            // END;`
        // );

        // await connection.query(
        //     `CREATE TRIGGER CheckDatabaseSizeFor${database_name}
        //     BEFORE UPDATE ON ${database_name}.*
        //     FOR EACH ROW
        //     BEGIN
        //         DECLARE MaxAllowedSizeMB INT;
        //         DECLARE CurrentSizeMB INT;
            
        //         SELECT MaxSizeMB INTO MaxAllowedSizeMB
        //         FROM ${database_name}.MaxAllowedSize
        //         WHERE DatabaseName = DATABASE();
            
        //         SELECT SUM(data_length + index_length) INTO CurrentSizeMB
        //         FROM information_schema.TABLES
        //         WHERE table_schema = DATABASE();
            
        //         IF CurrentSizeMB > MaxAllowedSizeMB THEN
        //             -- Rollback the insertion and display an error message
        //             SIGNAL SQLSTATE '45000'
        //                 SET MESSAGE_TEXT = 'Database size exceeds the allowed limit. Data insertion not permitted.';
        //         END IF;
        //     END;`
        // );

        await connection.query(
            `CREATE USER '${database_user}'@'%' IDENTIFIED BY '${random_password}';`
        );

        await connection.query(
            `GRANT ALL PRIVILEGES ON ${database_name}.* TO '${database_user}'@'%';`
        );

        await connection.query(
            `FLUSH PRIVILEGES;`
        );

        await connection.end();

        return {
            DB_NAME: database_name,
            DB_USER: database_user,
            DB_PASSWORD: random_password
        }
    }

    /**
     * 
     * @param {string} schema_and_data 
     */
    static async push_schema_and_data_to_database(schema_and_data, dialect, credentials = {}) {
        const statements = identify(schema_and_data.replace(/USE\s+\w+;?\n*/i, ''));

        const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
            host: process.env.MASTER_DB_URI,
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        for (const statement of statements) {
            if (statement.type !== 'CREATE_DATABASE') {
                await sequelize.query(statement.text);
            }
        }
    }

    // this is for a direct sql statement
    static async query_database(query, dialect, credentials = {}) {
        try {
            const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
                host: process.env.MASTER_DB_URI,
                logging: false,
                dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
            });
    
            const response = await sequelize.query(query);
    
            return response?.[0];
        } catch (error) {
            console.log(error)
            throw new GrizzyDBException(error.message);
        }
    }

    static async delete_database(dialect, credentials) {
        const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
            host: process.env.MASTER_DB_URI,
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        await sequelize.query(`DROP DATABASE ${credentials.DB_NAME};`);        
    }

    // import schema defs to reactflow
    static async export_database_schema(dialect, credentials = {}) {
        const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
            host: process.env.MASTER_DB_URI,
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        let sql_template = '';

        switch (dialect) {
            case 'mariadb':
            case 'mysql':
                sql_template = `SELECT
                c.table_schema,
                c.table_name,
                c.column_name,
                c.data_type,
                c.ordinal_position
              FROM information_schema.columns c
              LEFT JOIN information_schema.views v
                ON v.table_schema = c.table_schema
                  AND v.table_name = c.table_name
              WHERE
                c.table_schema NOT IN ('sys','information_schema', 'mysql', 'performance_schema')
                AND c.table_name NOT IN ('schema_migrations', 'ar_internal_metadata')`;
                break;
            case 'postgres':
                sql_template = `SELECT
                t.table_schema,
                t.table_name,
                c.column_name,
                c.data_type,
                c.ordinal_position
              FROM information_schema.tables t
              LEFT JOIN information_schema.columns c
                ON t.table_schema = c.table_schema
                  AND t.table_name = c.table_name
              WHERE
                t.table_schema NOT IN ('information_schema', 'pg_catalog')
                AND t.table_name NOT IN ('schema_migrations', 'ar_internal_metadata')
              ORDER BY 1, 2, 5`;
                break;
            default:
                throw new GrizzyDBException("Invalid dialect specified")
        }

        const response = await sequelize.query(sql_template);

        return getDBSchemas(
            await json2csv(response?.[0])
        );
    }
}

// ;(async () => {
//     console.log(
//         await GrizzyDatabaseEngine.provision_database()
//     );

//     console.log("We are done")
// })();