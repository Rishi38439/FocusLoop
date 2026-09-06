'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CommandPalette } from './CommandPalette';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  History, 
  Settings, 
  Menu, 
  X,
  Flame,
  Clock,
  Search
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  sessionCode: string;
  activities: any[];
  onQuickAdd: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'log-activity', label: 'Log Activity', icon: PlusCircle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ 
  children, 
  currentView, 
  onViewChange, 
  sessionCode, 
  activities,
  onQuickAdd 
}: LayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate today's stats for header
  const todayStats = activities.filter(activity => {
    const activityDate = new Date(activity.timestamp).toDateString();
    const today = new Date().toDateString();
    return activityDate === today;
  });

  const todayDuration = todayStats.reduce((acc, activity) => acc + activity.duration, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/3 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative flex h-screen">
        {/* Sidebar */}
        <div className={cn(
          "transition-all duration-300 ease-in-out bg-black/40 backdrop-blur-xl border-r border-white/5",
          sidebarOpen ? "w-64" : "w-20"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className={cn(
                "flex items-center gap-3 transition-all duration-300",
                !sidebarOpen && "justify-center"
              )}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <h1 className="text-xl font-bold text-white">trakloop</h1>
                    <p className="text-xs text-white/50">Track Your Momentum</p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        "w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200",
                        currentView === item.id
                          ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Button>
                  );
                })}
              </div>
            </nav>

            {/* Session Info */}
            {sidebarOpen && (
              <div className="p-4 border-t border-white/5">
                <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Account</p>
                  {isAuthenticated ? (
                    <>
                      <p className="truncate text-sm text-white/80">{user?.email ?? sessionCode}</p>
                      <button onClick={() => void logout()} className="mt-2 text-xs text-blue-300 hover:text-blue-200">Sign out</button>
                    </>
                  ) : (
                    <button
                      onClick={() => onViewChange('settings')}
                      className="text-sm text-white/80 text-left w-full"
                    >
                      Login / Create Session
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center justify-between px-8 py-4">
              {/* Welcome Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Welcome back, Athlete
                </h2>
                <p className="text-white/60">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Today's Summary & Quick Actions */}
              <div className="flex items-center gap-6">
                {/* Today's Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-xs text-white/50">Today</p>
                      <p className="text-sm font-semibold text-white">
                        {Math.floor(todayDuration / 60)}h {todayDuration % 60}m
                      </p>
                    </div>
                  </div>
                </div>

                {/* Command Palette Button */}
                <Button
                  onClick={() => setShowCommandPalette(true)}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl mr-3"
                  title="Command Palette (⌘K)"
                >
                  <Search className="w-4 h-4" />
                </Button>

                {/* Quick Add Button */}
                <Button
                  onClick={onQuickAdd}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onViewChange={onViewChange}
        onQuickAdd={onQuickAdd}
      />
    </div>
  );
}
