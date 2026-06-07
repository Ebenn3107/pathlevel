import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HabitsPage from '../features/habits/pages/HabitsPage';
import TasksPage from '../features/tasks/pages/TasksPage';
import LearningPage from '../features/learning/pages/LearningPage';
import ResourcesPage from '../features/resources/pages/ResourcesPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
