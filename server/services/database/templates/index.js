export const templates = {
    "postgres": {
        setup: [
            "CREATE DATABASE {{database_name}};",
            "CREATE USER {{database_user}} WITH PASSWORD '{{random_password}}';",
            "CREATE ROLE \"{{database_user}}\" WITH LOGIN PASSWORD '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON DATABASE {{database_name}} TO {{database_user}};",
            // "FLUSH PRIVILEGES;"
        ],

        list_databases: "SELECT datname FROM pg_database;",
        base_database: "postgres",

        // used to get schema version on a high scale
        schema_version: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';",

        triggers: [],
    },


    "mysql": {
        setup: [
            "CREATE DATABASE IF NOT EXISTS {{database_name}};",
            "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
            "FLUSH PRIVILEGES;"
        ],

        list_databases: "SHOW DATABASES;",
        base_database: "mysql",

        schema_version: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = DATABASE();",

        triggers: []
    },

    "mariadb": {
        setup: [
            "CREATE DATABASE IF NOT EXISTS {{database_name}};",
            "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
            "FLUSH PRIVILEGES;"
        ],

        list_databases: "SHOW DATABASES;",
        base_database: "mysql",

        schema_version: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = DATABASE();",

        triggers: []
    }
}