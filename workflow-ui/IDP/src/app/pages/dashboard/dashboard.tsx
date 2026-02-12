import React, { useState } from 'react';
import OpenQueue from './open-queue/open-queue';
import MyQueue from './my-queue/my-queue';

type TabType = 'open' | 'my';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('open');

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">Document Processing Queue</h1>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-gray-300">
        <div className="px-6 flex">
          <button
            onClick={() => setActiveTab('open')}
            className={`
              relative px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === 'open' 
                ? 'text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Open Queue
            {activeTab === 'open' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`
              relative px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === 'my' 
                ? 'text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            My Queue
            {activeTab === 'my' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'open' && (
          <div className="h-full p-0">
            <OpenQueue/>
          </div>
        )}

        {activeTab === 'my' && (
          <div className="h-full p-0">
            <MyQueue />
          </div>
        )}
      </div>
    </div>
  );
};


export default Dashboard;