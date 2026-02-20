export const documentColumns = [
  // {
  //   title: "Status",
  //   dataIndex: "status",
  //   key: "status",
  //   width: 120,
  // },
  {
    title: "Document Name",
    dataIndex: "name",
    key: "name",
    align: "left" as const,
  },
  {
  title: "Document Type",
  key: "documentType",
  align: "left" as const,
  render: (_: any, record: any) =>
    record.name
      ? record.name
          .replace(/\.pdf$/i, "")   
          .split("_")[0]            
      : "—",
  },
  {
    title: "Document Size",
    dataIndex: "size",
    key: "size",
    // width: 120,
    align: "left" as const,
  },
  {
    title: "Progress",
    dataIndex: "fileProgress",
    key: "fileProgress",
    // width: 140,
    align: "left" as const,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    // width: 140,
    align: "left" as const,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    // width: 140,
    align: "left" as const,
  },

  {
    title: "Actions",
    key: "actions",
    // width: 180,
    align: "center" as const,
  },
];