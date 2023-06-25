export const templates = {
    "postgres": {
        setup: [
            "CREATE DATABASE {{database_name}};",
            "CREATE USER {{database_user}} WITH PASSWORD '{{random_password}}';",
            "CREATE ROLE \"{{database_user}}\" WITH LOGIN PASSWORD '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON DATABASE {{database_name}} TO {{database_user}};",
            // "FLUSH PRIVILEGES;"
        ],

        triggers: []
    },


    "mysql": {
        setup: [
            "CREATE DATABASE IF NOT EXISTS {{database_name}};",
            "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
            "FLUSH PRIVILEGES;"
        ],

        triggers: []
    },

    "mariadb": {
        setup: [
            "CREATE DATABASE IF NOT EXISTS {{database_name}};",
            "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
            "FLUSH PRIVILEGES;"
        ],

        triggers: []
    }
}