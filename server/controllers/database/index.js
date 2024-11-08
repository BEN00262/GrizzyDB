import {
  ApiKeyModel,
  DatabaseModel,
  DatabaseProvisionModel,
  FDWBucketModel,
  FolderModel,
  PricingModel,
  QuickAccessModel,
  SnapshotModel,
  SnippetModel,
  SubscriptionModel,
} from "../../models/index.js";

import {
  GrizzyDatabaseEngine,
  GrizzyLLMInstance,
} from "../../services/index.js";

import {
  GrizzyDBException,
  delete_sql_dump_file,
  generate_signed_url_helper,
  get_installation_instructions_markdown,
  massage_error,
  massage_response,
  morph_name_to_valid_database_name,
} from "../../utils/index.js";
import CryptoJS from "crypto-js";
import LzString from "lz-string";
import md5 from "md5";
import { nanoid } from "nanoid";
import { generateApiKey } from "generate-api-key";
import humanTime from "human-time";
import { sendToSnapshotGeneratorQueue } from "../../rabbitmq/client.js";
import {LemonSqueezy} from "@lemonsqueezy/lemonsqueezy.js";
import moment from "moment";
import mongoose from 'mongoose';


const lemon_squeezy_payments_gateway = new LemonSqueezy(process.env.LEMONSQUEEZY_API_KEY);

async function check_if_has_active_subscription(req) {
  const active_subscription = await SubscriptionModel.count({
    owner: req.user._id,
    status: 'paid',
    endTime: {
      $gte: moment()
    }
  });

  if (!active_subscription) {
    let already_provisioned_databases = await DatabaseModel.count({
      owner: req.user._id,
    });

    if (already_provisioned_databases >= 3) {
      throw new GrizzyDBException(
        "You are only limited to a max of 3 databases on the free tier"
      );
    }
  }
}

