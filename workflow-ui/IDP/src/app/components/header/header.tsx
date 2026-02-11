import React from "react";
import { Search, Bell } from "lucide-react";
import { Dropdown, type MenuProps } from "antd";
import avatar from '../../../../public/assets/icons/avatar.jpg'

const Header: React.FC = () => {

const items: MenuProps["items"] = [
  {
    key: "profile",
    label: "Profile",
  },
  {
    key: "logout",
    label: "Logout",
  },
];

  return (
    <div className="flex justify-end items-center gap-4 px-6 pt-4 pb-1">
      <div className="flex items-center bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-full px-2 py-1 gap-6">
        <div className="flex items-center bg-[#F4F6FF] px-2 py-2 rounded-full gap-2">
          <Search size={12} className="text-gray-600" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent text-sm focus:outline-none w-40"
          />
        </div>
        <Bell size={20} className="text-[#3C20F6] cursor-pointer" />
        <Dropdown menu={{ items }} trigger={["click"]}>
          <span className="cursor-pointer">
            <div className="flex items-center gap-2">
              <img className="w-8 h-8 rounded-full" src={avatar} alt="user" />
              <div className="leading-tight">
                <p className="text-sm">Mike Ross</p>
                <p className="text-xs text-gray-500">Underwriter</p>
              </div>
              <svg
                width="16"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-600"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </span>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;
