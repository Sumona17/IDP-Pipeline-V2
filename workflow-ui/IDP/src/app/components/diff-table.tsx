import React, { useMemo } from "react";
import { Table, Collapse } from "antd";
import "../styles/diff-table.scss";

const { Panel } = Collapse;

interface DiffItem {
  key: string;
  section: string;
  field: string;
  originalValue: string;
  newValue: string;
}

export default function DiffTable({ diff }: { diff: DiffItem[] }) {
  const groupedData = useMemo(() => {
    return diff.reduce<Record<string, DiffItem[]>>((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    }, {});
  }, [diff]);

  const columns = [
    { dataIndex: "field", title: "Field" },
    { dataIndex: "originalValue", title: "Initial Value" },
    { dataIndex: "newValue", title: "New Value" },
  ];

  return (
    <div className="scrollable-div">
      <Collapse defaultActiveKey={Object.keys(groupedData)}>
        {Object.entries(groupedData).map(([section, sectionData]) => (
          <Panel
            header={`Section: ${section}`}
            key={section}
            className="diff-panel"
          >
            <Table
              columns={columns}
              dataSource={sectionData}
              rowKey="key"
              size="small"
              pagination={false}
              className="diff-table"
            />
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}
