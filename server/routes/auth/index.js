import express from 'express';
import { massage_error, massage_response, signJwtToken } from '../../utils/index.js';
import { UserModel } from "../../models/index.js";

const router = express.Router();

router.post('/authenticate', async (req, res) => {
    try {
        const { user_reference } = req.body;

        let user = await UserModel.findOne({ user_reference });

        if (!user) {
            user = await UserModel.create({ user_reference });
        }

        return massage_response({
            authToken: signJwtToken({ _id: user._id })
        }, res)
    } catch(error) {
        return massage_error(error, res);
    }
});

export default router;