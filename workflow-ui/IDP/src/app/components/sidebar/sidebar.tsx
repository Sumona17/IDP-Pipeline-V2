import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, User, ChartNoAxesCombined } from "lucide-react";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`h-full bg-white shadow-md p-6 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-50"
      }`}
    >
      {!isCollapsed && (
        <div className="mb-8">
          {/* <img src={logo} className="w-40 h-auto mx-auto" alt="Logo" /> */}
        </div>
      )}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center gap-3 pb-4 mb-6 border-b border-gray-200 ${
          isCollapsed ? "justify-center" : "justify-end"
        }`}
      >
        {!isCollapsed && <span className="text-gray-500 text-base">Collapse</span>}
        <div className="relative w-7 h-5 border-2 border-indigo-500 rounded-sm flex items-center">
          {!isCollapsed ? (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-xl"></div>
          ) : (
            <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-xl"></div>
          )}
        </div>
      </button>
      <nav className="flex flex-col gap-8">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-4 text-lg font-semibold relative transition-colors ${
              isCollapsed ? "justify-center" : "pl-4"
            } ${isActive ? "text-blue-600" : "text-gray-300"}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-r"></div>
              )}
              <LayoutDashboard 
                size={24} 
                className="flex-shrink-0" 
                fill={isActive ? "#4318FF" : "none"}
                stroke={isActive ? "#4318FF" : "currentColor"}
              />
              {!isCollapsed && <span>Dashboard</span>}
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;