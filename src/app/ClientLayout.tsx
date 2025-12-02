'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    return <div className="min-h-screen" style={{ backgroundColor: '#0B0B0B' }}>{children}</div>;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0B0B0B' }}>
      <div className={`
        fixed inset-y-0 left-0 z-40
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
        transition-transform duration-300 ease-in-out
        lg:w-64
      `}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      <main className={`
        flex-1 min-h-screen
        lg:ml-0
        transition-all duration-300
        w-full
      `}>
        <div className="h-full p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </main>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}