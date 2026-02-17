import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, RotateCcw, Download, Trash2, Bell, Eye, Zap } from 'lucide-react';

export const Settings = () => {
    const [settings, setSettings] = useState({
        autoRefreshEnabled: localStorage.getItem('autoRefresh') === 'true',
        refreshInterval: parseInt(localStorage.getItem('refreshInterval') || '10', 10),
        notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
        defaultWorkflowTimeout: parseInt(localStorage.getItem('defaultWorkflowTimeout') || '3600', 10),
        darkMode: localStorage.getItem('darkMode') === 'true',
        apiEndpoint: localStorage.getItem('apiEndpoint') || 'http://localhost:3000',
    });

    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
    }, [notification]);

    const saveSettings = () => {
        try {
            localStorage.setItem('autoRefresh', settings.autoRefreshEnabled.toString());
            localStorage.setItem('refreshInterval', settings.refreshInterval.toString());
            localStorage.setItem('notificationsEnabled', settings.notificationsEnabled.toString());
            localStorage.setItem('defaultWorkflowTimeout', settings.defaultWorkflowTimeout.toString());
            localStorage.setItem('darkMode', settings.darkMode.toString());
            localStorage.setItem('apiEndpoint', settings.apiEndpoint);

            setNotification({ type: 'success', message: 'Settings saved successfully!' });
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to save settings' });
        }
    };

    const resetSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
            setSettings({
                autoRefreshEnabled: false,
                refreshInterval: 10,
                notificationsEnabled: true,
                defaultWorkflowTimeout: 3600,
                darkMode: false,
                apiEndpoint: 'http://localhost:3000',
            });
            localStorage.clear();
            setNotification({ type: 'success', message: 'Settings reset to defaults' });
        }
    };

    const exportAllData = () => {
        try {
            const allData = {
                settings,
                exportDate: new Date().toISOString(),
                userAgent: navigator.userAgent,
            };

            const jsonString = JSON.stringify(allData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `workflow-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setNotification({ type: 'success', message: 'Settings exported successfully' });
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to export settings' });
        }
    };

    const clearCache = () => {
        if (window.confirm('This will clear your browser cache. Continue?')) {
            try {
                if ('caches' in window) {
                    caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => {
                            caches.delete(cacheName);
                        });
                    });
                }
                setNotification({ type: 'success', message: 'Cache cleared successfully' });
            } catch (error) {
                setNotification({ type: 'error', message: 'Failed to clear cache' });
            }
        }
    };

    const NotificationBanner = () => {
        if (!notification) return null;

        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800',
        };

        const icons = {
            success: <CheckCircle className="w-5 h-5" />,
            error: <AlertCircle className="w-5 h-5" />,
            info: <AlertCircle className="w-5 h-5" />,
        };

        return (
            <div className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg border ${colors[notification.type]} animate-in fade-in`}>
                {icons[notification.type]}
                <span className="text-sm font-medium">{notification.message}</span>
            </div>
        );
    };

    return (
        <div className="p-8">
            <NotificationBanner />

            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500">Customize your workflow engine experience</p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Eye className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">Display & General</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.darkMode}
                                    onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Dark Mode (Coming Soon)</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Default Workflow Timeout (seconds)</label>
                            <input
                                type="number"
                                min="60"
                                max="86400"
                                value={settings.defaultWorkflowTimeout}
                                onChange={(e) => setSettings({ ...settings, defaultWorkflowTimeout: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Maximum time a workflow can run before timeout</p>
                        </div>
                    </div>
                </div>

                {/* Auto-refresh Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">Auto-refresh</h3>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.autoRefreshEnabled}
                                onChange={(e) => setSettings({ ...settings, autoRefreshEnabled: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700">Enable auto-refresh on Dashboard and Execution pages</span>
                        </label>

                        {settings.autoRefreshEnabled && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="300"
                                    value={settings.refreshInterval}
                                    onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">How often to refresh data (5-300 seconds)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.notificationsEnabled}
                            onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable notifications for workflow events</span>
                    </label>
                </div>

                {/* API Configuration */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">API Configuration</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Endpoint</label>
                        <input
                            type="text"
                            value={settings.apiEndpoint}
                            onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Base URL for API requests</p>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Management</h3>

                    <div className="space-y-3">
                        <button
                            onClick={exportAllData}
                            className="w-[40%] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Export Settings & Data
                        </button>

                        <button
                            onClick={clearCache}
                            className="w-[40%] flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Cache
                        </button>

                        <button
                            onClick={resetSettings}
                            className="w-[40%] flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset All Settings
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Save Workflow</span>
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl + S</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Delete Selected Node</span>
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Delete</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Go to Dashboard</span>
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl + Shift + H</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Toggle Auto-refresh</span>
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl + R</kbd>
                        </div>
                    </div>
                </div>

                {/* App Info */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Version:</span> 1.0.0</p>
                        <p><span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}</p>
                        <p><span className="font-medium">Environment:</span> Development</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg">
                <button
                    onClick={saveSettings}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    <Save className="w-4 h-4" />
                    Save Settings
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                    Reload Page
                </button>
            </div>
        </div>
    );
};
