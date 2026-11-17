import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  Sprout,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  // Desktop slide/collapse state (saved in localStorage)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Mobile drawer slide state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/orders', label: 'Orders Management', icon: ShoppingBag, end: false },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Mobile Sticky Header */}
      <header className="md:hidden sticky top-0 z-40 h-16 border-b border-border bg-card/80 backdrop-blur px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Sprout className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight leading-none">Poongodi</h2>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              Farm Products Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Slidable / Collapsible Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-border bg-card flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out md:static ${
          // Mobile: slide in / out off-canvas
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${
          // Desktop: slide between expanded (w-64) and collapsed rail (w-20)
          collapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        <div>
          {/* Brand & Collapse Header */}
          <div
            className={`h-16 border-b border-border flex items-center transition-all duration-300 ${
              collapsed ? 'justify-center px-2' : 'justify-between px-5'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <Sprout className="h-5 w-5" />
              </div>
              {!collapsed && (
                <div className="truncate animate-in fade-in duration-200">
                  <h2 className="text-sm font-bold tracking-tight leading-none">Poongodi</h2>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    Farm Products
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Slide / Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="truncate animate-in fade-in duration-150">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border space-y-2">
          {/* User badge */}
          <div
            className={`flex items-center gap-2.5 p-1.5 rounded-lg ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </div>
              )}
              {!collapsed && (
                <div className="truncate animate-in fade-in duration-150">
                  <p className="text-xs font-semibold truncate leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* Theme toggle in collapsed state */}
          {collapsed && (
            <div className="hidden md:flex justify-center pt-1">
              <ThemeToggle />
            </div>
          )}

          {/* Sign Out Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full text-xs text-muted-foreground hover:text-destructive ${
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
