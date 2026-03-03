export const formatTimestamp = (
  timestamp: number,
  showTime = false,
): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(showTime && { hour: "numeric", minute: "2-digit", hour12: true }),
  };

  return new Date(timestamp * 1000).toLocaleString("en-US", options);
};
