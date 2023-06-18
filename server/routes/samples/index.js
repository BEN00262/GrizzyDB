import { Router } from 'express';
import { SamplesController } from '../../controllers/samples/index.js';
// import { EnsureIsAuthenticated } from '../../middlewares';

const router = Router();

router.get('/', SamplesController.get_samples);
router.post('/', SamplesController.create_samples);

// has to be a post to allow for massive prompts
// do we save this stuff or just ignore??
router.post('/custom-prompt', /*[EnsureIsAuthenticated],*/ SamplesController.generate_schema_and_data_from_user_prompt);

export default router;