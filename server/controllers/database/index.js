import { DatabaseModel, DatabaseProvisionModel } from "../../models/index.js";
import { GrizzyDatabaseEngine, GrizzyLLMInstance } from "../../services/index.js";
import { GrizzyDBException, massage_error, massage_response } from "../../utils/index.js";
import CryptoJS from "crypto-js";

export class DatabaseController {
    static async provision_database(req,res) {
        try {
            const { 
                dialect, sample_data_template, 
                custom_schema_template, selected_template 
            } = req.body;

            // let already_provisioned_databases = await DatabaseModel.count({
            //     owner: req.user._id
            // });

            // if (already_provisioned_databases >= 3) {
            //     throw new GrizzyDBException("You are only limited to a max of 3 databases on the BETA version");
            // }

            const credentials = await GrizzyDatabaseEngine.provision_database(dialect);

            // save the credentials
            const database = await DatabaseModel.create({
                name: credentials.DB_NAME,
                dialect, credentials: CryptoJS.AES.encrypt(
                    JSON.stringify(credentials), process.env.MASTER_AES_ENCRYPTION_KEY
                ),
                owner: req.user._id
            });

            // if the database was created with data we have to persist the data
            switch(selected_template) {
                case 'sample':
                    await GrizzyDatabaseEngine.push_schema_and_data_to_database(
                        sample_data_template, dialect, credentials
                    );

                    break;

                case 'custom':
                    await GrizzyDatabaseEngine.push_schema_and_data_to_database(
                        `${custom_schema_template}
                        
                        ${(await GrizzyLLMInstance.generate_sample_data_for_schema(
                            custom_schema_template, [dialect]
                        ))?.[0]?.sql_statements}
                        `, 
                        dialect, credentials
                    );    

                    break;
            }

            return massage_response({
                database: {
                    ...database,
                    credentials: Object.entries(credentials).reduce((acc, [key, value]) => {
                        return [
                            ...acc,
                            {
                                credentialKey: key,
                                value,
                                isHidden: key?.toLowerCase()?.includes('password')
                            }
                        ] 
                    }, [])
                }
            }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async export_database_schema(req, res) {
        try {
            const { database_reference } = req.params;

            const database = await DatabaseModel.findOne({
                _id: database_reference,
                owner: req.user._id
            });

            if (!database) {
                throw new GrizzyDBException("Database not found");
            }

            const credentials = JSON.parse(CryptoJS.AES.decrypt(
                database.credentials, process.env.MASTER_AES_ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8));


            return massage_response({
                schema: await GrizzyDatabaseEngine.export_database_schema(
                    database.dialect, credentials
                )
            }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }
    

    static async query_database(req, res) {
        try {
            const { query, mode } = req.body;

            // get the database being queried
            const database = await DatabaseModel.findOne({
                _id: req.params.database_reference,
                owner: req.user._id
            });

            if (!database) {
                throw new GrizzyDBException("Database not found");
            }

            const credentials = JSON.parse(CryptoJS.AES.decrypt(
                database.credentials, process.env.MASTER_AES_ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8))

            switch (mode) {
                case 'sql':
                    return massage_response({
                        response: await GrizzyDatabaseEngine.query_database(
                            query, database.dialect,
                            credentials
                        )
                    }, res);

                case 'text':
                    return massage_response({
                        response: await GrizzyLLMInstance.query_database_from_prompt(
                            query, database.dialect,
                            credentials
                        )
                    });

                default:
                    throw new GrizzyDBException("Invalid query mode. Should be either 'text' - for AI queries or 'sql' modes")
            }
        } catch (error) {
            return massage_error(error, res);
        }
    }
    

    static async get_available_databases(req, res) {
        try {

            const databases = await DatabaseProvisionModel.find()
                .lean();

            return massage_response({ databases }, res);
        } catch (error) {
            return massage_response(error, res);
        }
    }

    static async delete_database(req, res) {
        try {
            const { database_reference } = req.params;

            const database = await DatabaseModel.findOne({
                _id: database_reference,
                owner: req.user._id
            });

            if (!database) {
                throw new GrizzyDBException("Database not found");
            }

            const credentials = JSON.parse(CryptoJS.AES.decrypt(
                database.credentials, process.env.MASTER_AES_ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8));

            await GrizzyDatabaseEngine.delete_database(database.dialect, credentials);

            // delete the record
            await DatabaseModel.deleteOne({ _id: database._id });

            return massage_response({ status: true }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async get_databases(req, res) {
        try {
            let databases = await DatabaseModel.find({ owner: req.user._id }).lean();

            // decrypt the credentials on the fly
            databases = (databases ?? []).map(({ credentials, ...rest }) => ({
                ...rest,
                credentials: Object.entries(JSON.parse(CryptoJS.AES.decrypt(
                    credentials, process.env.MASTER_AES_ENCRYPTION_KEY
                ).toString(CryptoJS.enc.Utf8))).reduce((acc, [key, value]) => {
                    return [
                        ...acc,
                        {
                            credentialKey: key,
                            value,
                            isHidden: key?.toLowerCase()?.includes('password')
                        }
                    ] 
                }, [{
                    credentialKey: 'HOST',
                    value: GrizzyDatabaseEngine.get_rds_uri(rest.dialect),
                    isHidden: false
                }])
            }));

            return massage_response({ databases }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }
}