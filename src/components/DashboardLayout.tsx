import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-brand-light">
      <aside className="w-64 bg-brand-dark text-brand-light fixed lg:static h-full shadow-lg">
        {/* Sidebar content goes here */}
        <div className="p-4">
          <h2 className="text-xl font-semibold">Sidebar</h2>
          {/* Navigation items can be added here */}
        </div>
      </aside>
      <main className="flex-1 lg:pl-64 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 