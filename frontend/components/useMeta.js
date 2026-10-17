'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useMeta() {
  const [meta, setMeta] = useState({ countries: [], departments: [], jobTitles: [] });
  useEffect(() => { api.meta().then(setMeta).catch(() => {}); }, []);
  return meta;
}