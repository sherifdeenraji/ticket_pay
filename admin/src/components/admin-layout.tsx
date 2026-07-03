'use client';

import Sidebar from './sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:ml-0">
        {children}
      </div>
    </div>
  );
}
