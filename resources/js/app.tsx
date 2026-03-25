import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import Shell from './components/layout/Shell';
import '../css/app.css';

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <AppProvider>
        <Shell />
      </AppProvider>
    </React.StrictMode>
  );
}
