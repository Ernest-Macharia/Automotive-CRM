'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import WebFormRuntimePage from '@/components/webforms/WebFormRuntimePage';

const decodeKey = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function RuntimeWebFormRoute() {
  const params = useParams();
  const formKey = useMemo(() => decodeKey(String(params.key || '')), [params.key]);

  return <WebFormRuntimePage formKey={formKey} />;
}
