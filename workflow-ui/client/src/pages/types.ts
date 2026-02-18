export interface Instance {
  id: string;
  workflowDefinition: { name: string };
  status: string;
  createdAt: string;
  workflowJson?: any;
}

export interface InstanceStep {
  id: string;
  workflowInstanceId: string;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: string;
  message: string;
  executedAt: string;
  requestPayload?: string;
  responsePayload?: string;
  durationFormatted?: string;
}

export interface Workflow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  definitionJson?: any;
  version?: string;
}

export interface ExecutionInstance {
  id: string;
  instanceId: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt: string;
  completedAt: string;
  duration?: string;
}
