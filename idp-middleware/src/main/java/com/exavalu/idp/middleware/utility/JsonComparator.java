package com.exavalu.idp.middleware.utility;

import com.exavalu.idp.middleware.dto.JsonDiffDto;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;

public class JsonComparator {

    private static final Set<String> COMPARE_KEYS = Set.of("value", "checked");

    public static List<JsonDiffDto> compare(JsonNode original, JsonNode updated) {

        List<JsonDiffDto> diffs = new ArrayList<>();

        JsonNode sections1 = original.get("sections");
        JsonNode sections2 = updated.get("sections");

        if (sections1 != null && sections2 != null && sections1.isArray()) {

            for (int i = 0; i < sections1.size(); i++) {

                JsonNode sec1 = sections1.get(i);
                JsonNode sec2 = sections2.get(i);

                int pageNumber = sec1.has("page") ? sec1.get("page").asInt() : i;


                compareNodes(sec1, sec2,
                        String.valueOf(pageNumber),
                        "",
                        diffs);
            }
        }

        return diffs;
    }

    private static void compareNodes(JsonNode node1,
                                     JsonNode node2,
                                     String pageNumber,
                                     String hierarchy,
                                     List<JsonDiffDto> diffs) {

        if (node1 == null || node2 == null) {
            return;
        }

        if (node1.isObject() && node2.isObject()) {

            Iterator<String> fieldNames = node1.fieldNames();

            while (fieldNames.hasNext()) {

                String field = fieldNames.next();

                // Skip page field
                if ("page".equals(field)) {
                    continue;
                }

                JsonNode child1 = node1.get(field);
                JsonNode child2 = node2.get(field);

                if (COMPARE_KEYS.contains(field)) {

//                    String val1 = child1 != null && !child1.isNull() ? child1.asText() : null;
//                    String val2 = child2 != null && !child2.isNull() ? child2.asText() : null;
//
//                    if (!Objects.equals(val1, val2)) {
//                        diffs.add(new JsonDiffDto(pageNumber, hierarchy, val1, val2));
//                    }

                    String val1;
                    String val2;

                    if ("checked".equals(field)) {

                        val1 = (child1 != null && child1.asBoolean(false)) ? "Yes" : "No";
                        val2 = (child2 != null && child2.asBoolean(false)) ? "Yes" : "No";

                    } else {

                        val1 = child1 != null && !child1.isNull() ? child1.asText() : null;
                        val2 = child2 != null && !child2.isNull() ? child2.asText() : null;
                    }

                    if (!Objects.equals(val1, val2)) {
                        diffs.add(new JsonDiffDto(pageNumber, hierarchy, val1, val2));
                    }

                } else {

                    String newHierarchy;

                    if (hierarchy.isEmpty()) {
                        newHierarchy = field;
                    } else {
                        newHierarchy = hierarchy + " > " + field;
                    }

                    compareNodes(child1, child2, pageNumber, newHierarchy, diffs);
                }
            }
        }

        else if (node1.isArray() && node2.isArray()) {

            for (int i = 0; i < node1.size(); i++) {
                compareNodes(
                        node1.get(i),
                        node2.get(i),
                        pageNumber,
                        hierarchy + "[" + i + "]",
                        diffs
                );
            }
        }
    }
}
