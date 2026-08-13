import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '../components/auth/ProtectedRoute';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HabitsPage from '../features/habits/pages/HabitsPage';
import TasksPage from '../features/tasks/pages/TasksPage';
import LearningPage from '../features/learning/pages/LearningPage';
import GoalDetailPage from '../features/learning/pages/GoalDetailPage';
import UnitDetailPage from '../features/learning/pages/UnitDetailPage';
import LibraryPage from '../features/resources/pages/LibraryPage';
import SearchPage from '../features/search/pages/SearchPage';
import AchievementsPage from '../features/achievements/pages/AchievementsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/learning/goals/:goalId" element={<GoalDetailPage />} />
        <Route path="/learning/units/:unitId" element={<UnitDetailPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/resources" element={<LibraryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
