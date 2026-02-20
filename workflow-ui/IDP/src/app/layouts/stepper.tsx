import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/submission.scss";
import { tabs } from "../components/tabs";
import { Tabs } from "antd";

const Stepper: React.FC = () => {
  const [activeKey, setActiveKey] = useState("1");
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const SUMMARY_TAB_KEY = String(tabs.length);
  const isSummaryPage = activeKey === SUMMARY_TAB_KEY;

  return (
      <div className="w-full flex flex-col gap-6">
        <nav className="text-sm">
        <ol className="flex items-center gap-1">
          <button
            type="button"
            className="!text-[#4318FF] font-semibold cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            Open Queue
          </button>
          <span className="text-gray-400">›</span>
         
            <li className="text-gray-700 font-medium"></li>
        </ol>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dcouments</h1>
          <div className="flex gap-3">
            {/* <button
              className="
              rounded-full border bg-[#4318FF1F] border-[#4318FF] text-[#4318FF]
              px-3 py-0.5 font-medium hover:bg-[#4318FF]/5
            "
            >
              Save
            </button> */}
          </div>
        </div>

      <Tabs
        className="custom-tabs"
        defaultActiveKey="1"
        activeKey={activeKey}
        onChange={setActiveKey}
        type="card"
        tabBarExtraContent={
          {
          }
        }
        items={tabs.map((Icon, i) => {
          const id = String(i + 1);
          const IconToShow = activeKey === id ? Icon.iconActive : Icon.icon;

          return {
            key: id,
            label: Icon.label,
            children: Icon.content,
            icon: IconToShow,
          };
        })}
      />
    </div>
  );
};

export default Stepper;