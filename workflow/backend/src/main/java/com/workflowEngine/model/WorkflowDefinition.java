package com.workflowEngine.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "WorkflowDefinition")
@Getter @Setter
public class WorkflowDefinition {

    @Id
    @Column(length = 36)
    private String id;

    private String name;
    private String version;
    private String status;

    @Column(columnDefinition = "json")
    private String definitionJson;

    private String createdAt;
    private String updatedAt;
}

