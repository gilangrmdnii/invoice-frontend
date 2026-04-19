'use client';

import { useEffect, useRef } from 'react';
import { useAppSelector } from '../hooks';
import { baseApi } from '../api/baseApi';
import { getApiBaseUrl } from '../utils';
import { useDispatch } from 'react-redux';

export function useSSE() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/events?token=${token}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = () => {
      // Invalidate notification cache on any SSE event
      dispatch(baseApi.util.invalidateTags(['Notification']));
    };

    es.addEventListener('notification', () => {
      dispatch(baseApi.util.invalidateTags(['Notification']));
    });

    es.addEventListener('invoice_update', () => {
      dispatch(baseApi.util.invalidateTags(['Invoice', 'Dashboard']));
    });

    es.addEventListener('expense_update', () => {
      dispatch(baseApi.util.invalidateTags(['Expense', 'Dashboard']));
    });

    es.addEventListener('budget_request_update', () => {
      dispatch(baseApi.util.invalidateTags(['BudgetRequest', 'Dashboard']));
    });

    es.addEventListener('project_update', () => {
      dispatch(baseApi.util.invalidateTags(['Project', 'Dashboard']));
    });

    es.addEventListener('QC_DOCUMENT_CREATED', () => {
      dispatch(baseApi.util.invalidateTags(['QCDocument', 'Notification']));
    });

    es.onerror = () => {
      // EventSource will auto-reconnect on error
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [token, dispatch]);
}
