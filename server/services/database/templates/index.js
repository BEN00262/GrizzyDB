export const templates = {
  postgres: {
    setup: [
      "CREATE DATABASE {{database_name}};",
      "CREATE USER {{database_user}} WITH PASSWORD '{{random_password}}';",
      "CREATE ROLE \"{{database_user}}\" WITH LOGIN PASSWORD '{{random_password}}';",
      "GRANT ALL PRIVILEGES ON DATABASE {{database_name}} TO {{database_user}};",
      // "FLUSH PRIVILEGES;"
    ],

    list_databases: "SELECT datname FROM pg_database;",
    base_database: "postgres",

    reassign_database: [],
    query_analytics: [
      "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;",
      `SELECT query, calls, total_time, mean_time
            FROM pg_stat_statements where userid = (select usesysid from pg_user where usename = CURRENT_USER) order by total_time desc limit {{how_many_rows}};`,
    ],

    // used to get schema version on a high scale
    schema_version:
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';",

    triggers: [],
  },

  mysql: {
    setup: [
      "CREATE DATABASE IF NOT EXISTS {{database_name}};",
      "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
      "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
      `GRANT SELECT ON performance_schema.events_statements_summary_by_digest TO '{{database_user}}'@'%';`,
      "FLUSH PRIVILEGES;",
    ],

    list_databases: "SHOW DATABASES;",
    base_database: "mysql",

    reassign_database: [
      "FLUSH PRIVILEGES;",
      "CREATE DATABASE IF NOT EXISTS {{database_name}};",
      "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
      "FLUSH PRIVILEGES;",
    ],

    // we have to grant this user permissions, for viewing the metrics first
    query_analytics: [
      `SELECT 
            DIGEST_TEXT AS query,
            COUNT_STAR AS calls,
            SUM_TIMER_WAIT / 1e12 AS total_time, -- Convert picoseconds to seconds
            AVG_TIMER_WAIT / 1e12 AS mean_time   -- Convert picoseconds to seconds
          FROM 
            performance_schema.events_statements_summary_by_digest
          WHERE
            SCHEMA_NAME = DATABASE()  -- Optional: filter by database
          GROUP BY 
            DIGEST_TEXT
          ORDER BY 
            total_time DESC
          LIMIT {{how_many_rows}};`,
    ],

    schema_version:
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = DATABASE();",

    triggers: [],
  },

  mariadb: {
    setup: [
      "CREATE DATABASE IF NOT EXISTS {{database_name}};",
      "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
      "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
      `GRANT SELECT ON performance_schema.events_statements_summary_by_digest TO '{{database_user}}'@'%';`,
      "FLUSH PRIVILEGES;",
    ],

    reassign_database: [
      "FLUSH PRIVILEGES;",
      "CREATE DATABASE IF NOT EXISTS {{database_name}};",
      "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
      "FLUSH PRIVILEGES;",
    ],

    query_analytics: [
      `SELECT 
              DIGEST_TEXT AS query,
              COUNT_STAR AS calls,
              SUM_TIMER_WAIT / 1e12 AS total_time, -- Convert picoseconds to seconds
              AVG_TIMER_WAIT / 1e12 AS mean_time   -- Convert picoseconds to seconds
            FROM 
              performance_schema.events_statements_summary_by_digest
            WHERE
              SCHEMA_NAME = DATABASE()  -- Optional: filter by database
            GROUP BY 
              DIGEST_TEXT
            ORDER BY 
              total_time DESC
            LIMIT {{how_many_rows}};`,
    ],

    list_databases: "SHOW DATABASES;",
    base_database: "mysql",

    schema_version:
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = DATABASE();",

    triggers: [],
  },
};