export class DatabaseController {
  static async create_fdw_bucket(req, res) {
    try {
      // we will allow someone to initialize with a bunch of dbs to begin with
      const { name, dialect, databases } = req.body;
      const { parent_folder } = req.params;

      // await check_if_has_active_subscription(req);

      if (!Array.isArray(databases)) {
        throw new GrizzyDBException('databases should be an array');
      }

      // create the bucket
      const credentials = await GrizzyDatabaseEngine.provision_database(dialect);
      // const random_folder_uuid = new mongoose.ObjectId();

      // console.log(random_folder_uuid)

      const database = await DatabaseModel.create({
        name: credentials.DB_NAME,
        product_type: "bucket",
        dialect,
        credentials: CryptoJS.AES.encrypt(
          JSON.stringify(credentials),
          process.env.MASTER_AES_ENCRYPTION_KEY
        ),

        // hide this ones
        // TODO: FIXME
        folder: '5f64a5f8f59b9a1bf6a5e789', // new mongoose.ObjectId(), // random value so that its not attached to any folder, doesn't need to
        owner: req.user._id,
      });

      // we have the parent node, we need the children nodes
      await FDWBucketModel.create({
        name,
        parent_node: database._id,
        child_nodes: databases,
        ...(parent_folder ? { folder: parent_folder } : {}),
        owner: req.user._id,
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async add_databases_to_fdw_bucket(req, res) {
    try {
      const { bucket_reference, database_reference } = req.params;

      const bucket = await FDWBucketModel.findOneAndUpdate({
        _id: bucket_reference,
        owner: req.user._id,
      }, {
        $addToSet: {
          child_nodes: database_reference
        }
      }, { new: true });

      const [parent, child] = await Promise.all([
        DatabaseModel.findOne({
          _id: bucket.parent_node,
          owner: req.user.id
        }),

        DatabaseModel.findOne({
          _id: database_reference,
          owner: req.user.id
        })
      ]);

      const parent_credentials = JSON.parse(
        CryptoJS.AES.decrypt(
          parent.credentials,
          process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
      );

      const child_credentials = JSON.parse(
        CryptoJS.AES.decrypt(
          child.credentials,
          process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
      );

      await GrizzyDatabaseEngine.push_databases_to_fdw_bucket(
        {
          credentials: parent_credentials,
          dialect: parent.dialect
        },

        {
          credentials: child_credentials,
          dialect: child.dialect
        }
      )

      // trigger some sort of a job to connect
      // get the parent, child then pass to the service function


      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async remove_database_from_fdw_bucket(req, res) {
    try {
      const { bucket_reference, database_reference } = req.params;

      await FDWBucketModel.updateOne({
        _id: bucket_reference,
        owner: req.user._id,
      }, {
        $pull: {
          child_nodes: database_reference
        }
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async delete_fdw_bucket(req, res) {
    try {
      // we will remove the connections then delete the bucket, retain the databases though
      // TODO: finish up on this

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }



  static async get_query_analytics(req, res) {
    try {
      const { database_reference } = req.params;

      const database = await DatabaseModel.findOne({
        owner: req.user._id,
        _id: database_reference
      });

      let queries = [];

      if (database) {
        const credentials = JSON.parse(
          CryptoJS.AES.decrypt(
            database.credentials,
            process.env.MASTER_AES_ENCRYPTION_KEY
          ).toString(CryptoJS.enc.Utf8)
        );

        queries = await GrizzyDatabaseEngine.get_query_analytics(
          database.dialect,
          10, credentials
        );
      }

      return massage_response({ queries }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  // SNIPPETS
  static async get_snippets(req, res) {
    try {
      const snippets = await SnippetModel.find({
        owner: req.user._id
      });

      return massage_response({ snippets }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async create_snippet(req, res) {
    try {
      const { database_reference } = req.params;
      const { name, snippet } = req.body;

      // ensure the guy owns the database first
      const database_is_mine = await DatabaseModel.count({
        _id: database_reference,
        owner: req.user._id
      });

      if (!database_is_mine) {
        // throw an error
        throw new GrizzyDBException("You don't have rights to add snippets to the given database");
      }

      await SnippetModel.create({
        name,
        snippet,
        database: database_reference,
        owner: req.user._id
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async delete_snippet(req, res) {
    try {
      const { snippet_reference } = req.params;

      await SnippetModel.deleteOne({
        _id: snippet_reference,
        owner: req.user._id
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async update_snippet(req, res) {
    try {
      const { snippet_reference } = req.params;
      const { name, snippet } = req.body;

      await SnippetModel.updateOne({ _id: snippet_reference, owner: req.user._id }, {
        name,
        snippet
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async execute_snippet(req, res) {
    try {
      // get the snippet then execute it
      const { snippet_reference } = req.params;

      const snippet = await SnippetModel.findOne({
        _id: snippet_reference,
        owner: req.user._id
      }).populate('database');

      if (!snippet) {
        throw new GrizzyDBException("Failed to find the requested snippet");
      }

      // we get the database attached
      const credentials = JSON.parse(
        CryptoJS.AES.decrypt(
          snippet.database.credentials,
          process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
      );

      const response = await GrizzyDatabaseEngine.query_database(
        snippet.snippet,
        snippet.database.dialect,
        credentials
      );

      return massage_response({ response }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }


  // PAYMENTS
  static async get_pricing_deals(req, res) {
    try {

      const pricing_deals = await PricingModel.find({
        enabled: true
      });

      return massage_response({ pricing_deals }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }


  static async initiate_payment(req, res) {
    try {
      const { pricing_deal_reference, duration } = req.params;

      // get the deal first
      const deal = await PricingModel.findOne({
        _id: pricing_deal_reference
      });

      if (!deal) {
        throw new GrizzyDBException("Invalid pricing reference");
      }

      let attributes = {
        checkout_data: {
          custom: {
            user_id: req.user._id.toString(),
            payment_reference: nanoid(64)
          }
        },

        product_options: {
          redirect_url: `${process.env.FRONTEND_UI_URL}/dashboard`
        },

        checkout_options: {
          dark: true,
          logo: true
        }
      }
      
      // get the value from the frontend
      // we offer yearly subscriptions also

      const checkout = await lemon_squeezy_payments_gateway.createCheckout({ 
        storeId: 60226, variantId: duration === 'yearly' ? +deal.yVariantID : +deal.variantID /* this one is dynamic */, attributes 
      });

      if (!checkout?.data?.attributes?.url) {
        throw new GrizzyDBException("Failed to initialize checkout");
      }

      return massage_response({ checkout_link: checkout?.data?.attributes?.url }, res);
    } catch (error){
      return massage_error(error, res);
    }
  }


  static async payment_webhook_handler(req, res) {
    try {
      const { meta: { custom_data: { user_id, payment_reference }, event_name } } = req.body;

      switch (event_name) {
        case 'subscription_payment_success': {
          await SubscriptionModel.create({
            owner: user_id,
            reference: payment_reference,
            status: 'paid',

            // we have to get the dates from the subscription object
            endTime: moment().add(30, 'days')
          });

          break;
        }
      }

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async check_if_in_active_subscription(req, res) {
    try {
      const active_subscription = await SubscriptionModel.count({
        owner: req.user._id,
        status: 'paid',
        endTime: {
          $gte: moment()
        }
      });

      return massage_response({ is_subscribed: active_subscription > 0 }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async search_files_and_folders(req, res) {
    // we need a couple of stuff -- i guess

    try {
      const { query } = req.query;

      if (!query) {
        return massage_response({
          databases: [],
          folders: []
        }, res);
      }

      // use $search now
      const [databases, folders] = await Promise.all([
        DatabaseModel.aggregate([
          {
            $search: {
              compound: {
                should: [
                  {
                    text: {
                      query,
                      path: 'name',
                      fuzzy: { maxEdits: 2 }
                    }
                  }
                ]
              }
            }
          },
          {
            $match: {
              owner: req.user._id
            }
          }
        ]),

        FolderModel.aggregate([
          {
            $search: {
              compound: {
                should: [
                  {
                    text: {
                      query,
                      path: 'name',
                      fuzzy: { maxEdits: 2 }
                    }
                  }
                ]
              }
            }
          },
          {
            $match: {
              owner: req.user._id
            }
          }
        ])
      ]);

      return massage_response({ databases, folders }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async add_to_quick_access(req, res) {
    try {
      let { quick_links } = req.body;

      // can get a bunch at the same time
      const last_record = await QuickAccessModel.findOne({
        owner: req.user._id
      }).sort([['position', -1]]).select('position');


      // loop through the quick links and add a position value
      quick_links = quick_links.map((x, position) => ({
        ...x,
        owner: req.user._id,
        position: +(last_record?.position ?? 0) + position + 1
      }));

      await QuickAccessModel.insertMany(quick_links);

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  // static async update_quick_links(req, res) {
  //   try {
  //     let { quick_links } = req.body;

  //     QuickAccessModel.up

  //     return massage_response({ status: true }, res);
  //   } catch (error) {
  //     return massage_error(error, res);
  //   }
  // }

  static async remove_from_quick_access(req, res) {
    try {
      await QuickAccessModel.deleteOne({
        _id: req.params.quick_access_reference,
        owner: req.user._id
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async get_quick_access_records(req, res) {
    try {
      const quick_accesses = await QuickAccessModel.find({
        owner: req.user._id
      }).populate('database').sort([['position', 1]]);

      return massage_response({ quick_accesses }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }


  static async switch_to_snapshot(req, res) {
    try {
      const { snapshot_reference } = req.params;

      const point_in_time_snapshot = await SnapshotModel.findOne({
        _id: snapshot_reference
      });

      // save current as latest snapshot before rehydrating the DB
      const snapshot = await SnapshotModel.create({
        status: 'scheduled',
        checksum: md5(`${Date.now}`), // this is a placeholder checksum
        database: point_in_time_snapshot.database,
        owner: req.user._id,
        snapshot: LzString.compressToBase64("{}")
      });

      await sendToSnapshotGeneratorQueue({ 
        database_id: snapshot.database,
        snapshot_id: snapshot._id,
        task: 'rehydrate',
        rehydrate_snapshot_id: snapshot_reference
      });

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_response(error, res);
    }
  }

  static async delete_snapshot(req, res) {
    try {
      const snapshot = await SnapshotModel.findOne({
        _id: req.params.snapshot_id,
        owner: req.user._id
      });

      if (snapshot) {
        await snapshot.deleteOne();

        if (snapshot.url_to_dump) {
          // delete s3 record
          await delete_sql_dump_file(snapshot.url_to_dump);
        }
      }

      // delete the snapshot from s3

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async export_snapshot(req, res) {
    try {
      // get a signed link and send it to the ui
      const { snapshot_reference } = req.params;

      const snapshot = await SnapshotModel.findOne({
        _id: snapshot_reference
      });

      if (!snapshot) {
        return massage_error(
          new GrizzyDBException("Failed to find snapshot"), res, 404
        );
      }

      return massage_response({
        download_link: await generate_signed_url_helper(
          snapshot.url_to_dump
        )
      }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }


  // support for sniffing databases given a connection
  // used by drop down to allow user to select dbs they want to import
  static async get_all_databases_with_credentials(req, res) {
    try {
      const { credentials, dialect } = req.body;

      return massage_response({
        databases: await GrizzyDatabaseEngine.get_databases_given_credentials(
          dialect, credentials
        )
      }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async import_databases_to_grizzy(req, res) {
    try {
      const { parent_folder } = req.params; // might be relevant i guess :)
      let { credentials, dialect, databases_selected = [] } = req.body;

      if (!databases_selected.length) {
        databases_selected = await GrizzyDatabaseEngine.get_databases_given_credentials(
          dialect, credentials
        );
      }

      // ensure they cannot provision more dbs on the free tier
      const active_subscription = await SubscriptionModel.count({
        owner: req.user._id,
        status: 'paid',
        endTime: { $gte: moment() }
      });

      if (!active_subscription) {
        let already_provisioned_databases = await DatabaseModel.count({
          owner: req.user._id,
        });
  
        if (already_provisioned_databases >= 3) {
          throw new GrizzyDBException(
            "You are only limited to a max of 3 databases on the free tier"
          );
        }
      }

      if (databases_selected.length === 1) {
        const database = databases_selected[0];

        const actual_credentials = await GrizzyDatabaseEngine.provision_database(dialect);

        const created_database = await DatabaseModel.create({
          name: database,
          product_type: "hosted", // not really hosted bu we can use this
          dialect,

          credentials: CryptoJS.AES.encrypt(
            JSON.stringify(actual_credentials),
            process.env.MASTER_AES_ENCRYPTION_KEY
          ),

          ...(parent_folder ? { parent: parent_folder } : {}),
          owner: req.user._id,
        });

        // create a snapshot
        const snapshot = await SnapshotModel.create({
          status: 'scheduled',
          checksum: md5(`${Date.now}`), // this is a placeholder checksum
          database: created_database._id,
          owner: req.user._id,
          snapshot: LzString.compressToBase64("{}")
        });

        // we have to import the data then rehydrate the database with it
        await sendToSnapshotGeneratorQueue({ 
          database_id: created_database._id,
          snapshot_id: snapshot._id,
          task: 'import',
          remote_actual_credentials: {
            ...credentials,
            DB_NAME: database
          }
        });

      } else {
        const folder = await FolderModel.create({
          name: `${credentials.DB_USER}-${Date.now()}`,
          owner: req.user._id,
          ...(parent_folder ? { parent: parent_folder } : {}),
        });

        // create the databases :)
        await Promise.allSettled(
          databases_selected.map(async database => {
            const created_database = await DatabaseModel.create({
              name: database,
              product_type: "hosted", // not really hosted bu we can use this
              dialect,

              credentials: CryptoJS.AES.encrypt(
                JSON.stringify({ ...credentials, DB_NAME: database }),
                process.env.MASTER_AES_ENCRYPTION_KEY
              ),

              folder: folder._id,
              owner: req.user._id,
            });

            const snapshot = await SnapshotModel.create({
              status: 'scheduled',
              checksum: md5(`${Date.now}`), // this is a placeholder checksum
              database: created_database._id,
              owner: req.user._id,
              snapshot: LzString.compressToBase64("{}")
            });

            await sendToSnapshotGeneratorQueue({ 
              database_id: created_database._id,
              snapshot_id: snapshot._id,
              task: 'import',
              remote_actual_credentials: {
                ...credentials,
                DB_NAME: database
              }
            });
          })
        );
      }

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }


  static async import_database_from_external_source(req, res) {
    try {
      const { parent_folder } = req.params; // might be relevant i guess :)
      let { credentials, dialect, databases_selected = [] } = req.body;

      if (!databases_selected.length) {
        databases_selected = await GrizzyDatabaseEngine.get_databases_given_credentials(
          dialect, credentials
        );
      }

      if (databases_selected.length === 1) {
        const database = databases_selected[0];

        const created_database = await DatabaseModel.create({
          name: database,
          product_type: "hosted", // not really hosted bu we can use this
          dialect,

          credentials: CryptoJS.AES.encrypt(
            JSON.stringify({ ...credentials, DB_NAME: database }),
            process.env.MASTER_AES_ENCRYPTION_KEY
          ),

          ...(parent_folder ? { parent: parent_folder } : {}),
          owner: req.user._id,
        });

        // create a snapshot
        const snapshot = await SnapshotModel.create({
          status: 'scheduled',
          checksum: md5(`${Date.now}`), // this is a placeholder checksum
          database: created_database._id,
          owner: req.user._id,
          snapshot: LzString.compressToBase64("{}")
        });

        await sendToSnapshotGeneratorQueue({ 
          database_id: created_database._id,
          snapshot_id: snapshot._id,
          task: 'snapshot'
        });
      } else {
        const folder = await FolderModel.create({
          name: `${credentials.DB_USER}-${Date.now()}`,
          owner: req.user._id,
          ...(parent_folder ? { parent: parent_folder } : {}),
        });

        // create the databases :)
        await Promise.allSettled(
          databases_selected.map(async database => {
            const created_database = await DatabaseModel.create({
              name: database,
              product_type: "hosted", // not really hosted bu we can use this
              dialect,

              credentials: CryptoJS.AES.encrypt(
                JSON.stringify({ ...credentials, DB_NAME: database }),
                process.env.MASTER_AES_ENCRYPTION_KEY
              ),

              folder: folder._id,
              owner: req.user._id,
            });

            // create a snapshot
            const snapshot = await SnapshotModel.create({
              status: 'scheduled',
              checksum: md5(`${Date.now}`), // this is a placeholder checksum
              database: created_database._id,
              owner: req.user._id,
              snapshot: LzString.compressToBase64("{}")
            });

            await sendToSnapshotGeneratorQueue({ 
              database_id: created_database._id,
              snapshot_id: snapshot._id,
              task: 'snapshot'
            });
          })
        );

        await Promise.allSettled(
          databases.map(async database => {
            await sendToSnapshotGeneratorQueue({ database_id: database._id, task: 'snapshot' });
          })
        )
      }

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async create_folder(req, res) {
    try {
      const { name, databases_to_add_to_folder } = req.body;
      const { parent_folder } = req.params;

      const folder = await FolderModel.create({
        name,
        owner: req.user._id,
        ...(parent_folder ? { parent: parent_folder } : {}),
      });

      // we can get a bunch of databases to add to the created folder
      await Promise.allSettled(
        databases_to_add_to_folder.map(async (x) => {
          await DatabaseModel.findOneAndUpdate(
            { _id: x },
            { $set: { folder: folder._id } }
          );
        })
      );

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
        DatabaseModel.findOne({ _id: database_reference, owner: req.user._id }),
      ]);

      if (_folder && database) {
        database.folder = _folder._id;
        await database.save();
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
      const database = await DatabaseModel.findOne({
        _id: database_reference,
        owner: req.user._id,
      });

      if (database) {
        database.folder = null;
        await database.save();
      }

      return massage_response({ status: true }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async provision_database(req, res) {
    try {
      const { parent_folder } = req.params;

      const {
        dialect,
        sample_data_template,
        custom_schema_template,
        selected_template,
      } = req.body;

      await check_if_has_active_subscription(req);

      // check what we have first
      if (selected_template === "bring_your_own") {
        // we dont have credentials at this point
        const database = await DatabaseModel.create({
          name: `schema-${nanoid(16)}`,
          product_type: "bring_your_own",
          dialect,
          owner: req.user._id,
          ...(parent_folder ? { folder: parent_folder } : {}),
          credentials: CryptoJS.AES.encrypt(
            JSON.stringify({}),
            process.env.MASTER_AES_ENCRYPTION_KEY
          ),
        });

        return massage_response(
          {
            database: {
              ...database,
              credentials: [],
            },
          },
          res
        );
      }

      const credentials = await GrizzyDatabaseEngine.provision_database(dialect);

      // save the credentials
      const database = await DatabaseModel.create({
        name: credentials.DB_NAME,
        product_type: "hosted",
        dialect,
        credentials: CryptoJS.AES.encrypt(
          JSON.stringify(credentials),
          process.env.MASTER_AES_ENCRYPTION_KEY
        ),
        ...(parent_folder ? { folder: parent_folder } : {}),
        owner: req.user._id,
      });

      //   branch to different paths depending on the selected template types
      switch (selected_template) {
        case "sample":
          await GrizzyDatabaseEngine.push_schema_and_data_to_database(
            sample_data_template,
            dialect,
            credentials
          );

          break;

        case "custom":
          await GrizzyDatabaseEngine.push_schema_and_data_to_database(
            `${custom_schema_template}
                        
                        ${(
                          await GrizzyLLMInstance.generate_sample_data_for_schema(
                            custom_schema_template,
                            [dialect]
                          )
                        )
                          ?.filter((u) => u)
                          ?.map(({ sql_statements }) => sql_statements)
                          .join("\n\n")}
                        `,
            dialect,
            credentials
          );

          break;
      }


      // check if its an empty db -- if so dont initiate this -- actually this only applies to relational dbs for now

      if (['postgres', 'mariadb', 'mysql', 'sqllite'].includes(database.dialect)) {
        const snapshot = await SnapshotModel.create({
          status: 'scheduled',
          checksum: md5(`${Date.now}`), // this is a placeholder checksum
          database: database._id,
          owner: req.user._id,
          snapshot: LzString.compressToBase64("{}")
        });
  
        await sendToSnapshotGeneratorQueue({ 
          database_id: database._id,
          snapshot_id: snapshot._id,
          task: 'snapshot'
        });
      }

      return massage_response(
        {
          database: {
            ...database,
            credentials: Object.entries(credentials).reduce(
              (acc, [key, value]) => {
                return [
                  ...acc,
                  {
                    credentialKey: key,
                    value,
                    isHidden: key?.toLowerCase()?.includes("password"),
                  },
                ];
              },
              []
            ),
          },
        },
        res
      );
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
          owner: req.user._id,
        }),

        SnapshotModel.findOne({
          _id: base_schema,
          owner: req.user._id,
        }),
      ]);

      if (!main || !base) {
        return massage_response(
          {
            diff_tree: JSON.parse(
              LzString.decompressFromBase64((main ?? base)?.snapshot)
            ),
          },
          res
        );
      }

      return massage_response(
        {
          diff_tree: GrizzyDatabaseEngine.generate_schema_diffs(
            JSON.parse(LzString.decompressFromBase64(main.snapshot)),
            JSON.parse(LzString.decompressFromBase64(base.snapshot))
          ),
        },
        res
      );
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async update_database_metadata(req, res) {
    try {
      const { database_reference } = req.params;
      const { name } = req.body;

      if (!name.length || name.length < 4 || /^\d/.test(name)) {
        throw new GrizzyDBException(
          "Invalid database name or the provided name is too short"
        );
      }

      const database = await DatabaseModel.findOne({
        _id: database_reference,
        owner: req.user._id,
      });

      if (!database) {
        throw new GrizzyDBException("Database not found");
      }

      // const credentials = JSON.parse(
      //   CryptoJS.AES.decrypt(
      //     database.credentials,
      //     process.env.MASTER_AES_ENCRYPTION_KEY
      //   ).toString(CryptoJS.enc.Utf8)
      // );

      // we also need to update the credentials
      database.name = name;

      // this is not right -- we should not modify the credentials
      // database.credentials = CryptoJS.AES.encrypt(
      //   JSON.stringify({
      //     ...credentials,
      //     DB_NAME: morph_name_to_valid_database_name(name),
      //   }),
      //   process.env.MASTER_AES_ENCRYPTION_KEY
      // );

      // TODO: use a transaction
      // await Promise.all([
      //   database.save(),

      //   // fire an event to also actually rename the database
      //   GrizzyDatabaseEngine.rename_database(
      //     database.dialect,
      //     name,
      //     credentials
      //   ),
      // ]);

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
        owner: req.user._id,
      });

      if (!database) {
        throw new GrizzyDBException("Database not found");
      }

      if (database.product_type !== "bring_your_own") {
        throw new GrizzyDBException(
          "Only self-hosted databases can be monitored externally"
        );
      }

      let current_schema = (
        await SnapshotModel.find({
          database: database_reference,
          owner: req.user._id,
        })
          .sort({ _id: -1 })
          .limit(1)
          .lean()
      )?.[0];

      if (current_schema) {
        let schema_version_checksum = md5(JSON.stringify(db_graph));

        if (schema_version_checksum !== current_schema?.checksum) {
          current_schema = await SnapshotModel.create({
            checksum: schema_version_checksum,
            database: database_reference,
            owner: req.user._id,
            snapshot: LzString.compressToBase64(JSON.stringify(db_graph)),
          });
        }
      } else {
        current_schema = await SnapshotModel.create({
          database: database_reference,
          owner: req.user._id,
          snapshot: LzString.compressToBase64(JSON.stringify(db_graph)),
        });
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
        owner: req.user._id,
      });

      if (!database) {
        throw new GrizzyDBException("Database not found");
      }

      if (database.product_type !== "bring_your_own") {
        throw new GrizzyDBException(
          "Only self-hosted databases can be monitored externally"
        );
      }

      // check if they have any api key
      let apiKey = await ApiKeyModel.findOne({
        owner: req.user._id,
      });

      if (!apiKey) {
        apiKey = await ApiKeyModel.create({
          owner: req.user._id,
          apikey: generateApiKey({
            method: "string",
            length: 32,
            prefix: "grizzydb_",
          }),
        });
      }

      return massage_response(
        {
          instructions: await get_installation_instructions_markdown({
            db_dialect: database.dialect,
            apiKey: apiKey.apikey,
          }),
        },
        res
      );
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async get_database_snapshot(req, res) {
    try {
      const { snapshot_reference } = req.params;

      const snapshot = await SnapshotModel.findOne({
        _id: snapshot_reference,
        owner: req.user._id,
      });

      if (!snapshot) {
        return massage_error(
          new GrizzyDBException("Snapshot not found"),
          res,
          404
        );
      }

      return massage_response(
        {
          snapshot: {
            ...snapshot,
            snapshot: JSON.parse(
              LzString.decompressFromBase64(snapshot.snapshot)
            ),
          },
        },
        res
      );
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async get_database_snapshots(req, res) {
    try {
      const { database_reference } = req.params;

      const snapshots = await SnapshotModel.find({
        database: database_reference,
        owner: req.user._id,
      })
        .select("_id checksum status failure_reason createdAt updatedAt")
        .sort({ updatedAt: -1 /* descending order latest to oldest */ })
        .lean();

      return massage_response(
        {
          snapshots: (snapshots ?? []).map((x) => ({
            ...x,
            humanTime: humanTime(x.updatedAt),
          })),
        },
        res
      );
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
        owner: req.user._id,
      });

      if (!database) {
        throw new GrizzyDBException("Database not found");
      }

      // check if its valid to generate any schema
      let current_schema = (
        await SnapshotModel.find({
          database: database_reference,
          owner: req.user._id,
        })
          .sort({ _id: -1 })
          .limit(1)
          .lean()
      )?.[0];

      if (database?.product_type === "bring_your_own") {
        return massage_response(
          {
            schema: current_schema
              ? JSON.parse(
                  LzString.decompressFromBase64(current_schema.snapshot)
                )
              : {
                  edgeConfigs: [],
                  schemaColors: {},
                  tablePositions: {},
                  tables: [],
                },
          },
          res
        );
      }

      const credentials = JSON.parse(
        CryptoJS.AES.decrypt(
          database.credentials,
          process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
      );

      if (current_schema) {
        let hot_schema_version =
          await GrizzyDatabaseEngine.get_database_schema_version(
            database.dialect,
            credentials
          );

        if (hot_schema_version) {
          let schema_version_checksum = md5(hot_schema_version);

          if (schema_version_checksum !== current_schema?.checksum) {
            // we get the schema but this might take time --> need to move this to a socketio thing
            const schema_generated =
              await GrizzyDatabaseEngine.export_database_schema(
                database.dialect,
                credentials
              );

            // save it
            current_schema = await SnapshotModel.create({
              checksum: schema_version_checksum,
              database: database_reference,
              owner: req.user._id,
              snapshot: LzString.compressToBase64(
                JSON.stringify(schema_generated)
              ),
            });
          }
        }
      } else {
        // we get the schema but this might take time --> need to move this to a socketio thing
        const schema_generated =
          await GrizzyDatabaseEngine.export_database_schema(
            database.dialect,
            credentials
          );

        current_schema = await SnapshotModel.create({
          database: database_reference,
          owner: req.user._id,
          snapshot: LzString.compressToBase64(JSON.stringify(schema_generated)),
        });
      }

      return massage_response(
        {
          schema: JSON.parse(
            LzString.decompressFromBase64(current_schema.snapshot)
          ),
        },
        res
      );
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
        owner: req.user._id,
      });

      if (!database) {
        throw new GrizzyDBException("Database not found");
      }

      const credentials = JSON.parse(
        CryptoJS.AES.decrypt(
          database.credentials,
          process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
      );

      switch (mode) {
        case "sql":
          return massage_response(
            {
              response: await GrizzyDatabaseEngine.query_database(
                query,
                database.dialect,
                credentials
              ),
            },
            res
          );

        case "text":
          return massage_response({
            response: await GrizzyLLMInstance.query_database_from_prompt(
              query,
              database.dialect,
              credentials
            ),
          });

        default:
          throw new GrizzyDBException(
            "Invalid query mode. Should be either 'text' - for AI queries or 'sql' modes"
          );
      }
    } catch (error) {
      return massage_error(error, res);
    }
  }

  static async get_available_databases(req, res) {
    try {
      const databases = await DatabaseProvisionModel.find().lean();

      return massage_response({ databases }, res);
    } catch (error) {
      return massage_response(error, res);
    }
  }

  static async delete_database(req, res) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { database_reference } = req.params;

      const database = await DatabaseModel.findOne({
        _id: database_reference,
        owner: req.user._id,
      }).session(session);

      if (!database) {
        throw new GrizzyDBException("Database not found");
      }

      const credentials = JSON.parse(
        CryptoJS.AES.decrypt(
          database.credentials,
          process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
      );

      if (database.product_type === "hosted") {
        // capture errors of the db not existing -- if so just return success
        await GrizzyDatabaseEngine.delete_database(
          database.dialect,
          credentials
        );
      }

      // delete the record
      // add sessions

      await Promise.all([
        DatabaseModel.deleteOne({ _id: database._id }, { session }),
        QuickAccessModel.deleteMany({ database: database._id }, { session}),
      ]);

      await session.commitTransaction();

      return massage_response({ status: true }, res);
    } catch (error) {
      await session.abortTransaction();
      return massage_error(error, res);
    }
  }

  static async get_databases(req, res) {
    try {
      let [databases, folders] = await Promise.all([
        DatabaseModel.find({
          owner: req.user._id,
          folder: req.params.folder ? req.params.folder : null,
        })
          .sort({ createdAt: -1 })
          .lean(),
        FolderModel.find({
          owner: req.user._id,
          parent: req.params.folder ?? null,
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      // decrypt the credentials on the fly
      databases = (databases ?? []).map(({ credentials, ...rest }) => ({
        ...rest,
        credentials:
          rest.product_type === "bring_your_own"
            ? []
            : Object.entries(
                JSON.parse(
                  CryptoJS.AES.decrypt(
                    credentials,
                    process.env.MASTER_AES_ENCRYPTION_KEY
                  ).toString(CryptoJS.enc.Utf8)
                )
              ).reduce(
                (acc, [key, value]) => {
                  return [
                    ...acc,
                    {
                      credentialKey: key,
                      value,
                      isHidden: key?.toLowerCase()?.includes("password"),
                    },
                  ];
                },
                [
                  {
                    credentialKey: "HOST",
                    value: GrizzyDatabaseEngine.get_rds_uri(rest.dialect),
                    isHidden: false,
                  },
                ]
              ),
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
          _id: req.params.database_reference,
      }).lean()) ?? {};

      const credentials = Object.entries(
        JSON.parse(
          CryptoJS.AES.decrypt(
            database.credentials,
            process.env.MASTER_AES_ENCRYPTION_KEY
          ).toString(CryptoJS.enc.Utf8)
        )
      );

      // decrypt the credentials on the fly
      database = {
        ...database,
        credentials:
          database.product_type === "bring_your_own"
            ? []
            : credentials.reduce(
                (acc, [key, value]) => {
                  // check if has HOST if not generate one
                  return [
                    ...acc,
                    {
                      credentialKey: key,
                      value,
                      isHidden: key?.toLowerCase()?.includes("password"),
                    },
                  ];
                },
                [
                  (credentials?.find(([key, value]) => key?.toLowerCase() === 'host') ? null : {
                    credentialKey: "HOST",
                    value: GrizzyDatabaseEngine.get_rds_uri(database.dialect),
                    isHidden: false,
                  })
                ].filter(u => u)
              ),
      };

      return massage_response({ database }, res);
    } catch (error) {
      return massage_error(error, res);
    }
  }
}
