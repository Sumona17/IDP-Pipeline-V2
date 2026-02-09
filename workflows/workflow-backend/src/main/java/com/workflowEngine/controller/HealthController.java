package com.workflowEngine.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthController {


    private final DataSource dataSource;

    @Autowired
    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/status")
    @Operation(summary = "Get application health status")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("application", "Wokflow Engine Service");
        health.put("version", "1.0.0");
        health.put("timestamp", System.currentTimeMillis());

        try (Connection connection = dataSource.getConnection()) {
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
            health.put("status", "DOWN");
        }

        return ResponseEntity.ok(health);
    }
}