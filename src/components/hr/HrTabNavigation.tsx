'use client';

interface HRTabNavigationProps {
  activeTab: 'overview' | 'leaves' | 'contracts' | 'performance' | 'incidents' | 'recruitment' | 'welfare' | 'policies' | 'assets' | 'attendance';
  setActiveTab: (tab: 'overview' | 'leaves' | 'contracts' | 'performance' | 'incidents' | 'recruitment' | 'welfare' | 'policies' | 'assets' | 'attendance') => void;
}

export default function HRTabNavigation({ activeTab, setActiveTab }: HRTabNavigationProps) {
  const tabs = [
    'overview',
    'leaves',
    'contracts',
    'performance',
    'incidents',
    'recruitment',
    'welfare',
    'policies',
    'assets',
    'attendance'
  ] as const;

  return (
    <div className="mb-6">
      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
