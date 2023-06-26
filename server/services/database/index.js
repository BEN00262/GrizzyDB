import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import cryptoRandomString from 'crypto-random-string';
import { Sequelize } from 'sequelize';
import SequelizeAuto from 'sequelize-auto';
import { identify } from 'sql-query-identifier';
import handlebars from 'handlebars';
import { GrizzyDBException } from '../../utils/index.js';
import { generate_db_graph } from '../../utils/generate_db_ui_schema.js';
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

    // generate REST endpoints for a given database --> for now it will be slow af but we will imporve on it
    static async generate_rest_endpoints(dialect, credentials) {
        // get the structure of the database --> generate the data
        // get the tables
        // loop through the tables and generate the stuff
        // create a simple rest execution engine
        
    }

    // generate GraphQL endpoints
    static async generate_graphql_endpoints(dialect, credentials) {
        // generate graphql types and stuff
        // generate a single script -- compile it

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

        return generate_db_graph(data);
    }
}