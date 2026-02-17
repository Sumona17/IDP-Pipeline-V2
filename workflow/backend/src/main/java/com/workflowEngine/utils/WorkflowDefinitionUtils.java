package com.workflowEngine.utils;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Optional;

public class WorkflowDefinitionUtils {

    public static Optional<JsonNode> findNodeByLabel(
            JsonNode definitionJson,
            String nodeName
    ) {
        JsonNode nodes = definitionJson.get("nodes");
        if (nodes == null || !nodes.isArray()) {
            return Optional.empty();
        }

        for (JsonNode node : nodes) {
            JsonNode data = node.get("data");
            if (data != null) {
                String label = data.path("label").asText();
                if (label.equalsIgnoreCase(nodeName)) {
                    return Optional.of(node);
                }
            }
        }
        return Optional.empty();
    }
}

