import React, { useMemo } from "react";
import { Table, Collapse } from "antd";
import "../styles/diff-table.scss";

const { Panel } = Collapse;

export default function DiffTable({ diff }) {
  const groupedData = useMemo(() => {
    return diff.reduce((acc, item) => {
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
        {Object.entries(groupedData).map(([section, records]) => (
          <Panel
            header={`Section: ${section}`}
            key={section}
            className="diff-panel"
          >
            <Table
              columns={columns}
              dataSource={records}
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
