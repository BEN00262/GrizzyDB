import { RQuery } from 'rethinkdb-ts/lib/query-builder/query';
import { TermJson } from 'rethinkdb-ts/lib/types';

import { get_socket } from '../connection/socket';

export function request<Req = unknown, Res = unknown>(
  eventName: string,
  database_reference: string,
  data?: Req,
): Promise<Res> {
  return new Promise((resolve) => {
    get_socket(database_reference).emit(eventName, data, (response: Res) => {
      resolve(response);
    });
  });
}

export async function requestQuery<T = unknown>(query: RQuery, database_reference: string): Promise<T> {
  const [success, data] = await request<TermJson, [boolean, T]>(
    'query',
    database_reference,
    query.term,
  );

  if (success) {
    return data;
  }
  throw data;
}

export async function requestChanges<T = unknown>(
  query: RQuery,
  database_reference: string,
  cb: (data: T) => void,
): Promise<() => void> {
  const { term } = query;

  const [success, queryId] = await request<TermJson, [boolean, string]>(
    'sub',
    database_reference,
    term,
  );
  if (!success) {
    throw new Error(queryId);
  }

  const onDataCb = (data: T) => {
    cb(data);
  };

  get_socket(database_reference).on(queryId, onDataCb);

  return () => {
    get_socket(database_reference).off(queryId, onDataCb);
    get_socket(database_reference).emit('unsub', queryId);
  };
}
