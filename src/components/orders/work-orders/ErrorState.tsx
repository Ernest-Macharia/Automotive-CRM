import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  onBack: () => void;
}

export default function ErrorState({ onBack }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Work Order Not Found</h3>
        <p className="text-gray-600 mb-6">The work order doesn't exist or has been removed.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Work Orders
        </button>
      </div>
    </div>
  );
}