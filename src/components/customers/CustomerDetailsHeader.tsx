import { ArrowLeft, User, Edit, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Customer } from '@/services/customersService';

interface CustomerDetailsHeaderProps {
  customer: Customer;
}

export default function CustomerDetailsHeader({ customer }: CustomerDetailsHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              aria-label="Back to customers"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
              <p className="text-blue-100">{customer.companyName || 'Individual Customer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
              <Edit className="h-5 w-5 text-white" />
            </button>
            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
              <MoreVertical className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}