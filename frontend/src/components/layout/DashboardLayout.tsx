import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.ts';
import { Sidebar } from './Sidebar.tsx';
import { MobileMenu } from './MobileMenu.tsx';

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content area offset by sidebar on desktop */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-700 bg-slate-900 px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-1.5 text-slate-400 hover:text-white transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 items-center justify-end gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={() => void signOut()}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
