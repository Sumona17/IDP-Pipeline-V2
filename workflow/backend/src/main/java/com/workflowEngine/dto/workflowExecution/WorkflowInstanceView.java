package com.workflowEngine.dto.workflowExecution;

import java.time.LocalDateTime;

public class WorkflowInstanceView {

    private String instanceId;
    private String workflowId;
    private String workflowName;
    private String status;
    private String currentNodeName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String durationFormatted;


    public WorkflowInstanceView(
            String instanceId,
            String workflowId,
            String workflowName,
            String status,
            String currentNodeName,
            LocalDateTime startedAt,
            LocalDateTime completedAt
    ) {
        this.instanceId = instanceId;
        this.workflowId = workflowId;
        this.workflowName = workflowName;
        this.status = status;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.currentNodeName= currentNodeName;
    }

    public String getInstanceId() {
        return instanceId;
    }

    public String getWorkflowId() {
        return workflowId;
    }

    public String getWorkflowName() {
        return workflowName;
    }

    public String getStatus() {
        return status;
    }

    public String getCurrentNodeName(){
        return currentNodeName;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public String getDurationFormatted() {
        return durationFormatted;
    }


    public void setDurationFormatted(String durationFormatted){
        this.durationFormatted= durationFormatted;
    }
}
