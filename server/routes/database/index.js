import { Router } from 'express';
import { EnsureIsAuthenticated } from '../../middlewares/index.js';
import { DatabaseController } from '../../controllers/database/index.js';

const router = Router();

router.get('/available', DatabaseController.get_available_databases);

router.use([EnsureIsAuthenticated]);

router.get('/schema/:database_reference', DatabaseController.export_database_schema);
router.post('/query/:database_reference', DatabaseController.query_database);
router.post('/', DatabaseController.provision_database);
router.get('/', DatabaseController.get_databases);
router.delete('/:database_reference', DatabaseController.delete_database);


export default router;