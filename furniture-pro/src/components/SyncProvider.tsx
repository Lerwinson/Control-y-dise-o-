'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { pullProjects } from '@/lib/sync';

// When the user is authenticated with a real JWT (backend up), pull their
// projects from PostgreSQL once per session. No-ops in offline/demo mode.
export function SyncProvider() {
  const token = useStore((s) => s.user?.token);
  const pulled = useRef(false);

  useEffect(() => {
    if (!token || pulled.current) return;
    pulled.current = true;
    pullProjects(token).catch(() => { /* backend offline -> keep local state */ });
  }, [token]);

  return null;
}
