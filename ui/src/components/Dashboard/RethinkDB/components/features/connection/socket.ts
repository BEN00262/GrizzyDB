import { io } from 'socket.io-client';

export function get_socket(database_reference: string) {
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

  return socket;
}
