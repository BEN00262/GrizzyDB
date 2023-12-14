import amqp from 'amqplib/callback_api';

export const sendToSnapshotGeneratorQueue = ({ database_id, snapshot_id }) => new Promise((resolve,reject) => {
    amqp.connect(process.env.AMQP_SERVER_URI, (error0, connection) => {
        if (error0) { reject(error0); }

        connection.createChannel((error1, channel) => {
            if (error1){ reject(error1); }

            channel.assertQueue(process.env.SNAPSHOT_QUEUE, { durable: true });

            channel.sendToQueue(
                process.env.SNAPSHOT_QUEUE,
                Buffer.from(
                    JSON.stringify({ database_id, snapshot_id })
                ), 
                { persistent: true }
            );

            resolve(true);
        });
    })
});