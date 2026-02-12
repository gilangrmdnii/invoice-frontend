'use client';

import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/store';
import { hydrate } from '@/lib/slices/authSlice';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    store.dispatch(hydrate());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
