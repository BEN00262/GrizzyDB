import { UserModel } from "../../models";
import { massage_error, massage_response } from "../../utils";

export class UserController {
    static async create_user(req,res) {
        try {
            const { user_fingerprint } = req.params;

            if (!(await UserModel.exists({ user_fingerprint }))) {
                await UserModel.create({ user_fingerprint });
            }

            return massage_response({ status: true }, res, 201);
        } catch (error) {
            return massage_error(error, res);
        }
    }
}