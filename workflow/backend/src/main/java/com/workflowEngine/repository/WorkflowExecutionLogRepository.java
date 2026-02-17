package com.workflowEngine.repository;

import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowExecutionLogRepository
        extends JpaRepository<WorkflowExecutionLog, String> {



    List<WorkflowExecutionLog> findByWorkflowInstanceIdOrderByExecutedAtAsc(String instanceId);
}
