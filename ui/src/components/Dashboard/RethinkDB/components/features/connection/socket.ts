import { io, Socket } from 'socket.io-client';
import {DefaultEventsMap} from "@socket.io/component-emitter";

const socketio_map: Map<string, Socket<DefaultEventsMap, DefaultEventsMap>> = new Map();

export function get_socket(database_reference: string) {
  const connection = socketio_map.get(database_reference);

  if (!connection || connection.disconnected) {
    const socket = io(import.meta.env.VITE_MAIN_SERVER_ENDPOINT, {
      transports: ['websocket', 'polling'],
      query: {
        token: localStorage.getItem('authToken'),
        dialect: 'rethinkdb',
        database_reference
      }
    });
    
    socket.io.on('error', (error) => {
      console.error(error);
    });

    socketio_map.set(database_reference, socket);

    return socket;
  }

  return connection;
}
