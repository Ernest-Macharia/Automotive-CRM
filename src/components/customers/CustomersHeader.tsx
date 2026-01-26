import { Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CustomersHeaderProps {
  title?: string;
  description?: string;
}

export default function CustomersHeader({ 
  title = 'Customers', 
  description = 'Manage and view all customer information' 
}: CustomersHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-800 px-6 py-8 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-blue-100">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}