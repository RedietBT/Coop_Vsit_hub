import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppRoutes from '@/app/routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4500}
        toastOptions={{
          className: 'font-sans rounded-2xl shadow-xl border text-sm',
          style: {
            padding: '14px 18px',
          },
        }}
      />

      {/* Main Application Router */}
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
