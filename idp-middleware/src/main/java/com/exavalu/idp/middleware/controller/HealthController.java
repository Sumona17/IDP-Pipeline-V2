package com.exavalu.idp.middleware.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthController {

    @GetMapping("/status")
    @Operation(summary = "Get application health status")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {

        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("application", "Document Management Service");
        health.put("version", "1.0.0");
        health.put("timestamp", System.currentTimeMillis());

        health.put("database", "N/A");

        return ResponseEntity.ok(health);
    }
}
