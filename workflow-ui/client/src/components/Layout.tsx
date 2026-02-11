import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitGraph, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
            )}
        >
            <Icon className="w-5 h-5" />
            {label}
        </Link>
    );
};

export const Layout = () => {

    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200 cursor-pointer" onClick={() => navigate('/')}>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <GitGraph className="w-6 h-6 text-blue-600" />
                        Workflow Engine
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/designer" icon={GitGraph} label="Workflow Designer" />
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            U
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">User</p>
                            <p className="text-xs text-gray-500">Admin</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};
