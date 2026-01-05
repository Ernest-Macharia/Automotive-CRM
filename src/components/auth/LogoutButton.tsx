'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';

interface LogoutButtonProps {
  variant?: 'default' | 'icon' | 'text';
  className?: string;
}

export default function LogoutButton({ variant = 'default', className = '' }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg ${className}`}
        title="Logout"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <LogOut className="h-5 w-5" />
        )}
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`text-gray-600 hover:text-gray-900 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
        ) : (
          <LogOut className="h-4 w-4 mr-2 inline" />
        )}
        Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>Logout</span>
    </button>
  );
}