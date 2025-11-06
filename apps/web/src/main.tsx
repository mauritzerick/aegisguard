import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SettingsSecurity } from './pages/SettingsSecurity';
import { Users } from './pages/Users';
import { ApiKeys } from './pages/ApiKeys';
import { Events } from './pages/Events';
import { AuditLogs } from './pages/AuditLogs';
import { Docs } from './pages/Docs';
import { Readme } from './pages/Readme';
import { CodebaseExplanation } from './pages/CodebaseExplanation';
import { LessonsLearned } from './pages/LessonsLearned';
import { DeveloperJournal } from './pages/DeveloperJournal';
// Observability Pages
import { Logs } from './pages/Logs';
import { Metrics } from './pages/Metrics';
import { Traces } from './pages/Traces';
import { RUM } from './pages/RUM';
import { Monitors } from './pages/Monitors';
import { SLOs } from './pages/SLOs';
import { Usage } from './pages/Usage';
// Demo Pages
import { DemoHub } from './pages/DemoHub';
import { LiveTail } from './pages/LiveTail';
import { WebhookPlayground } from './pages/WebhookPlayground';
import { SyntheticChecks } from './pages/SyntheticChecks';
import { AuthDebug } from './components/AuthDebug';
import { ToastProvider } from './lib/useToast';
import './styles/global.css';

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  // Demo Routes
  { path: '/demo', element: <DemoHub /> },
  { path: '/tail', element: <LiveTail /> },
  { path: '/live-tail', element: <LiveTail /> },
  { path: '/webhook', element: <WebhookPlayground /> },
  { path: '/webhook-playground', element: <WebhookPlayground /> },
  { path: '/checks', element: <SyntheticChecks /> },
  { path: '/synthetic-checks', element: <SyntheticChecks /> },
  // Observability Routes
  { path: '/logs', element: <Logs /> },
  { path: '/metrics', element: <Metrics /> },
  { path: '/traces', element: <Traces /> },
  { path: '/traces/:traceId', element: <Traces /> },
  { path: '/rum', element: <RUM /> },
  { path: '/monitors', element: <Monitors /> },
  { path: '/slo', element: <SLOs /> },
  { path: '/usage', element: <Usage /> },
  // Admin Routes
  { path: '/settings/security', element: <SettingsSecurity /> },
  { path: '/users', element: <Users /> },
  { path: '/apikeys', element: <ApiKeys /> },
  { path: '/events', element: <Events /> },
  { path: '/audit-logs', element: <AuditLogs /> },
  { path: '/docs', element: <Docs /> },
  { path: '/readme', element: <Readme /> },
  { path: '/codebase', element: <CodebaseExplanation /> },
  { path: '/codebase-explanation', element: <CodebaseExplanation /> },
  { path: '/lessons', element: <LessonsLearned /> },
  { path: '/developer-journal', element: <DeveloperJournal /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
        <AuthDebug />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

