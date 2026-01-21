'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingSpinner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="animate-spin-pulse">
      <Image
        src="/magloader.png"
        alt="MAG CRM Loading"
        width={140}
        height={140}
        priority
        className="animate-spin-slow"
      />
    </div>
  );
}
