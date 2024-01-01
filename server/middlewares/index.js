import { ApiKeyModel, UserModel } from "../models/index.js";
import {
    GrizzyDBException,
    massage_error,
    verifyJwtToken,
} from "../utils/index.js";

export const EnsureIsAuthenticated = async (req, res, next) => {
  try {
    const { _id } = await verifyJwtToken(req.headers["x-access-token"]);
    const user = await UserModel.findById(_id);
    req.user = user;
    return next();
  } catch (error) {
    return res.status(403).send("Unauthorized");
  }
};

export const VerifyISSocketIOAuthenticated = async (token) => {
  const { _id } = await verifyJwtToken(token);
  const user = await UserModel.findById(_id);
  return !!user;
};

export const EnsureIsApiKeyValid = async (req, res, next) => {
  try {
    const apikey = req?.headers?.["apikey"];

    if (!apikey) {
      throw new GrizzyDBException("Invalid api key");
    }

    let user = await ApiKeyModel.findOne({ apikey }).populate("owner");

    if (!user || !user.owner) {
      throw new GrizzyDBException("Invalid api key");
    }

    req.user = user.owner;

    return next();
  } catch (error) {
    return massage_error(error, res, 403);
  }
};
