'use client';

import { useState, useCallback } from 'react';
import { api, getErrorMessage } from './api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: () => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(endpoint: string, immediate = false): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await api.get<T>(endpoint);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = getErrorMessage(error);
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, [endpoint]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

export function useApiPost<TRequest, TResponse>(
  endpoint: string,
  options?: { onSuccess?: (data: TResponse) => void; onError?: (error: string) => void }
) {
  const [state, setState] = useState<UseApiState<TResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (body?: TRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await api.post<TResponse>(endpoint, body);
      setState({ data, loading: false, error: null });
      options?.onSuccess?.(data);
      return data;
    } catch (error) {
      const message = getErrorMessage(error);
      setState({ data: null, loading: false, error: message });
      options?.onError?.(message);
      return null;
    }
  }, [endpoint, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
