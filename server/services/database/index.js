import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import cryptoRandomString from 'crypto-random-string';
import { file, dir } from 'tmp-promise'
import { Sequelize } from 'sequelize';
import SequelizeAuto from 'sequelize-auto';
import { identify } from 'sql-query-identifier';
import handlebars from 'handlebars';
import { GrizzyDBException, morph_name_to_valid_database_name, upload_file_to_s3 } from '../../utils/index.js';
import { generate_db_graph } from '../../utils/generate_db_ui_schema.js';
import { templates } from './templates/index.js';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import { nanoid } from 'nanoid';
import fs from 'fs';

const execute_commands_async = promisify(exec);

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
        const database_name = `GD_${cryptoRandomString({ 
            length: 15,
            type: "distinguishable"
        })}`;

        const random_password = cryptoRandomString({ length: 16 });

        const database_user = `GU_${cryptoRandomString({ 
            length: 16,
            type: "distinguishable"
        })}`;

        const template = templates[dialect.toLowerCase()];

        if (template) {
            const sequelize = GrizzyDatabaseEngine.get_database_factory(
                dialect
            );
    
            for (const statement of (template.setup ?? [])) {
                await sequelize.query(handlebars.compile(statement)({
                    database_name,
                    database_user,
                    random_password
                }));
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
                host: credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect),
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

    static async get_databases_given_credentials(dialect, credentials = {}) {
        if (!Object.keys(credentials).length) {
            throw new GrizzyDBException("Invalid credentials");
        }

        const schema = templates[dialect];

        if (!schema) {
            return []
        }

        // try to connect then query for the databases
        const sequelize = new Sequelize(schema.base_database, credentials.DB_USER, credentials.DB_PASSWORD, {
            host: credentials.DB_HOST,
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        const databases = (await sequelize.query(schema.list_databases))?.[0];

        return [
            ...new Set(
                databases.map(database =>  Object.values(database)).flat().filter(u => u)
            )
        ]
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

    static async rehydrate_database_with_snapshot(dialect, credentials, snapshot_path) {
        if (!['postgres', 'mysql', 'mariadb'].includes(dialect)) {
            throw new GrizzyDBException(`Database exports not supported for this dialect ${dialect}`)
        }

        // get latest snapshot
        // drop db
        const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
            host: credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect),
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        await sequelize.query(`DROP DATABASE ${credentials.DB_NAME};`);
        await sequelize.close();
        // create db

        const template = templates[dialect.toLowerCase()];

        if (template) {
            const lsequelize = credentials?.DB_HOST ? new Sequelize({
                host: credentials.DB_HOST,
                username: credentials.DB_USER,
                password: credentials.DB_PASSWORD,
                logging: false,
                dialect, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
            }) : GrizzyDatabaseEngine.get_database_factory(dialect);
    
            for (const statement of (template.reassign_database ?? [])) {
                await lsequelize.query(handlebars.compile(statement)({
                    database_name: credentials.DB_NAME,
                    database_user: credentials.DB_USER,
                    random_password: credentials.DB_PASSWORD
                }));
            }

            // run snapshots
            switch (dialect) {
                case 'postgres':
                    {
                        await execute_commands_async(
                            `psql -U ${credentials.DB_USER} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -p ${credentials.DB_PASSWORD} -d ${credentials.DB_NAME} < ${snapshot_path}`
                        );
                        
                        break;
                    }
    
                case 'mariadb':
                case 'mysql':
                    {
                        await execute_commands_async(
                            `mysql -u ${credentials.DB_USER} -p${credentials.DB_PASSWORD} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -B ${credentials.DB_NAME} < ${snapshot_path}`
                        );
    
                        break;
                    }
    
                default:
                    throw new GrizzyDBException(`Database exports not supported for this dialect ${dialect}`)
            }

            await lsequelize.close();
        }
    }

    static async dump_database_to_file(dialect, credentials) {
        // get a temporary file --> upload the file later to s3 and save it
        const { path: temp_folder_path, cleanup } = await dir();
        const temp_file_path = path.join(temp_folder_path, `${nanoid(12)}.sql`);

        switch (dialect) {
            case 'postgres':
                {
                    await execute_commands_async(
                        `pg_dump -U ${credentials.DB_USER} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -p ${credentials.DB_PASSWORD} -d ${credentials.DB_NAME} > ${temp_file_path}`
                    );
                    
                    break;
                }

            case 'mariadb':
            case 'mysql':
                {
                    await execute_commands_async(
                        `mysqldump -u ${credentials.DB_USER} -p${credentials.DB_PASSWORD} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -B ${credentials.DB_NAME} > ${temp_file_path}`
                    );

                    break;
                }

            default:
                throw new GrizzyDBException(`Database exports not supported for this dialect ${dialect}`)
        }

        if (!fs.existsSync(temp_file_path) || (fs.statSync(temp_file_path)).size === 0) {
            throw new GrizzyDBException("Failed to dump database");
        }

        // upload it to s3 at this point
        const result = await upload_file_to_s3(temp_file_path);

        // cleanup();

        return result.Key;
    }

    // we get the neweset schema compare it to point in time and generate migrations to arrive
    // at the point we wanna be
    // run the migrations against the specific database ( that should be easy )
    static async generate_migrations_from_schema_diffs() {

    }

    static generate_schema_diffs(base_schema, compare_schema) {
        const processed_tables = [];


        (base_schema?.tables ?? []).forEach(table => {
            let equivalent_table_on_main = (compare_schema?.tables ?? []).find(
                ({ name }) => name === table?.name
            );

            if (equivalent_table_on_main) {
                // get the columns and mark the changes
                let processed_columns = [];

                (table?.columns ?? []).forEach(column => {
                    let equivalent_column_on_main = (equivalent_table_on_main?.columns ?? []).find(
                        ({ name }) => name === column?.name
                    );

                    if (equivalent_column_on_main && (equivalent_column_on_main?.type !== column?.type)) {
                        column.diffColor = "#FFFF00";
                    } else {
                        column.diffColor = "#CAF7B7";
                    }

                    processed_columns.push(column?.name);
                });

                base_schema.columns = [
                    ...(base_schema?.columns ?? []),
                    ...(compare_schema?.columns ?? []).filter(
                        ({ name }) => !processed_columns.includes(name)
                    ).map(x => ({ ...x, diffColor: "#ffcccb" }))
                ];
            } else {
                table.diffColor = "#CAF7B7";
            }

            processed_tables.push(table?.name);
        });

        // get all the 
        base_schema.tables = [
            ...(base_schema?.tables ?? []),
            ...(compare_schema?.tables ?? []).filter(
                ({ name }) => !processed_tables.includes(name)
            ).map(x => ({ ...x, diffColor: "#ffcccb" }))
        ];

        base_schema.edgeConfigs = [
            ...(base_schema?.edgeConfigs ?? []),
            ...(compare_schema?.edgeConfigs ?? []),
        ];

        base_schema.schemaColors = {
            ...(base_schema?.schemaColors ?? {}),
            ...(compare_schema?.schemaColors ?? {}),
        };

        base_schema.tablePositions = {
            ...(base_schema?.tablePositions ?? {}),
            ...(compare_schema?.tablePositions ?? {}),
        }

        return base_schema;
    }

    static async get_database_schema_version(dialect, credentials) {
        const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
            host: GrizzyDatabaseEngine.get_rds_uri(dialect),
            logging: false,
            dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        const schema_version = templates[dialect]?.schema_version;

        if (schema_version) {
            const response = await sequelize.query(
                templates[dialect]?.schema_version
            );
        
            return JSON.stringify(response?.[0]);
        }
     
        return null;
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
                host: credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect),
                dialect,
                noWrite: true,
                logging:false
            }
        );

        const data = await auto.run()

        return generate_db_graph(data);
    }

    // rename a database
    // called when the user renames a database and we are doing self hosting of the database ---> but should we??
    static async rename_database(dialect, new_name, credentials = {}) {
        // console.log(credentials);
        
        // const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
        //     host: GrizzyDatabaseEngine.get_rds_uri(dialect),
        //     logging: false,
        //     dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        // });

        // https://www.tutorialspoint.com/sql/sql-rename-database.htm
        // TODO: fully test this flow
        // await sequelize.query(`RENAME DATABASE ${credentials.DB_NAME} TO ${morph_name_to_valid_database_name(new_name)};`);        
    }
}