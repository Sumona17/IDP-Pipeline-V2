import React, { useState } from 'react';
import OpenQueue from './open-queue/open-queue';
import MyQueue from './my-queue/my-queue';
import UploadDrawer from '../../components/file-upload/file-upload';

type TabType = 'open' | 'my';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Document Processing Queue</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L9 7m3-3l3 3" />
          </svg>
          Upload Files
        </button>
      </div>

      <div className="flex-shrink-0 border-b border-gray-300">
        <div className="px-6 flex">
          <button
            onClick={() => setActiveTab('open')}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'open' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Open Queue
            {activeTab === 'open' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'my' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            My Queue
            {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'open' && (
          <div className="h-full p-0">
            <OpenQueue />
          </div>
        )}
        {activeTab === 'my' && (
          <div className="h-full p-0">
            <MyQueue />
          </div>
        )}
      </div>

      <UploadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default Dashboard;