import { useEffect, useRef, useState } from 'react';
import { RFeed } from 'rethinkdb-ts';
import { RQuery } from 'rethinkdb-ts/lib/query-builder/query';

import { requestChanges, requestQuery } from './request';
import { useParams } from 'react-router';

export type RequestStatus = 'loading' | 'finished' | 'error';

export type VoidFunc = () => void;

export const useLatestChange = <T>(changeQuery: RFeed, database_reference: string): [T, RequestStatus] => {
  const [response, setResponse] = useState<T | null>(null);
  const [status, setStatus] = useState<RequestStatus>('loading');

  const unsubRef = useRef<() => void>();

  useEffect(() => {
    setResponse(null);
    setStatus('loading');

    requestChanges<T>(changeQuery, database_reference, (data) => {
      setResponse(data);
    })
      .then((unsub) => {
        setStatus('finished');
        unsubRef.current = unsub;
      })
      .catch((error) => {
        setStatus('error');
        setResponse(() => error.message);
      });
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        //@ts-ignore
        unsubRef.current = null;
      }
    };
  }, [changeQuery]);

  //@ts-ignore
  return [response, status];
};

export const useRequest = <T>(
  query: RQuery,
  changeQueries?: RFeed[],
): [T, RequestStatus] => {
  const [response, setResponse] = useState<T | null>(null);
  const [status, setStatus] = useState<RequestStatus>('loading');

  const { id: database_reference } = useParams();

  const unsubRef = useRef<VoidFunc[]>([]);
  const [cResponses, setCResponses] = useState<unknown[]>(
    changeQueries ? changeQueries.map(() => null) : [],
  );

  // effect to handle changeQueries
  useEffect(() => {
    if (!changeQueries) {
      return;
    }

    for (const index in changeQueries) {
      const changeQuery = changeQueries[index];
      
      requestChanges<T>(changeQuery, database_reference ?? "", (data) => {
        setCResponses((prev) => {
          const newState = [...prev];
          newState[index] = data;
          return newState;
        });
      })
        .then((unsub) => {
          unsubRef.current[index] = unsub;
        })
        .catch((error) => {
          setResponse(() => error.message);
        });
    }
    return () => {
      for (const index in unsubRef.current) {
        if (unsubRef.current[index]) {
          unsubRef.current[index]();

          //@ts-ignore
          unsubRef.current[index] = null;
        }
      }
    };
  }, changeQueries);

  useEffect(() => {
    requestQuery<T>(query, database_reference ?? "")
      .then((data) => {
        setStatus('finished');
        setResponse(data);
      })
      .catch((error) => {
        console.log({ error });

        setStatus('error');
        setResponse(error.message);
      });
  }, [query, ...cResponses]);

  //@ts-ignore
  return [response, status];
};

export function useChangeList<T = unknown>(query?: RQuery, database_reference = "") {
  const [responses, setResponses] = useState<T[]>([]);
  const unsubRef = useRef<() => void>();
  useEffect(() => {
    setResponses(() => []);
    if (!query) {
      return () => {
        if (unsubRef.current) {
          unsubRef.current();

          //@ts-ignore
          unsubRef.current = null;
        }
      };
    }
    requestChanges<T>(query, database_reference, (data) => {
      setResponses((l: T[]) => [...l, data]);
    })
      .then((unsub) => {
        unsubRef.current = unsub;
      })
      .catch((error) => {
        setResponses(() => error.message);
      });
    return () => {
      if (unsubRef.current) {
        unsubRef.current();

        //@ts-ignore
        unsubRef.current = null;
      }
    };
  }, [query]);
  return responses;
}
