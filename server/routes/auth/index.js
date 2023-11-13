import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import { massage_error, massage_response, signJwtToken } from '../../utils/index.js';
import { UserModel } from "../../models/index.js";

const router = express.Router();

router.post('/authenticate', async (req, res) => {
    try {
        // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        // const ticket = await client.verifyIdToken({
        //     idToken: req.body.jwtToken,
        //     audience: process.env.GOOGLE_CLIENT_ID
        // });
        const { user_reference } = req.body;

        // const { email } = ticket.getPayload();

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