import { DeployedBoardProvider } from './contexts';
import { BoardSessionProvider } from './contexts/BoardSessionContext';
import { AppShell } from './components/shell/AppShell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BoardPage } from './pages/BoardPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { logger } from './logger';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function ShellRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <DeployedBoardProvider logger={logger}>
      <BoardSessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/*" element={<ShellRoutes />} />
          </Routes>
        </BrowserRouter>
      </BoardSessionProvider>
    </DeployedBoardProvider>
  );
}
