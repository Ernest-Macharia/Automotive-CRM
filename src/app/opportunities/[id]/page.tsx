'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OpportunityLegacyDetailsRoute() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  useEffect(() => {
    if (!id) {
      router.replace('/opportunities');
      return;
    }

    router.replace(`/opportunities/details?id=${id}`);
  }, [id, router]);

  return null;
}
