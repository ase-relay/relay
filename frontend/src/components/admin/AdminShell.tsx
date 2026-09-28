'use client';

import { useState } from 'react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AdminNavbar onMenuClick={() => setSidebarOpen((value) => !value)} />
      <div className="flex min-h-0 flex-1">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 sm:px-8 lg:px-15 lg:py-14">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
