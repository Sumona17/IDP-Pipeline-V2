import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus, Download } from 'lucide-react';
import axios from 'axios';

interface Instance {
    id: string;
    workflowDefinition: { name: string };
    status: string;
    createdAt: string;
    workflowJson?: any;
}

interface InstanceStep {
    id: string;
    workflowInstanceId: string;
    nodeId: string;
    nodeType: string;
    nodeName: string;
    status: string;
    message: string;
    executedAt: string;
}

export const Dashboard = () => {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [filteredInstances, setFilteredInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(localStorage.getItem('autoRefresh') === 'true');
    const [refreshInterval, setRefreshInterval] = useState(parseInt(localStorage.getItem('refreshInterval') || '10', 10));
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [dateFilter, setDateFilter] = useState('');
    const [executingIds, setExecutingIds] = useState<Set<string>>(new Set());
    const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
    const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
    const [allWorkflows, setAllWorkflows] = useState<any[]>([]);
    const [allInstances, setAllInstances] = useState<any[]>([]);
    const [selectedTab, setSelectedTab] = useState<'workflows' | 'instances'>('workflows');
    const [instanceSteps, setInstanceSteps] = useState<InstanceStep[] | null>(null);
    const [instanceStepsLoading, setInstanceStepsLoading] = useState(false);
    const [instanceStepsError, setInstanceStepsError] = useState<string | null>(null);
    const [activeInstanceMeta, setActiveInstanceMeta] = useState<{ id: string; workflowId?: string } | null>(null);
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/findAll`).then((response) => {
            setAllWorkflows(response.data);
        })
        .catch(() => {
            console.log("error");
        })
    },[])

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_BASE_URL}/findAllExecutions`).then((response) => {

            console.log('allinstances', response.data)
            setAllInstances(response.data);
        })
        .catch(() => {
            console.log("error");
        })
    },[])

    const resolveValue = (value: string, taskValues: Record<string, any>): any => {
        const refMatch = value.match(/\$?\{?([a-zA-Z0-9\-_]+)\.([a-zA-Z0-9_]+)\}?/);
        if (refMatch) {
            const [, nodeId, field] = refMatch;
            return taskValues[nodeId]?.[field] ?? value;
        }
        const num = Number(value);
        return isNaN(num) ? value : num;
    };

    const evaluateCondition = (
        condition: string,
        taskValues: Record<string, any>,
        nodeNameMap: Record<string, string>
    ): boolean => {
        try {
            let evalStr = condition;

            for (const [nodeName, nodeId] of Object.entries(nodeNameMap)) {
                const nameRegex = new RegExp(`\\b${nodeName}\\b`, 'g');
                const nodeTaskData = taskValues[nodeId];
                if (nodeTaskData?.assignedValue !== undefined) {
                    evalStr = evalStr.replace(nameRegex, JSON.stringify(nodeTaskData.assignedValue));
                }
            }

            const refMatches = condition.matchAll(/\$?\{?([a-zA-Z0-9\-_]+)\.([a-zA-Z0-9_]+)\}?/g);
            for (const match of refMatches) {
                const [fullMatch, nodeId, field] = match;
                const value = taskValues[nodeId]?.[field];
                evalStr = evalStr.replace(fullMatch, JSON.stringify(value));
            }

            // eslint-disable-next-line no-eval
            return eval(evalStr);
        } catch (err) {
            console.error('Condition evaluation error:', err, 'Condition:', condition);
            return false;
        }
    };

    const normalizeWorkflowForExecution = (workflow: any) => {
        const workflowNodes = workflow?.nodes || [];
        const workflowEdges = (workflow?.edges || []).map((edge: any) => ({
            ...edge,
            data: {
                ...(edge.data || {}),
                label: edge.data?.label ?? edge.label ?? ''
            }
        }));

        return { workflowNodes, workflowEdges };
    };

    const executeWorkflow = async (workflow: any) => {
        const { workflowNodes, workflowEdges } = normalizeWorkflowForExecution(workflow);

        const result: any = {
            status: 'running',
            executedSteps: [],
            taskValues: {},
            path: [],
            errorAt: null,
            errorMessage: null
        };

        const executedNodesSet = new Set<string>();
        const executedEdgesSet = new Set<string>();
        const taskValues: Record<string, any> = {};

        const nodeNameMap: Record<string, string> = {};
        workflowNodes.forEach((node: any) => {
            if (node.data?.label) {
                nodeNameMap[node.data.label] = node.id;
            }
        });

        try {
            const startNode = workflowNodes.find((n: any) => n.type === 'start');
            if (!startNode) {
                throw new Error('No start node found');
            }

            let currentNodeId = startNode.id;
            const visited = new Set<string>();
            const maxSteps = 100;
            let stepCount = 0;

            while (stepCount < maxSteps) {
                stepCount++;
                if (visited.has(currentNodeId)) {
                    throw new Error('Infinite loop detected');
                }
                visited.add(currentNodeId);

                const currentNode = workflowNodes.find((n: any) => n.id === currentNodeId);
                if (!currentNode) break;

                executedNodesSet.add(currentNodeId);
                result.path.push(currentNodeId);

                await new Promise((resolve) => setTimeout(resolve, 500));

                if (currentNode.type === 'task') {
                    const taskData: any = { name: currentNode.data.label };
                    const rawValue = currentNode.data?.value ?? '';
                    const resolvedValue =
                        rawValue === '' ? '' : resolveValue(String(rawValue), taskValues);
                    taskData.value = rawValue;
                    taskData.assignedValue = resolvedValue;
                    taskData.valueType = currentNode.data?.valueType || 'static';

                    if (currentNode.data.function === 'send_email') {
                        try {
                            const res = await axios.post('/api/send-mail', {
                                sender: currentNode.data.sender,
                                recipient: currentNode.data.recipient,
                                objective: currentNode.data.objective
                            });

                            taskData.email = { status: 'sent', response: res.data };

                            result.executedSteps.push({
                                nodeId: currentNodeId,
                                type: 'task',
                                name: currentNode.data.label,
                                action: 'SEND_EMAIL'
                            });
                        } catch (err: any) {
                            throw new Error(`Email failed at "${currentNode.data.label}"`);
                        }
                    } else if (
                        currentNode.data.function === 'api_call' ||
                        currentNode.data.function === 'api'
                    ) {
                        try {
                            const fullUrl = `${currentNode.data.url}:${currentNode.data.port}${currentNode.data.endpoint}`;

                            const res = await axios({
                                method: currentNode.data.method || 'POST',
                                url: fullUrl
                            });

                            taskData.api = { status: 'success', response: res.data };

                            result.executedSteps.push({
                                nodeId: currentNodeId,
                                type: 'task',
                                name: currentNode.data.label,
                                action: 'API_CALL',
                                url: fullUrl,
                                method: currentNode.data.method
                            });
                        } catch (err: any) {
                            throw new Error(`API call failed at "${currentNode.data.label}"`);
                        }
                    }

                    taskValues[currentNodeId] = taskData;
                } else if (currentNode.type === 'gateway') {
                    result.executedSteps.push({
                        nodeId: currentNodeId,
                        type: 'gateway',
                        name: currentNode.data.label,
                        decision: 'evaluating'
                    });
                } else if (currentNode.type === 'end') {
                    executedNodesSet.add(currentNodeId);
                    result.path.push(currentNodeId);
                    result.executedSteps.push({
                        nodeId: currentNodeId,
                        type: 'end',
                        name: currentNode.data.label
                    });
                    break;
                }

                const outgoingEdges = workflowEdges.filter((e: any) => e.source === currentNodeId);

                if (currentNode.type === 'gateway') {
                    const decisionRules = (currentNode.data.decisionRules as any[]) || [];
                    let nextEdgeId: string | null = null;

                    for (const rule of decisionRules) {
                        if (evaluateCondition(rule.condition, taskValues, nodeNameMap)) {
                            nextEdgeId =
                                outgoingEdges.find((e: any) => e.data?.label === rule.output)
                                    ?.id || null;
                            result.executedSteps[result.executedSteps.length - 1].decision =
                                rule.output;
                            break;
                        }
                    }

                    if (nextEdgeId) {
                        executedEdgesSet.add(nextEdgeId);
                        const nextEdge = workflowEdges.find((e: any) => e.id === nextEdgeId);
                        if (nextEdge) {
                            currentNodeId = nextEdge.target;
                        } else {
                            throw new Error(`No edge found with ID ${nextEdgeId}`);
                        }
                    } else {
                        break;
                    }
                } else if (outgoingEdges.length > 0) {
                    const nextEdge = outgoingEdges[0];
                    executedEdgesSet.add(nextEdge.id);
                    currentNodeId = nextEdge.target;
                } else {
                    break;
                }
            }

            if (stepCount >= maxSteps) {
                throw new Error('Workflow execution exceeded maximum steps');
            }

            result.status = 'completed';
            result.taskValues = taskValues;
        } catch (error) {
            result.status = 'failed';
            result.errorMessage = (error as Error).message;
        }

        return {
            ...result,
            executedNodes: executedNodesSet,
            executedEdges: executedEdgesSet
        };
    };

    const fetchInstanceSteps = async (instanceId: string): Promise<InstanceStep[]> => {
        setInstanceStepsLoading(true);
        setInstanceStepsError(null);

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_BASE_URL}/logs/${instanceId}`
            );
            return res.data as InstanceStep[];
        } finally {
            setInstanceStepsLoading(false);
        }
    };

    const openInstanceSteps = async (instance: any) => {
        setActiveInstanceMeta({ id: instance.id, workflowId: instance.workflowId });
        setInstanceSteps(null);
        try {
            const steps = await fetchInstanceSteps(instance.id);
            setInstanceSteps(steps);
        } catch (err: any) {
            setInstanceStepsError('Failed to load instance steps');
            setInstanceSteps([]);
        } finally {
            setInstanceStepsLoading(false);
        }
    };

    const workflows: Instance[] = [
        {
            id: 'wf-demo-1',
            workflowDefinition: { name: 'Demo Workflow A' },
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            workflowJson: {
                workflowId: 'my-workflow',
                name: 'My Workflow',
                description: 'Created via Workflow Designer',
                version: '1.0.0',
                nodes: [
                    {
                        id: 'start-qi5jngyv',
                        type: 'start',
                        position: { x: 526.6927943199047, y: -55.245694526707084 },
                        data: { label: 'Start' }
                    },
                    {
                        id: 'task-hiu60i7m',
                        type: 'task',
                        position: { x: 484.46854117517216, y: 66.14903326439921 },
                        data: {
                            label: 'v',
                            assignee: '',
                            description: '',
                            value: '10',
                            valueType: 'static',
                            function: '',
                            sender: '',
                            recipient: '',
                            objective: ''
                        }
                    },
                    {
                        id: 'gateway-q23ouvwt',
                        type: 'gateway',
                        position: { x: 517.4562389444944, y: 174.34868194777658 },
                        data: {
                            label: 'Decision',
                            decisionRules: [
                                { id: 'row-1770024837535', condition: 'v > 10', output: 'approved' },
                                { id: 'row-1770024848091', condition: 'v <= 10', output: 'rejected' }
                            ]
                        }
                    },
                    {
                        id: 'task-5n3egk41',
                        type: 'task',
                        position: { x: 368.35184502715754, y: 323.45307586511365 },
                        data: {
                            label: 'Approved Task',
                            assignee: '',
                            description: '',
                            value: '',
                            valueType: 'static',
                            function: '',
                            sender: '',
                            recipient: '',
                            objective: ''
                        }
                    },
                    {
                        id: 'task-t4a92yto',
                        type: 'task',
                        position: { x: 584.7511423939122, y: 324.7725837758866 },
                        data: {
                            label: 'Rejected Task',
                            assignee: '',
                            description: '',
                            value: '',
                            valueType: 'static',
                            function: 'api',
                            sender: '',
                            recipient: '',
                            objective: ''
                        }
                    },
                    {
                        id: 'end-aemoj4qb',
                        type: 'end',
                        position: { x: 514.8172231229487, y: 429.0137087269452 },
                        data: { label: 'End' }
                    }
                ],
                edges: [
                    { id: 'edge-6agzza69', source: 'start-qi5jngyv', target: 'task-hiu60i7m', label: '' },
                    { id: 'edge-0cuv4is8', source: 'task-hiu60i7m', target: 'gateway-q23ouvwt', label: '' },
                    { id: 'edge-gxpm2u32', source: 'gateway-q23ouvwt', target: 'task-5n3egk41', label: 'approved' },
                    { id: 'edge-d4zl9epx', source: 'gateway-q23ouvwt', target: 'task-t4a92yto', label: 'rejected' },
                    { id: 'edge-pihmsl6b', source: 'task-5n3egk41', target: 'end-aemoj4qb', label: '' },
                    { id: 'edge-yj79kjmv', source: 'task-t4a92yto', target: 'end-aemoj4qb', label: '' }
                ]
            }
        },
        {
            id: 'wf-demo-2',
            workflowDefinition: { name: 'Demo Workflow B' },
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            workflowJson: {
                workflowId: 'quick-approval',
                name: 'Quick Approval',
                description: 'Second demo workflow',
                version: '1.0.0',
                nodes: [
                    {
                        id: 'start-b',
                        type: 'start',
                        position: { x: 100, y: 0 },
                        data: { label: 'Start' }
                    },
                    {
                        id: 'task-b1',
                        type: 'task',
                        position: { x: 100, y: 120 },
                        data: {
                            label: 'score',
                            value: '75',
                            valueType: 'static',
                            function: ''
                        }
                    },
                    {
                        id: 'gateway-b',
                        type: 'gateway',
                        position: { x: 100, y: 240 },
                        data: {
                            label: 'Decision',
                            decisionRules: [
                                { id: 'row-b1', condition: 'score >= 70', output: 'pass' },
                                { id: 'row-b2', condition: 'score < 70', output: 'fail' }
                            ]
                        }
                    },
                    {
                        id: 'task-b2',
                        type: 'task',
                        position: { x: 0, y: 360 },
                        data: { label: 'Approved', function: '' }
                    },
                    {
                        id: 'task-b3',
                        type: 'task',
                        position: { x: 200, y: 360 },
                        data: { label: 'Rejected', function: '' }
                    },
                    {
                        id: 'end-b',
                        type: 'end',
                        position: { x: 100, y: 480 },
                        data: { label: 'End' }
                    }
                ],
                edges: [
                    { id: 'edge-b1', source: 'start-b', target: 'task-b1', label: '' },
                    { id: 'edge-b2', source: 'task-b1', target: 'gateway-b', label: '' },
                    { id: 'edge-b3', source: 'gateway-b', target: 'task-b2', label: 'pass' },
                    { id: 'edge-b4', source: 'gateway-b', target: 'task-b3', label: 'fail' },
                    { id: 'edge-b5', source: 'task-b2', target: 'end-b', label: '' },
                    { id: 'edge-b6', source: 'task-b3', target: 'end-b', label: '' }
                ]
            }
        }
    ];

    const fetchInstances = async () => {
        setLoading(true);
        setInstances(workflows);
        setLoading(false);
    };

    useEffect(() => {
        fetchInstances();
    }, []);

    useEffect(() => {
        let filtered = instances;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(instance =>
                instance.workflowDefinition.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter) {
            filtered = filtered.filter(instance => instance.status === statusFilter);
        }

        // Filter by date
        if (dateFilter) {
            const filterDate = new Date(dateFilter).toDateString();
            filtered = filtered.filter(instance =>
                new Date(instance.createdAt).toDateString() === filterDate
            );
        }

        setFilteredInstances(filtered);
    }, [instances, searchTerm, statusFilter, dateFilter]);

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchInstances, refreshInterval * 1000); // Convert seconds to milliseconds
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    const getStatusBadge = (status: string) => {
        const statusStyles: Record<string, { bg: string; text: string }> = {
            'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800' },
            'FAILED': { bg: 'bg-red-100', text: 'text-red-800' },
            'RUNNING': { bg: 'bg-blue-100', text: 'text-blue-800' },
            'PENDING': { bg: 'bg-gray-100', text: 'text-gray-800' },
        };

        const style = statusStyles[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
                {status}
            </span>
        );
    };

    const getStepStatusStyle = (status: string) => {
        const styles: Record<string, { dot: string; badge: string }> = {
            'COMPLETED': { dot: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
            'FAILED': { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
            'STARTED': { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
            'RUNNING': { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
            'PENDING': { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-800' }
        };

        return styles[status] || { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-800' };
    };

    // Calculate statistics
    const stats = {
        total: instances.length,
        completed: instances.filter(i => i.status === 'COMPLETED').length,
        failed: instances.filter(i => i.status === 'FAILED').length,
        running: instances.filter(i => i.status === 'RUNNING').length,
    };

    const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;

    const exportData = () => {
        const dataToExport = filteredInstances.map(instance => ({
            workflowName: instance.workflowDefinition.name,
            status: instance.status,
            instanceId: instance.id,
            startedAt: new Date(instance.createdAt).toLocaleString(),
        }));

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `workflow-executions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExecute = async (instance: Instance) => {
        if (!instance.workflowJson) return;

        setExecutingIds((prev) => new Set(prev).add(instance.id));
        setInstances((prev) =>
            prev.map((i) =>
                i.id === instance.id ? { ...i, status: 'RUNNING' } : i
            )
        );

        try {
            const result = await executeWorkflow(instance.workflowJson);
            setInstances((prev) =>
                prev.map((i) =>
                    i.id === instance.id
                        ? { ...i, status: result.status === 'completed' ? 'COMPLETED' : 'FAILED' }
                        : i
                )
            );
            setExecutionResults((prev) => ({ ...prev, [instance.id]: result }));
            setActiveExecutionId(instance.id);
        } finally {
            setExecutingIds((prev) => {
                const next = new Set(prev);
                next.delete(instance.id);
                return next;
            });
        }
    };

    const handleExecuteNew = async (instance: Instance) => {

        alert("Execution started for "+instance);

        const reqBody = {
            "workflowId":instance.id,
            "entityId":"Testing: "+instance.name,
        }
        axios.post(`${import.meta.env.VITE_APP_BASE_URL}/start`, reqBody)
        .then((res) => {
            console.log("Execution started", res)
            alert("Executed "+instance.workflowDefinition.name);
        })
        .catch((err) => {
            console.log(err)
        })

    }

    return (
        <div className="p-8">
            {/* Header with Actions */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-500">Overview of workflow executions</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/designer')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        New Workflow
                    </button>
                    <button
                        onClick={fetchInstances}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-gray-500 text-sm font-medium">Total Runs</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-gray-500 text-sm font-medium">Success Rate</div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{successRate}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-gray-500 text-sm font-medium">Completed</div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-gray-500 text-sm font-medium">Failed</div>
                    <div className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</div>
                </div>
            </div>

            <div className="inline-flex flex-row w-[100%] rounded-lg p-8 pl-0 pr-0 mb-6">

                <div className={`w-[50%] text-center cursor-pointer rounded-lg border border-gray-700 p-4 mr-6 ${selectedTab === 'workflows' ? 'bg-[#043d51] text-white' : ''}`} onClick={() => setSelectedTab('workflows')}>Workflows</div>

                <div className={`w-[50%] text-center cursor-pointer rounded-lg border border-gray-700 p-4 ml-6 ${selectedTab === 'instances' ? 'bg-[#043d51] text-white' : ''}`} onClick={() => setSelectedTab('instances')}>Instances</div>

            </div>

            {/* Filters and Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Workflow</label>
                        <input
                            type="text"
                            placeholder="Search by workflow name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                            <option value="RUNNING">Running</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const newState = !autoRefresh;
                                setAutoRefresh(newState);
                                localStorage.setItem('autoRefresh', newState.toString());
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition flex-1 justify-center ${
                                autoRefresh
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-sm">Auto</span>
                        </button>
                        <button
                            onClick={exportData}
                            disabled={filteredInstances.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                            title="Export as JSON"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            {selectedTab === 'workflows' ? <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {allWorkflows && allWorkflows.map((instance) => (
                            <tr
                                key={instance.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                    if (instance.workflowJson) {
                                        navigate('/designer', { state: { workflow: instance.definitionJson } });
                                    }
                                }}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">{instance && instance.id.slice(0, 8)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{instance && instance.name}...</td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(instance.status)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(instance.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExecuteNew(instance);
                                        }}
                                        disabled={!instance.definitionJson || executingIds.has(instance.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                        title={!instance.definitionJson ? 'No workflow JSON available' : 'Execute workflow'}
                                    >
                                        <Play className="w-4 h-4" />
                                        {executingIds.has(instance.id) ? 'Executing...' : 'Execute'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredInstances.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <p className="font-medium">No executions found</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {instances.length === 0 
                                                    ? 'Start by creating a new workflow'
                                                    : 'Try adjusting your filters'}
                                            </p>
                                        </div>
                                        {instances.length === 0 && (
                                            <button
                                                onClick={() => navigate('/designer')}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                            >
                                                Create New Workflow
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>:
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Instance ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Started At</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {allInstances && allInstances.map((instance) => (
                            <tr
                                key={instance.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => openInstanceSteps(instance)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">{instance && instance.id.slice(0, 8)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{instance && instance.workflowId.slice(0,10)}</td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(instance.status)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(instance.startedAt).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(instance.completedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                        {filteredInstances.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <p className="font-medium">No executions found</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {instances.length === 0 
                                                    ? 'Start by creating a new workflow'
                                                    : 'Try adjusting your filters'}
                                            </p>
                                        </div>
                                        {instances.length === 0 && (
                                            <button
                                                onClick={() => navigate('/designer')}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                            >
                                                Create New Workflow
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>}

            {activeExecutionId && executionResults[activeExecutionId] && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Execution Result</h2>
                                <p className={`text-sm mt-1 font-medium ${
                                    executionResults[activeExecutionId].status === 'completed'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}>
                                    Status: {executionResults[activeExecutionId].status.toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveExecutionId(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {executionResults[activeExecutionId].errorMessage && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                                    <p className="text-sm text-red-700">
                                        {executionResults[activeExecutionId].errorMessage}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Execution Path</h3>
                                <div className="flex flex-wrap gap-2">
                                    {executionResults[activeExecutionId].path.map((nodeId: string, idx: number) => {
                                        const instance = instances.find((i) => i.id === activeExecutionId);
                                        const node = instance?.workflowJson?.nodes?.find((n: any) => n.id === nodeId);
                                        return (
                                            <div key={nodeId} className="flex items-center gap-2">
                                                <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                                                    {node?.data?.label || nodeId}
                                                </span>
                                                {idx < executionResults[activeExecutionId].path.length - 1 && (
                                                    <span className="text-gray-400">→</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {executionResults[activeExecutionId].executedSteps.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Steps</h3>
                                    <div className="space-y-2">
                                        {executionResults[activeExecutionId].executedSteps.map((step: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{step.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{step.type}</p>
                                                    </div>
                                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">#{idx + 1}</span>
                                                </div>
                                                {step.decision && (
                                                    <div className="mt-2 text-sm">
                                                        <span className="text-gray-600">Decision: </span>
                                                        <span className="font-semibold text-green-600">{step.decision}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Object.keys(executionResults[activeExecutionId].taskValues).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Task Values</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <pre className="text-xs overflow-x-auto text-gray-700">
                                            {JSON.stringify(executionResults[activeExecutionId].taskValues, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t p-6 flex gap-2">
                            <button
                                onClick={() => setActiveExecutionId(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeInstanceMeta && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Instance Steps</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Instance: {activeInstanceMeta.id.slice(0, 8)}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveInstanceMeta(null);
                                    setInstanceSteps(null);
                                    setInstanceStepsError(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {instanceStepsLoading && (
                                <div className="text-sm text-gray-500">Loading steps...</div>
                            )}

                            {instanceStepsError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-700">{instanceStepsError}</p>
                                </div>
                            )}

                            {!instanceStepsLoading && instanceSteps && instanceSteps.length > 0 && (
                                <div className="space-y-4">
                                    {instanceSteps
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                new Date(a.executedAt).getTime() -
                                                new Date(b.executedAt).getTime()
                                        )
                                        .map((step) => {
                                            const style = getStepStatusStyle(step.status);
                                            return (
                                                <div key={step.id} className="relative pl-6">
                                                    <div className="absolute left-2 top-2 h-full w-px bg-gray-200" />
                                                    <div
                                                        className={`absolute left-0 top-2 h-3 w-3 rounded-full ${style.dot}`}
                                                    />
                                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {step.nodeName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {step.nodeType} · {step.nodeId}
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${style.badge}`}>
                                                                {step.status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-700">{step.message}</div>
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            {new Date(step.executedAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}

                            {!instanceStepsLoading && instanceSteps && instanceSteps.length === 0 && (
                                <div className="text-sm text-gray-500">No steps found for this instance.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
