import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import cryptoRandomString from 'crypto-random-string';
import { Sequelize } from 'sequelize';
import SequelizeAuto from 'sequelize-auto';
import { identify } from 'sql-query-identifier';
import { json2csv } from 'json-2-csv';
import handlebars from 'handlebars';
import { GrizzyDBException } from '../../utils/index.js';
import { generate_db_graph, getDBSchemas } from '../../utils/generate_db_ui_schema.js';
import { templates } from './templates/index.js';

export class GrizzyDatabaseEngine {

    static get_rds_uri(dialect) {
        switch (dialect) {
            case 'mariadb':
                return process.env.MASTER_MARIADB_URI;
            case 'postgres':
                return process.env.MASTER_POSTGRES_URI;
            case 'mysql':
                return process.env.MASTER_MYSQL_URI;
            default:
                throw new GrizzyDBException("Unsupported dialect");
        }
    }

    static get_database_factory(dialect) {
        let credentials = {};

        switch (dialect) {
            case 'mariadb':
                credentials = {
                    host: process.env.MASTER_MARIADB_URI,
                    username: process.env.MASTER_MARIADB_USERNAME,
                    password: process.env.MASTER_MARIADB_PASSWORD,
                }

                break;
            case 'postgres':
                credentials = {
                    host: process.env.MASTER_POSTGRES_URI,
                    username: process.env.MASTER_POSTGRES_USERNAME,
                    password: process.env.MASTER_POSTGRES_PASSWORD,
                }

                break;
            case 'mysql':
                credentials = {
                    host: process.env.MASTER_MYSQL_URI,
                    username: process.env.MASTER_MYSQL_USERNAME,
                    password: process.env.MASTER_MYSQL_PASSWORD,
                }

                break;
            default:
                throw new GrizzyDBException("Unsupported dialect");
        }

        return new Sequelize({
            ...credentials,
            logging: false,
            dialect, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        })
    }

    // max size and everything in between
    static async provision_database(dialect) {
        const database_name = `GRIZZY_DB_${cryptoRandomString({ 
            length: 15,
            type: "distinguishable"
        })}`;

        const random_password = cryptoRandomString({ length: 16 });

        const database_user = `GRIZZY_USER_${cryptoRandomString({ 
            length: 16,
            type: "distinguishable"
        })}`;

        const template = templates[dialect.toLowerCase()];

        if (template) {
            const sequelize = GrizzyDatabaseEngine.get_database_factory(
                dialect
            );
    
            for (const statement of (template.setup ?? [])) {
                const query = handlebars.compile(statement)({
                    database_name,
                    database_user,
                    random_password
                });

                console.log(query);

                await sequelize.query(query);
            }

            await sequelize.close();
        }

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
            host: GrizzyDatabaseEngine.get_rds_uri(dialect),
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
                host: GrizzyDatabaseEngine.get_rds_uri(dialect),
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
            host: GrizzyDatabaseEngine.get_rds_uri(dialect),
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        await sequelize.query(`DROP DATABASE ${credentials.DB_NAME};`);        
    }

    // import schema defs to reactflow
    static async export_database_schema(dialect, credentials = {}) {
        const auto = new SequelizeAuto(
            credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
                host: GrizzyDatabaseEngine.get_rds_uri(dialect),
                dialect,
                noWrite: true,
                logging:false
            }
        );

        const data = await auto.run()

        console.log(
            await generate_db_graph(data)
        )

        // const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
        //     host: GrizzyDatabaseEngine.get_rds_uri(dialect),
        //     logging: false,
        //     dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        // });

        // let sql_template = '';

        // switch (dialect) {
        //     case 'mariadb':
        //     case 'mysql':
        //         sql_template = `SELECT
        //         c.table_schema,
        //         c.table_name,
        //         c.column_name,
        //         c.data_type,
        //         c.ordinal_position
        //       FROM information_schema.columns c
        //       LEFT JOIN information_schema.views v
        //         ON v.table_schema = c.table_schema
        //           AND v.table_name = c.table_name
        //       WHERE
        //         c.table_schema NOT IN ('sys','information_schema', 'mysql', 'performance_schema')
        //         AND c.table_name NOT IN ('schema_migrations', 'ar_internal_metadata')`;
        //         break;
        //     case 'postgres':
        //         sql_template = `SELECT
        //         t.table_schema,
        //         t.table_name,
        //         c.column_name,
        //         c.data_type,
        //         c.ordinal_position
        //       FROM information_schema.tables t
        //       LEFT JOIN information_schema.columns c
        //         ON t.table_schema = c.table_schema
        //           AND t.table_name = c.table_name
        //       WHERE
        //         t.table_schema NOT IN ('information_schema', 'pg_catalog')
        //         AND t.table_name NOT IN ('schema_migrations', 'ar_internal_metadata')
        //       ORDER BY 1, 2, 5`;
        //         break;
        //     default:
        //         throw new GrizzyDBException("Unsupported dialect");
        // }

        // const response = await sequelize.query(sql_template);

        // return getDBSchemas(
        //     await json2csv(response?.[0])
        // );
    }
}

// ;(async () => {
//     console.log(
//         await GrizzyDatabaseEngine.provision_database("mariadb")
//     );

//     console.log("We are done")
// })();