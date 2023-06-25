import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import mongoose from 'mongoose';
import { DatabaseProvisionModel } from "../models/index.js";

;(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    await DatabaseProvisionModel.insertMany([
        {
          dialect: "postgres",
          enabled: true,
          logo: "https://ik.imagekit.io/tbbypuyqq/postgres.png"
        },
        {
          dialect: "mariadb",
          enabled: true,
          logo: "https://ik.imagekit.io/tbbypuyqq/mariadb.webp"
        },
        {
          dialect: "mysql",
          enabled: true,
          logo: "https://ik.imagekit.io/tbbypuyqq/mysql.png"
        }
    ])
})()