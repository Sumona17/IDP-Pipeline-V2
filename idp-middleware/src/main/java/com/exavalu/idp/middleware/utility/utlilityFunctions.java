package com.exavalu.idp.middleware.utility;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class utlilityFunctions {

    public Long calculateLimitFromAcord140Info(Map<String, Object> acord140Info) {
        if (acord140Info == null) {
            return null;
        }

        Object premisesInfoObj = acord140Info.get("premisesInformation");
        if (!(premisesInfoObj instanceof List<?> premisesInformation)) {
            return null;
        }

        long total = 0;

        for (Object premisesObj : premisesInformation) {
            if (!(premisesObj instanceof Map<?, ?> premisesMap))
                continue;

            Object coveragesObj = premisesMap.get("coverages");
            if (!(coveragesObj instanceof List<?> coverages))
                continue;

            for (Object coverageObj : coverages) {
                if (!(coverageObj instanceof Map<?, ?> coverageMap))
                    continue;

                Object amountObj = coverageMap.get("amount");
                if (amountObj != null && !amountObj.toString().isBlank()) {
                    try {
                        total += Long.parseLong(amountObj.toString());
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return total;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> populateEstimatedReplacementCost(Map<String, Object> acord140Info) {

        Map<String, Object> buildingInfo = (Map<String, Object>) acord140Info.get("buildingInformation");

        List<Map<String, Object>> locations = (List<Map<String, Object>>) buildingInfo.get("locations");

        List<Map<String, Object>> premisesInformation = (List<Map<String, Object>>) acord140Info
                .get("premisesInformation");

        Map<String, Long> locationToTotalAmount = new HashMap<>();

        for (Map<String, Object> premises : premisesInformation) {
            String locationNumber = String.valueOf(premises.get("locationNumber"));

            List<Map<String, Object>> coverages = (List<Map<String, Object>>) premises.get("coverages");

            long total = 0;

            for (Map<String, Object> coverage : coverages) {
                if ("Building".equals(coverage.get("subjectOfInsurance"))) {
                    String amountStr = (String) coverage.get("amount");
                    if (amountStr != null && !amountStr.isBlank()) {
                        total += Long.parseLong(amountStr);
                    }
                }
            }

            locationToTotalAmount.merge(locationNumber, total, Long::sum);
        }

        for (Map<String, Object> location : locations) {
            String locationId = String.valueOf(location.get("id"));

            Long totalAmount = locationToTotalAmount.get(locationId);
            if (totalAmount == null)
                continue;

            List<Map<String, Object>> buildings = (List<Map<String, Object>>) location.get("buildings");

            for (Map<String, Object> building : buildings) {
                Map<String, Object> details = (Map<String, Object>) building.get("details");

                Map<String, Object> propertyDetails = (Map<String, Object>) details.get("propertyDetails");

                propertyDetails.put(
                        "estimatedReplacementCost",
                        String.valueOf(totalAmount));
            }
        }
        return acord140Info;
    }

}
