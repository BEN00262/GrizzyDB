import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
})

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import consola from 'consola';
import http from 'http';
import * as socketio from 'socket.io';
import { AuthRoute, DatabaseRoute, SampleRoute } from './routes/index.js';
import { GrizzyDBException } from './utils/index.js';
import { VerifyISSocketIOAuthenticated } from './middlewares/index.js';
import { rethinkdb_socketio_handler } from './websockets/index.js';

const app = express();

const httpServer = http.Server(app);

// redirect connection depending on what db is connecting, start with rethinkdb
const io = new socketio.Server(httpServer, {
    cors: {
        origin: '*'
    }
});

io.use(async (socket, next) => {
    const { token } = socket.handshake.query;

    // check if the token is valid
    if (await VerifyISSocketIOAuthenticated(token)) {
        return next();
    }

    return next(new GrizzyDBException("Authentication error"))
})

io.on('connection', function (client) {
    // we want to know which db has connected first so we can redirect to the client handler
    const { dialect, database_reference } = client.handshake.query;

    client.onAny(async (eventName, data, callback) => {
        if (database_reference !== 'undefined') {
            switch (dialect) {
                case 'rethinkdb':
                    const response = await rethinkdb_socketio_handler(client, eventName, data, database_reference);

                    if (typeof callback === 'function') {
                        callback(response);
                    }
                    
                    break;
        
                default:
                    throw new GrizzyDBException("Not yet implemented for database dialect");
            }
        }
    });
})

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

    httpServer.listen(process.env.PORT, () => {
        consola.info('Server is running on port ' + process.env.PORT);
    })
})();