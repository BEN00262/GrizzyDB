export const templates = {
    "mariadb": {
        setup: [
            "CREATE DATABASE IF NOT EXISTS {{database_name}};",
            "CREATE USER '{{database_user}}'@'%' IDENTIFIED BY '{{random_password}}';",
            "GRANT ALL PRIVILEGES ON {{database_name}}.* TO '{{database_user}}'@'%';",
            "FLUSH PRIVILEGES;"
        ],

        triggers: [
            // `CREATE TRIGGER check_database_size_{{database_name}}
            // BEFORE INSERT ON \`{{database_name}}\`.*
            // FOR EACH ROW
            // BEGIN
            //     -- Calculate the current database size
            //     DECLARE db_size INT;
            //     SELECT SUM(data_length + index_length) INTO db_size
            //     FROM information_schema.TABLES
            //     WHERE table_schema = DATABASE();
                
            //     -- Check if the database size exceeds 100 MB
            //     IF db_size > 100 * 1024 * 1024 THEN
            //         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Database size exceeds the allowed limit. Data insertion not permitted.';
            //     END IF;
            // END;`,
    
            // `CREATE TRIGGER check_database_size_{{database_name}}
            // BEFORE UPDATE ON \`{{database_name}}\`.*
            // FOR EACH ROW
            // BEGIN
            //     -- Calculate the current database size
            //     DECLARE db_size INT;
            //     SELECT SUM(data_length + index_length) INTO db_size
            //     FROM information_schema.TABLES
            //     WHERE table_schema = DATABASE();
                
            //     -- Check if the database size exceeds 100 MB
            //     IF db_size > 100 * 1024 * 1024 THEN
            //         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Database size exceeds the allowed limit. Data insertion not permitted.';
            //     END IF;
            // END;`
        ]
    }
}