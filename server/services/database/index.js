import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import { exec } from 'child_process';
import cryptoRandomString from 'crypto-random-string';
import fs from 'fs';
import handlebars from 'handlebars';
import { nanoid } from 'nanoid';
import path from 'path';
import { Sequelize } from 'sequelize';
import SequelizeAuto from 'sequelize-auto';
import { identify } from 'sql-query-identifier';
import { dir } from 'tmp-promise';
import { promisify } from 'util';
import { generate_db_graph } from '../../utils/generate_db_ui_schema.js';
import { GrizzyDBException, upload_file_to_s3 } from '../../utils/index.js';
import { templates } from './templates/index.js';
import mysql from 'mysql2';

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

            case 'rethinkdb':
                return `${process.env.MASTER_RETHINKDB_URI}:${process.env.MASTER_RETHINKDB_PORT}`;

            default:
                throw new GrizzyDBException("Unsupported dialect");
        }
    }

    /**
     * 
     * @param {string} dialect 
     * @param {boolean} credentials_only 
     * @returns 
     */
    static get_database_factory(dialect, credentials_only = false) {
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

        if (credentials_only) {
            return credentials;
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
        })}`.toLowerCase();

        const random_password = cryptoRandomString({ length: 16 });

        const database_user = `GU_${cryptoRandomString({ 
            length: 16,
            type: "distinguishable"
        })}`;

        const template = templates[dialect.toLowerCase()];

        // this only applies to the relationalDB templates

        if (template) {

            switch (dialect) {
                case 'postgres':
                case 'mysql':
                case 'mariadb':
                    {
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

                        break;
                    }
                case 'rethinkdb':
                    {
                        // ensure the setup is a function first
                        const setup_function = template?.setup;

                        if (typeof setup_function !== 'function') {
                            throw new GrizzyDBException("Invalid setup function for RethinkDB dialect")
                        }

                        await setup_function(
                            database_name,
                            database_user,
                            random_password
                        );

                        break;
                    }

                default:
                    throw new GrizzyDBException(`Support for ${dialect} has not been worked on yet, look out for changes in the future`)
            }
        }

        return {
            DB_NAME: dialect === 'postgres' ? database_name.toLowerCase() : database_name,
            DB_USER: database_user,
            DB_PASSWORD: random_password
        }
    }

    // trying to add support for fdw ( PgSpider )
    // https://towardsdatascience.com/how-to-set-up-a-foreign-data-wrapper-in-postgresql-ebec152827f3
    // https://github.com/pgspider/pgspider
    /**
     * 
     * @param {{ credentials: { DB_NAME: string, DB_HOST?: string, DB_PASSWORD: string, DB_USER: string }, dialect: string }} parent 
     * @param {{ credentials: { DB_NAME: string, DB_HOST?: string, DB_PASSWORD: string, DB_USER: string }, dialect: string }} child 
     */
    static async push_databases_to_fdw_bucket(parent, child) {
        // check if the bucket ( this is a pass through postgresql db ) already exists, if not create
        // we might have to login using the root credentials
        const parent_root_credentials = GrizzyDatabaseEngine.get_database_factory(parent.dialect, true);

        const parent_connection = new Sequelize(parent.credentials.DB_NAME.toLowerCase(), parent_root_credentials.username, parent_root_credentials.password, {
            host: GrizzyDatabaseEngine.get_rds_uri(parent.dialect),
            logging: false,
            dialect: parent.dialect === 'mariadb' ? 'mysql' : parent.dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        const child_root_credentials = GrizzyDatabaseEngine.get_database_factory(child.dialect, true);

        const child_connection = new Sequelize(child.credentials.DB_NAME.toLowerCase(), child_root_credentials.username, child_root_credentials.password, {
            host: GrizzyDatabaseEngine.get_rds_uri(child.dialect),
            logging: false,
            dialect: child.dialect === 'mariadb' ? 'mysql' : child.dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        // const root_connection = GrizzyDatabaseEngine.get_database_factory(child.dialect);


        // create a user on the root connection
        const random_password = cryptoRandomString({ length: 16 });

        const fdw_connection_user = `FDW_USER_${cryptoRandomString({ 
            length: 16,
            type: "distinguishable"
        })}`;

        const fdw_connection_server_name = `FDW_server_${cryptoRandomString({ 
            length: 16,
            type: "distinguishable"
        })}`.toLowerCase();


        const user_creation_steps = [
            `CREATE USER ${fdw_connection_user} WITH PASSWORD '${random_password}';`,
            `GRANT USAGE ON SCHEMA PUBLIC TO ${fdw_connection_user};`,
            // "FLUSH PRIVILEGES;",
        ];

        // execute this stuff on the root db
        for (const statement of user_creation_steps) {
            await child_connection.query(statement);
        }

        await parent_connection.query(`CREATE EXTENSION IF NOT EXISTS postgres_fdw;`);
        await parent_connection.query(`CREATE SERVER ${fdw_connection_server_name} FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '${GrizzyDatabaseEngine.get_rds_uri(child.dialect)}', port '5432', dbname '${child.credentials.DB_NAME}');`);
        await parent_connection.query(`CREATE USER MAPPING FOR ${parent.credentials.DB_USER} SERVER ${fdw_connection_server_name} OPTIONS (user '${fdw_connection_user}', password '${random_password}');`);
        await parent_connection.query(`ALTER SERVER ${fdw_connection_server_name} OWNER TO ${parent.credentials.DB_USER};`);
        await parent_connection.query(`GRANT USAGE ON FOREIGN SERVER ${fdw_connection_server_name} TO ${parent.credentials.DB_USER};`);
        // await parent_connection.query(`ALTER SERVER ${fdw_connection_server_name} OWNER TO ${parent.credentials.DB_USER};`);

        const base_parent_connection = new Sequelize(parent.credentials.DB_NAME.toLowerCase(), parent.credentials.DB_USER, parent.credentials.DB_PASSWORD, {
            host: GrizzyDatabaseEngine.get_rds_uri(parent.dialect),
            logging: false,
            dialect: parent.dialect === 'mariadb' ? 'mysql' : parent.dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        });

        await base_parent_connection.query(`IMPORT FOREIGN SCHEMA public FROM SERVER ${fdw_connection_server_name} INTO public;`);


        // close all the connections
        await Promise.allSettled([parent_connection.close(), child_connection.close(), /*root_connection.close()*/ base_parent_connection.close()]);
    }

    /**
     * 
     * @param {{ credentials: { DB_NAME: string, DB_HOST?: string, DB_PASSWORD: string, DB_USER: string }, dialect: string }} parent 
     * @param {{ credentials: { DB_NAME: string, DB_HOST?: string, DB_PASSWORD: string, DB_USER: string }, dialect: string }} child 
     */
    static async remove_databases_from_fdw_bucket(parent, child) {

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

    static async get_databases_given_credentials_base(dialect, base_database, credentials = {}) {
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

    static async database_cdc_changes(dialect, credentials = {}) {
        // this only works for relational dbs
        switch (dialect) {
            case 'mariadb':
            case 'mysql':
                {
                    // get the connection fetch all the tables then compute the total checksum
                    const sequelize = new Sequelize(credentials.DB_NAME.toUpperCase(), credentials.DB_USER, credentials.DB_PASSWORD, {
                        host: credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect),
                        logging: false,
                        dialect: 'mysql' /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
                    });

                    // get all the tables
                    const tables_with_last_update_time_epochs_for_cdc = await sequelize.query(`SELECT TABLE_NAME, unix_timestamp(update_time) as last_update_time
                    FROM information_schema.tables
                    WHERE TABLE_SCHEMA = database();`);

                    // get the number and save it to the db for later checks
                    return tables_with_last_update_time_epochs_for_cdc?.[0]?.reduce((acc, x) => {
                        return acc + (x?.last_update_time ?? 0);
                    }, 0);
                }

            case 'postgres':
                {
                    // get the connection fetch all the tables then compute the total checksum
                    const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
                        host: credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect),
                        logging: false,
                        dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
                    });

                    // get all the tables
                    const tables_with_last_update_time_epochs_for_cdc = await sequelize.query(`SELECT table_name, 
                    EXTRACT(epoch FROM pg_stat_get_last_autovacuum_time(c.oid) ) AS last_update_time
             FROM information_schema.tables t
             JOIN pg_class c ON t.table_name = c.relname
             WHERE table_schema = current_schema();`);

                    // get the number and save it to the db for later checks
                    return tables_with_last_update_time_epochs_for_cdc?.[0]?.reduce((acc, x) => {
                        return acc + (x?.last_update_time ?? 0);
                    }, 0);
                }
        }
    }

    /**
     * 
     * @param {string} dialect 
     * @param {*} credentials 
     * @returns {string[]}
     */
    static async get_databases_given_credentials(dialect, credentials = {}) {
        if (!Object.keys(credentials).length) {
            throw new GrizzyDBException("Invalid credentials");
        }

        const schema = templates[dialect];

        if (!schema) {
            return []
        }

        try {
            const databases = await GrizzyDatabaseEngine.get_databases_given_credentials_base(dialect, schema.base_database, credentials);
            return databases;
        } catch (error) {
            const databases = [];

            // mysql and mariadb
            switch (dialect) {
                case 'postgres':
                    {
                        let with_or_without_windows = process.platform === 'win32' ? `set PGPASSWORD=${credentials.DB_PASSWORD} &&` : `PGPASSWORD=${credentials.DB_PASSWORD}`;
                        let { stdout } = await execute_commands_async(
                            `${with_or_without_windows} psql -U ${credentials.DB_USER} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -w -c "SELECT d.datname FROM pg_database d WHERE has_database_privilege(current_user, d.datname, 'CREATE');"`
                        );

                        stdout = stdout.trim().split('\n').map(u => u.trim()).filter(u => u)

                        return [
                            ...new Set(stdout.slice(2, stdout.length - 1))
                        ]
                    }
                case 'mariadb':
                case 'mysql':
                    {
                        let { stdout } = await execute_commands_async(
                            `mysql -u ${credentials.DB_USER} -p'${credentials.DB_PASSWORD}' -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -e "SHOW DATABASES;"`
                        );

                        stdout = stdout.trim().split('\n').map(u => u.trim()).filter(u => u)

                        return [
                            ...new Set(stdout.slice(2, stdout.length - 1))
                        ]
                    }
            }

            return databases;
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

    static async database_to_database_etl(from_dialect, to_dialect, to_database /* this DB must be within Grizzy */, credentials = {}) {
        switch (from_dialect) {
            case 'mariadb':
            case 'mysql':
                {
                    switch (to_dialect) {
                        case 'postgres':
                            {
                                const { stderr } = await execute_commands_async(
                                    `pgloader --quiet mysql://${credentials.DB_USER}:${credentials.DB_PASSWORD}@${credentials.DB_HOST}/${credentials.DB_NAME} pgsql://${process.env.MASTER_POSTGRES_USERNAME}:${process.env.MASTER_POSTGRES_PASSWORD}@${process.env.MASTER_POSTGRES_URI}/${to_database}`
                                );

                                if (stderr?.toLowerCase()?.includes('kaboom!')) {
                                    throw new GrizzyDBException('Failed to import database')
                                }
                            }
                    }
                }
        }
    }

    static async get_query_analytics(dialect, how_many_rows = 10, credentials = {}) {
        const template = templates[dialect.toLowerCase()];

        if (template) {
            const sequelize = new Sequelize(credentials.DB_NAME, credentials.DB_USER, credentials.DB_PASSWORD, {
                host: credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect),
                logging: false,
                dialect: dialect === 'mariadb' ? 'mysql' : dialect /* weird kink fix it later */, /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
            });

            let response = null;
    
            // we have to check version for postgres somehow

            switch (dialect) {
                case 'postgres':
                    // a bit different
                    // check the version first
                    await sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements;");
                    // TODO: make this more dynamic
                    // const database_version = await sequelize.databaseVersion();

                    try {
                        // newer postgres versions
                        response = await sequelize.query(`SELECT query, calls, total_time, mean_time
                        FROM pg_stat_statements where userid = (select usesysid from pg_user where usename = CURRENT_USER) order by total_time desc limit ${how_many_rows};`);

                    } catch (error) {
                        // older versions
                        response = await sequelize.query(`SELECT query, calls, total_exec_time as total_time, mean_exec_time as mean_time FROM pg_stat_statements where userid = (select usesysid from pg_user where usename = CURRENT_USER) order by total_exec_time desc limit ${how_many_rows};`)
                    }

                    break;
                default:
                    for (const statement of (template.query_analytics ?? [])) {
                        response = await sequelize.query(handlebars.compile(statement)({
                            how_many_rows
                        }));
                    }
            }
    
            // close the connection
            await sequelize.close();
    
            return response?.[0] ?? [];
        }
        
        return [];
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
                        let with_or_without_windows = process.platform === 'win32' ? `set PGPASSWORD=${credentials.DB_PASSWORD} &&` : `PGPASSWORD=${credentials.DB_PASSWORD}`;

                        await execute_commands_async(
                            `${with_or_without_windows} psql -U ${credentials.DB_USER} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -w -d ${credentials.DB_NAME} < ${snapshot_path}`
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
                    let with_or_without_windows = process.platform === 'win32' ? `set PGPASSWORD=${credentials.DB_PASSWORD} &&` : `PGPASSWORD=${credentials.DB_PASSWORD}`;

                    await execute_commands_async(
                        `${with_or_without_windows} pg_dump -U ${credentials.DB_USER} -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -w -d ${credentials.DB_NAME} > ${temp_file_path}`
                    );
                    
                    break;
                }

            case 'mariadb':
            case 'mysql':
                {
                    console.log( `mysqldump -u ${credentials.DB_USER} -p'${credentials.DB_PASSWORD}' -h ${credentials?.DB_HOST ? credentials.DB_HOST : GrizzyDatabaseEngine.get_rds_uri(dialect)} -B ${credentials.DB_NAME} > ${temp_file_path}`)
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