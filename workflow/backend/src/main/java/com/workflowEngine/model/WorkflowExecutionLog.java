package com.workflowEngine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Entity
@Table(name = "WorkflowExecutionLog")
@Getter
@Setter
public class WorkflowExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String workflowInstanceId;
    private String nodeId;
    private String nodeType;
    private String nodeName;
    private String status;
    private String message;

    @Column(columnDefinition = "json")
    private String requestPayload;

    @Column(columnDefinition = "json")
    private String responsePayload;

    private Long executedAt;
}
