package com.workflowEngine.repository;

import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface WorkflowDefinitionRepository
        extends JpaRepository<WorkflowDefinition, String> {

    List<WorkflowDefinition> findByStatus(String status);
}

