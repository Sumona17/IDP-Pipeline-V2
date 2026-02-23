import React, { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export function useGlobalSort<T>(data: T[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a: any, b: any) => {
      let valueA = a[sortConfig.key as string];
      let valueB = b[sortConfig.key as string];

      if (valueA == null) return 1;
      if (valueB == null) return -1;
      if (!isNaN(Date.parse(valueA))) {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      if (typeof valueA === "string") valueA = valueA.toLowerCase();
      if (typeof valueB === "string") valueB = valueB.toLowerCase();

      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const SortHeader = ({
    columnKey,
    label,
    className = "",
  }: {
    columnKey: keyof T;
    label: string;
    className?: string;
  }) => {
    const isActive = sortConfig.key === columnKey;

    return (
      <th
        onClick={() => requestSort(columnKey)}
        className={`px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none ${className}`}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="text-gray-400">
            {!isActive && "⇅"}
            {isActive && sortConfig.direction === "asc" && "↑"}
            {isActive && sortConfig.direction === "desc" && "↓"}
          </span>
        </div>
      </th>
    );
  };

  return { sortedData, SortHeader };
}

export const formatTimestamp = (timestamp: number, showTime = false): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(showTime && { hour: "numeric", minute: "2-digit", hour12: true }),
  };

  return new Date(timestamp * 1000).toLocaleString("en-US", options);
};

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };
