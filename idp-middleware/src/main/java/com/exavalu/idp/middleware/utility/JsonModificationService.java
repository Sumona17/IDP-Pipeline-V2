package com.exavalu.idp.middleware.utility;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.*;

public class JsonModificationService {

    private static final Set<String> COMPARE_KEYS = Set.of("value", "checked");

    public static void markModifications(JsonNode original, JsonNode updated) {

        JsonNode sections1 = original.get("sections");
        JsonNode sections2 = updated.get("sections");

        if (sections1 != null && sections2 != null && sections1.isArray()) {

            for (int i = 0; i < sections1.size(); i++) {

                JsonNode sec1 = sections1.get(i);
                JsonNode sec2 = sections2.get(i);

                traverse(sec1, sec2);
            }
        }
    }

    private static void traverse(JsonNode originalNode, JsonNode updatedNode) {

        if (originalNode == null || updatedNode == null) {
            return;
        }

        if (originalNode.isObject() && updatedNode.isObject()) {

            ObjectNode updatedObj = (ObjectNode) updatedNode;

            Iterator<String> fields = originalNode.fieldNames();

            while (fields.hasNext()) {

                String field = fields.next();

                JsonNode child1 = originalNode.get(field);
                JsonNode child2 = updatedNode.get(field);

                if (COMPARE_KEYS.contains(field)) {

                    String oldVal = child1 != null && !child1.isNull() ? child1.asText() : null;
                    String newVal = child2 != null && !child2.isNull() ? child2.asText() : null;

                    if (!Objects.equals(oldVal, newVal)) {

                        updatedObj.put("originalValue", oldVal);
                        updatedObj.put("modified", true);
                    }

                } else {

                    traverse(child1, child2);
                }
            }
        }

        else if (originalNode.isArray() && updatedNode.isArray()) {

            for (int i = 0; i < originalNode.size(); i++) {

                traverse(originalNode.get(i), updatedNode.get(i));
            }
        }
    }
}
