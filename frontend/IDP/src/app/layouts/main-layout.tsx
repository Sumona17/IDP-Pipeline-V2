import { Outlet } from "react-router-dom";

import Sidebar from "../components/sidebar/sidebar";
import Header from "../components/header/header";


export const MainLayout = () => {

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="p-6 overflow-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
