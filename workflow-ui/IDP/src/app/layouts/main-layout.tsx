import { Outlet } from "react-router-dom";

import Sidebar from "../components/sidebar/sidebar";
import Header from "../components/header/header";


export const MainLayout = () => {

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
