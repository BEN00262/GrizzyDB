import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import consola from 'consola'
import { AuthRoute, DatabaseRoute, SampleRoute } from './routes/index.js';

const app = express();

app.use(cors());

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/database', DatabaseRoute.default);
app.use('/samples', SampleRoute.default);
app.use('/auth', AuthRoute.default);

app.get('*', function (req, res) {
    res.status(404).json({ message: "404" });
})

;(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(process.env.PORT, () => {
        consola.info('Server is running on port ' + process.env.PORT);
    })
})();