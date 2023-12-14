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

router.use([EnsureIsAuthenticated]);

// used for drop downs
router.post(
  '/available',
  DatabaseController.get_all_databases_with_credentials
);

// used to carry out the procedure
router.post(
  '/connect-to-external-database/:parent_folder?',
  DatabaseController.import_database_from_external_source
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
