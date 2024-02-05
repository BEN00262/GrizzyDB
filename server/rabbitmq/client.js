import amqp from 'amqplib/callback_api.js';

export const sendToSnapshotGeneratorQueue = ({ database_id, snapshot_id, task, rehydrate_snapshot_id, remote_actual_credentials }) => new Promise((resolve,reject) => {
    amqp.connect(process.env.AMQP_SERVER_URI, (error0, connection) => {
        if (error0) { reject(error0); }

        connection.createChannel((error1, channel) => {
            if (error1){ reject(error1); }

            channel.assertQueue(process.env.SNAPSHOT_QUEUE, { durable: true });

            channel.sendToQueue(
                process.env.SNAPSHOT_QUEUE,
                Buffer.from(
                    JSON.stringify({ database_id, snapshot_id, task, rehydrate_snapshot_id, remote_actual_credentials })
                ), 
                
                // determine the message priority based on what it is
                { persistent: true, priority: 1 }
            );

            resolve(true);
        });
    })
});