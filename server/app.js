import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import consola from 'consola'
import { DatabaseRoute, SampleRoute } from './routes/index.js';


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join("./", 'public')));


app.use('/database', DatabaseRoute.default);
app.use('/samples', SampleRoute.default);

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

;(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(process.env.PORT, () => {
        consola.info('Server is running on port ' + process.env.PORT);
    })
})();