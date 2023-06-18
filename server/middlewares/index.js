import { UserModel } from "../models/index.js";
import { GrizzyDBException, massage_error } from "../utils/index.js"

export const EnsureIsAuthenticated = async (req, res, next) => {
    // get the fingerprint from the header x-access-token
    try {

        const user_fingerprint = req?.headers?.['x-access-token'];

        if (!user_fingerprint) {
            throw new GrizzyDBException('Failed to authenticate user');
        }

        let user = await UserModel.findOne({ user_fingerprint });

        if (!user) {
            user = await UserModel.create({ user_fingerprint });
        }

        req.user = user;

        return next();
    } catch (error) {
        return massage_error(error, res, 403);
    }
}