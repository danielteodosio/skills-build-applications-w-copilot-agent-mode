import { useEffect, useState } from 'react';
import { getJson } from './client.js';

type ApiState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useApiData<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });

    getJson<T>(path)
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch(() => {
        if (active) setState({ data: null, error: 'Unable to load data. Please try again later.', loading: false });
      });

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}