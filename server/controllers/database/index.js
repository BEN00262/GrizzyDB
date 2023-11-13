import { ApiKeyModel, DatabaseModel, DatabaseProvisionModel, FolderModel, SnapshotModel } from "../../models/index.js";
import { GrizzyDatabaseEngine, GrizzyLLMInstance } from "../../services/index.js";
import { GrizzyDBException, get_installation_instructions_markdown, massage_error, massage_response } from "../../utils/index.js";
import CryptoJS from "crypto-js";
import LzString from 'lz-string';
import md5 from 'md5';
import { nanoid } from 'nanoid';
import { generateApiKey } from 'generate-api-key';
import humanTime from 'human-time';
import mongoose from 'mongoose';

export class DatabaseController {
    static async create_folder(req, res) {
        try {
            const { name, databases_to_add_to_folder } = req.body;
            const { parent_folder } = req.params;

            const folder = await FolderModel.create({
                name,
                owner: req.user._id,
                ...(parent_folder ? { parent: parent_folder } : {})
            });

            // we can get a bunch of databases to add to the created folder
            await Promise.allSettled(
                databases_to_add_to_folder.map(async x => {
                    await DatabaseModel.findOneAndUpdate({ _id: x }, { $set: { folder: folder._id } });
                })
            )

            return massage_response({ folder }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async move_to_folder(req, res) {
        try {
            const { folder, database_reference } = req.body;

            // get the folder, ensure we own it and then add the db to it 
            const [_folder, database] = await Promise.all([
                FolderModel.findOne({ _id: folder, owner: req.user._id }),
                DatabaseModel.findOne({ _id: database_reference, owner: req.user._id })
            ]);
            
            if (_folder && database) {
                database.folder = _folder._id;
                await database.save()
            }

            return massage_response({ status: true }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async move_out_of_folder(req, res) {
        try {
            const { database_reference } = req.body;

            // get the folder, ensure we own it and then add the db to it 
            const database = await DatabaseModel.findOne({ _id: database_reference, owner: req.user._id });
            
            if (database) {
                database.folder = null;
                await database.save()
            }

            return massage_response({ status: true }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async provision_database(req,res) {
        try {
            const { parent_folder } = req.params;

            const { 
                dialect, sample_data_template, 
                custom_schema_template, selected_template
            } = req.body;

            let already_provisioned_databases = await DatabaseModel.count({
                owner: req.user._id
            });

            if (already_provisioned_databases >= 3) {
                throw new GrizzyDBException("You are only limited to a max of 3 databases on the BETA version");
            }

            // check what we have first
            if (selected_template === 'bring_your_own') {
                // we dont have credentials at this point 
                const database = await DatabaseModel.create({
                    // we need to pass the name somehow
                    name: `schema-${nanoid(16)}`,
                    product_type: 'bring_your_own',
                    dialect,
                    owner: req.user._id,
                    ...(parent_folder ? { folder: parent_folder } : {}),
                    credentials: CryptoJS.AES.encrypt(
                        JSON.stringify({}), process.env.MASTER_AES_ENCRYPTION_KEY
                    )
                });

                return massage_response({
                    database: {
                        ...database,
                        credentials: []
                    }
                }, res);
            }

            const credentials = await GrizzyDatabaseEngine.provision_database(dialect);

            // save the credentials
            const database = await DatabaseModel.create({
                name: credentials.DB_NAME,
                product_type: 'hosted',
                dialect, credentials: CryptoJS.AES.encrypt(
                    JSON.stringify(credentials), process.env.MASTER_AES_ENCRYPTION_KEY
                ),
                ...(parent_folder ? { folder: parent_folder } : {}),
                owner: req.user._id
            });

            // create a snapshot

            // check if product type is set and also the selected template

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
                        ))?.filter(u => u)?.map(({ sql_statements }) => sql_statements).join("\n\n")}
                        `, 
                        dialect, credentials
                    );    

                    break;
            }

            // create snapshot
            const schema_generated = JSON.stringify(
                await GrizzyDatabaseEngine.export_database_schema(
                    database.dialect, credentials
                )
            );

            let schema_version_checksum = md5(schema_generated);

            await SnapshotModel.create({
                checksum: schema_version_checksum,
                database: database._id,
                owner: req.user._id,
                snapshot: LzString.compressToBase64(schema_generated)
            });

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

    static async generate_schema_diffs(req, res) {
        try {
            const { main_schema, base_schema } = req.params;

            const [main, base] = await Promise.all([
                SnapshotModel.findOne({
                    _id: main_schema,
                    owner: req.user._id
                }),

                SnapshotModel.findOne({
                    _id: base_schema,
                    owner: req.user._id
                })
            ]);

            if (!main || !base) {
                return massage_response({ 
                    diff_tree: JSON.parse(
                        LzString.decompressFromBase64((main ?? base)?.snapshot)
                    )
                }, res);
            }

            return massage_response({ 
                diff_tree: GrizzyDatabaseEngine.generate_schema_diffs(
                    JSON.parse(LzString.decompressFromBase64(main.snapshot)),
                    JSON.parse(LzString.decompressFromBase64(base.snapshot))
                )
            }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async update_database_metadata(req, res) {
        try {
            const { database_reference } = req.params;
            const { name } = req.body;

            const database = await DatabaseModel.findOne({
                _id: database_reference,
                owner: req.user._id
            });

            if (!database) {
                throw new GrizzyDBException("Database not found");
            }

            database.name = name;
            await database.save();

            return massage_response({ status: true }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    // protected by an api key
    static async update_self_hosted_schemas(req, res) {
        try {
            const { database_reference } = req.params;
            const { db_graph } = req.body;

            // check if the supplied db matches the owner from the api key
            const database = await DatabaseModel.findOne({
                _id: database_reference,
                owner: req.user._id
            });

            if (!database) {
                throw new GrizzyDBException("Database not found");
            }

            if (database.product_type !== 'bring_your_own') {
                throw new GrizzyDBException("Only self-hosted databases can be monitored externally");
            }

            let current_schema = (await SnapshotModel.find({
                database: database_reference,
                owner: req.user._id
            }).sort({ _id: -1 }).limit(1).lean())?.[0];

            if (current_schema) {
                let schema_version_checksum = md5(JSON.stringify(db_graph));

                if (schema_version_checksum !== current_schema?.checksum) {
                    current_schema = await SnapshotModel.create({
                        checksum: schema_version_checksum,
                        database: database_reference,
                        owner: req.user._id,
                        snapshot: LzString.compressToBase64(
                            JSON.stringify(db_graph)
                        )
                    })
                }
            } else {
                current_schema = await SnapshotModel.create({
                    database: database_reference,
                    owner: req.user._id,
                    snapshot: LzString.compressToBase64(
                        JSON.stringify(db_graph)
                    )
                })
            }

            return massage_response({ status: true }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async get_monitor_installation(req, res) {
        try {
            const { database_reference } = req.params;

            const database = await DatabaseModel.findOne({
                _id: database_reference,
                owner: req.user._id
            });

            if (!database) {
                throw new GrizzyDBException("Database not found");
            }

            if (database.product_type !== 'bring_your_own') {
                throw new GrizzyDBException("Only self-hosted databases can be monitored externally");
            }

            // check if they have any api key
            let apiKey = await ApiKeyModel.findOne({
                owner: req.user._id,
            });

            if (!apiKey) {
                apiKey = await ApiKeyModel.create({
                    owner: req.user._id,
                    apikey: generateApiKey({
                        method: 'string',
                        length: 32,
                        prefix: 'grizzydb_'
                    })
                })
            }

            return massage_response({
                instructions: await get_installation_instructions_markdown({
                    db_dialect: database.dialect,
                    apiKey: apiKey.apikey
                })
            }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async get_database_snapshot(req, res) {
        try {
            const { snapshot_reference } = req.params;

            const snapshot = await SnapshotModel.findOne({
                _id: snapshot_reference,
                owner: req.user._id
            });

            if (!snapshot) {
                return massage_error(
                    new GrizzyDBException("Snapshot not found"), 
                    res, 404
                );
            }

            return massage_response({ 
                snapshot: {
                    ...snapshot,
                    snapshot: JSON.parse(
                        LzString.decompressFromBase64(snapshot.snapshot)
                    )
                }
            }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async get_database_snapshots(req, res) {
        try {
            const { database_reference } = req.params;

            const snapshots = await SnapshotModel.find({
                database: database_reference,
                owner: req.user._id
            }).select('_id checksum createdAt updatedAt').sort({ _id: -1 /* descending order latest to oldest */}).lean();

            return massage_response({ 
                snapshots: (snapshots ?? []).map(x => ({
                    ...x,
                    humanTime: humanTime(x.updatedAt)
                })) 
            }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    // this should be run through socketio -- might be a while
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

            // check if its valid to generate any schema
            let current_schema = (await SnapshotModel.find({
                database: database_reference,
                owner: req.user._id
            }).sort({ _id: -1 }).limit(1).lean())?.[0];

            if (database?.product_type === 'bring_your_own') {
                return massage_response({
                    schema: current_schema ? JSON.parse(
                        LzString.decompressFromBase64(current_schema.snapshot)
                    ) : {
                        edgeConfigs: [],
                        schemaColors: {},
                        tablePositions: {},
                        tables: []
                    }
                }, res);
            }

            const credentials = JSON.parse(CryptoJS.AES.decrypt(
                database.credentials, process.env.MASTER_AES_ENCRYPTION_KEY
            ).toString(CryptoJS.enc.Utf8));


            if (current_schema) {
                let hot_schema_version = await GrizzyDatabaseEngine.get_database_schema_version(
                    database.dialect,
                    credentials
                );

                if (hot_schema_version) {
                    let schema_version_checksum = md5(hot_schema_version);

                    if (schema_version_checksum !== current_schema?.checksum) {
                        // we get the schema but this might take time --> need to move this to a socketio thing
                        const schema_generated = await GrizzyDatabaseEngine.export_database_schema(
                            database.dialect, credentials
                        );

                        // save it
                        current_schema = await SnapshotModel.create({
                            checksum: schema_version_checksum,
                            database: database_reference,
                            owner: req.user._id,
                            snapshot: LzString.compressToBase64(
                                JSON.stringify(schema_generated)
                            )
                        })
                    }
                }
            } else {
                // we get the schema but this might take time --> need to move this to a socketio thing
                const schema_generated = await GrizzyDatabaseEngine.export_database_schema(
                    database.dialect, credentials
                );

                current_schema = await SnapshotModel.create({
                    database: database_reference,
                    owner: req.user._id,
                    snapshot: LzString.compressToBase64(
                        JSON.stringify(schema_generated)
                    )
                })
            }

            return massage_response({
                schema: JSON.parse(
                    LzString.decompressFromBase64(current_schema.snapshot)
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
            let [databases, folders] = await Promise.all([
                DatabaseModel.find({ 
                    owner: req.user._id,
                    folder: req.params.folder ? req.params.folder : null 
                }).sort({ createdAt: -1 }).lean(),
                FolderModel.find({ owner: req.user._id, parent: req.params.folder ?? null })
                    .sort({ createdAt: -1 }).lean()
            ]);

            // decrypt the credentials on the fly
            databases = (databases ?? []).map(({ credentials, ...rest }) => ({
                ...rest,
                credentials: rest.product_type === 'bring_your_own' ? [] : Object.entries(JSON.parse(CryptoJS.AES.decrypt(
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

            return massage_response({ databases, folders }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async get_database(req, res) {
        try {
            let database = (await DatabaseModel.findOne({ 
                owner: req.user._id,
                _id: req.params.database_reference
            }).lean()) ?? {};

            // decrypt the credentials on the fly
            database = {
                ...database,
                credentials: database.product_type === 'bring_your_own' ? [] : Object.entries(JSON.parse(CryptoJS.AES.decrypt(
                    database.credentials, process.env.MASTER_AES_ENCRYPTION_KEY
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
                    value: GrizzyDatabaseEngine.get_rds_uri(database.dialect),
                    isHidden: false
                }])
            };

            return massage_response({ database }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }
}