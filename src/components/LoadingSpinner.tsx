'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingSpinner() {
  const [mounted, setMounted] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Timer interval
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center">
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
      <p className="mt-4 text-gray-600 text-sm">
        Loading... {seconds}s
      </p>
    </div>
  );
}
