import { Router } from "express";
import {
  EnsureIsApiKeyValid,
  EnsureIsAuthenticated,
} from "../../middlewares/index.js";
import { DatabaseController } from "../../controllers/database/index.js";

const router = Router();

router.get("/available", DatabaseController.get_available_databases);

router.post(
  "/hosted-schema/:database_reference",
  [EnsureIsApiKeyValid],
  DatabaseController.update_self_hosted_schemas
);

router.post(
  '/webhook',
  DatabaseController.payment_webhook_handler
);

router.get(
  '/pricing',
  DatabaseController.get_pricing_deals
);

router.use([EnsureIsAuthenticated]);

router.post(
  '/bucket/:parent_folder?',
  DatabaseController.create_fdw_bucket
);

router.put(
  '/bucket/:bucket_reference/:database_reference',
  DatabaseController.add_databases_to_fdw_bucket
);

router.delete(
  '/bucket/:bucket_reference/:database_reference',
  DatabaseController.remove_database_from_fdw_bucket
);


router.get(
  '/snippets',
  DatabaseController.get_snippets
);

router.post(
  '/snippets/:database_reference',
  DatabaseController.create_snippet
);

router.delete(
  '/snippets/:snippet_reference',
  DatabaseController.delete_snippet
);

router.put(
  '/snippets/:snippet_reference',
  DatabaseController.update_snippet
);

router.get(
  '/execute/snippets/:snippet_reference',
  DatabaseController.execute_snippet
);


router.get(
  '/query-analytics/:database_reference',
  DatabaseController.get_query_analytics
);

router.get(
  '/export-snapshot/:snapshot_reference',
  DatabaseController.export_snapshot
);

router.delete(
  '/snapshot/:snapshot_id',
  DatabaseController.delete_snapshot
);

router.post(
  '/switch-to-snapshot/:snapshot_reference',
  DatabaseController.switch_to_snapshot
);

router.get(
  '/checkout/:pricing_deal_reference/:duration',
  DatabaseController.initiate_payment
);

router.get(
  '/check-if-subscribed',
  DatabaseController.check_if_in_active_subscription
);

router.get(
  '/search',
  DatabaseController.search_files_and_folders
);

// used for drop downs
router.post(
  '/available',
  DatabaseController.get_all_databases_with_credentials
);

router.get(
  '/quick-links',
  DatabaseController.get_quick_access_records
);

router.delete(
  '/quick-links/:quick_access_reference',
  DatabaseController.remove_from_quick_access
);

router.post(
  '/quick-links',
  DatabaseController.add_to_quick_access
);

// used to carry out the procedure
router.post(
  '/connect-to-external-database/:parent_folder?',
  DatabaseController.import_database_from_external_source
);

router.post(
  '/import-from-external-database/:parent_folder?',
  DatabaseController.import_databases_to_grizzy
);

router.post("/folder/move-to", DatabaseController.move_to_folder);
router.post("/folder/move-out", DatabaseController.move_out_of_folder);
router.post("/folder/:parent_folder?", DatabaseController.create_folder);

router.get(
  "/schema/:database_reference",
  DatabaseController.export_database_schema
);

router.post("/query/:database_reference", DatabaseController.query_database);
router.post("/:parent_folder?", DatabaseController.provision_database);
router.get("/list/:folder?", DatabaseController.get_databases);

router.get(
  "/installation/:database_reference",
  DatabaseController.get_monitor_installation
);

router.get(
  "/snapshots/:database_reference",
  DatabaseController.get_database_snapshots
);
router.get(
  "/snapshot/:database_reference",
  DatabaseController.get_database_snapshot
);

router.get(
  "/diffs/:main_schema/:base_schema?",
  DatabaseController.generate_schema_diffs
);

router.get("/:database_reference", DatabaseController.get_database);
router.put("/:database_reference", DatabaseController.update_database_metadata);
router.delete("/:database_reference", DatabaseController.delete_database);

export default router;
