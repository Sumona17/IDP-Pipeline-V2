package com.exavalu.idp.middleware.utility;

public class FileSizeUtil {

    private static final String[] UNITS = {"B", "KB", "MB", "GB", "TB"};

    public static String formatFileSize(Object bytesValue) {

        if (bytesValue == null) {
            return "0 B";
        }

        long bytes;

        try {
            if (bytesValue instanceof Number) {
                bytes = ((Number) bytesValue).longValue();
            } else {
                String bytesStr = bytesValue.toString().trim();
                if (bytesStr.isEmpty()) {
                    return "0 B";
                }
                bytes = Long.parseLong(bytesStr);
            }
        } catch (Exception e) {
            return "0 B";
        }

        if (bytes <= 0) {
            return "0 B";
        }

        int unitIndex = (int) (Math.log10(bytes) / Math.log10(1024));
        double size = bytes / Math.pow(1024, unitIndex);

        if (size % 1 == 0) {
            return String.format("%.0f %s", size, UNITS[unitIndex]);
        }

        return String.format("%.2f %s", size, UNITS[unitIndex]);
    }

}
