package com.workflowEngine.model;


import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;


@Entity
@Table(name = "workflow_instance")
@Getter @Setter
public class WorkflowInstance {

    @Id
    private String id;

    private String workflowId;
    private String entityId;
    private String status;
    private String currentNode;
    private String currentNodeName;
    private String currentNodeStatus;


    private LocalDateTime startedAt;
    private LocalDateTime completedAt;



}

