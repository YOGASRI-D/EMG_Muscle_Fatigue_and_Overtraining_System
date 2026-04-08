import React, { useState } from 'react';
import './index.css';
import { useSocket } from './hooks/useSocket';
import Navbar from './components/Navbar';
import MonitorPage from './pages/MonitorPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [page, setPage] = useState('monitor');
  const { connected } = useSocket();

  return (
    <>
      <Navbar page={page} setPage={setPage} connected={connected} />
      <main>
        {page === 'monitor' ? <MonitorPage /> : <HistoryPage />}
      </main>
    </>
  );
}
