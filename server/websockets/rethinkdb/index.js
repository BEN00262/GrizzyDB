// subscribe for all rethinkdb messages and stuff

import CryptoJS from "crypto-js";
import RethinkDB from 'rethinkdb-ts';
import { nanoid } from 'nanoid';
import { DatabaseModel } from "../../models/index.js";
import { fromStream } from "./utils.js";
import { toQuery } from 'rethinkdb-ts/lib/query-builder/query.js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 
 * @param {socketio.Socket} socketio_client 
 * @param {string} eventName
 * @param {any} data
 * @param {string} database_reference
 */
async function rethinkdb_socketio_handler(socketio_client, eventName, data, database_reference) {
    // create the connection at this point
    // get the database
    let database = (await DatabaseModel.findOne({
        _id: database_reference,
    }).lean()) ?? {};

    // we only care about the creds
    const credentials = JSON.parse(
        CryptoJS.AES.decrypt(
            database.credentials,
            process.env.MASTER_AES_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8)
    );

    console.log({ credentials })

    // create a connection
    const connection = await RethinkDB.connect({
        server: {
          host: process.env.MASTER_RETHINKDB_URI,
          port: +process.env.MASTER_RETHINKDB_PORT
        }
    }, {
        user: credentials.DB_USER,
        password: credentials.DB_PASSWORD,
        db: credentials.DB_NAME
    });

    socketio_client.changeQueries = {};

    const query = toQuery(data);

    // console.log(eventName, query.toString())

    switch (eventName) {
        case 'query':
            {
                try {
                    const qdata = await connection.run(query);

                    if (qdata && qdata.type === 'Feed') {
                        // console.log({ qdata })

                        return from(fromStream(qdata)).pipe(
                            map((data) => {
                                // console.log({ response: data })
                                return ['feed', data];
                            }),
                        );
                    }

                    // console.log({ eventName, query: query.toString(), qdata })

                    return [true, qdata];
                } catch (error) {
                    // console.log(error);

                    return [false, error.message];
                }
            }

        case 'sub':
            {
                const queryId = nanoid();

                // console.log(data)

                try {
                    const cursor = await connection.run(query);

                    if (cursor && !cursor.type.includes('Feed')) {
                        return [false, 'Should be feed'];
                    }

                    socketio_client.changeQueries[queryId] = cursor;

                    setTimeout(() => {
                        cursor.on('data', (changesData) => {
                            socketio_client.emit(queryId, changesData);
                        });
                    });

                    return [true, queryId];
                } catch (error) {
                    return [false, error.message];
                }
            }

        case 'unsub':
            {
                const queryId = data;

                const cursor = socketio_client.changeQueries[queryId];

                if (cursor) {
                    await cursor.close();
                    delete socketio_client.changeQueries[queryId];
                    return 'ok';
                }

                return 'was closed';
            }

        case 'me':
            {
                return connection.server()
            }
    }
}

export { rethinkdb_socketio_handler }