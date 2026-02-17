import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
// import { WorkflowDesigner } from './pages/WorkflowDesigner';
import { WorkflowDesigner } from './pages/NewWorkFlowEngine';
import { ExecutionVisualizer } from './pages/ExecutionVisualizer';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="designer" element={<WorkflowDesigner />} />
          <Route path="executions/:id" element={<ExecutionVisualizer />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
