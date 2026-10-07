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
    <div className="flex min-h-dvh flex-col">
      <AdminNavbar onMenuClick={() => setSidebarOpen((value) => !value)} />
      <div className="flex flex-1">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 px-6 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-8 lg:px-15 lg:pt-14 lg:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
