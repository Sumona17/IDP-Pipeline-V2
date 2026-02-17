package com.workflowEngine.repository;

import com.workflowEngine.dto.workflowExecution.WorkflowInstanceView;
import com.workflowEngine.model.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowInstanceRepository
        extends JpaRepository<WorkflowInstance, String> {

    @Query("""
        SELECT new com.workflowEngine.dto.workflowExecution.WorkflowInstanceView(
            i.id,
            d.id,
            d.name,
            i.status,
            i.currentNodeName,
            i.startedAt,
            i.completedAt
        )
        FROM WorkflowInstance i
        JOIN WorkflowDefinition d
            ON i.workflowId = d.id
        ORDER BY i.startedAt DESC
    """)
    List<WorkflowInstanceView> findAllWithWorkflowName();

    List<WorkflowInstance> findByStatus(String status);


}

