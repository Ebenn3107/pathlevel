import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AchievementNotification from '../features/achievements/components/AchievementNotification';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-surface text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AchievementNotification />
    </div>
  );
}
