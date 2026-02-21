'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Zap
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="flex items-center gap-3">
          <Zap size={32} style={{ color: '#00ff88' }} className="animate-pulse" />
          <span style={{ color: '#00ff88' }} className="text-xl font-bold">
            TinyFeedback
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#000000' }}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen z-30"
        style={{
          backgroundColor: '#0a0a0a',
          borderRight: '1px solid #222222',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 h-16"
          style={{ borderBottom: '1px solid #222222' }}
        >
          <Zap size={24} style={{ color: '#00ff88' }} />
          <span
            className="text-xl font-bold"
            style={{ color: '#00ff88' }}
          >
            TinyFeedback
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                      borderLeft: isActive ? '3px solid #00ff88' : '3px solid transparent',
                      color: isActive ? '#00ff88' : '#888888',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#888888';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section - Desktop Sidebar */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid #222222' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid #00ff88',
              }}
            >
              <span style={{ color: '#00ff88', fontWeight: 600 }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: '#ffffff' }}>
                {user?.email}
              </p>
              <p className="text-xs" style={{ color: '#888888' }}>
                Founder
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#ff4444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: '#0a0a0a',
          borderRight: '1px solid #222222',
        }}
      >
        {/* Mobile Logo Header */}
        <div
          className="flex items-center justify-between px-4 h-16"
          style={{ borderBottom: '1px solid #222222' }}
        >
          <div className="flex items-center gap-3">
            <Zap size={24} style={{ color: '#00ff88' }} />
            <span
              className="text-xl font-bold"
              style={{ color: '#00ff88' }}
            >
              TinyFeedback
            </span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2"
            style={{ color: '#888888' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                      borderLeft: isActive ? '3px solid #00ff88' : '3px solid transparent',
                      color: isActive ? '#00ff88' : '#888888',
                    }}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile User Section */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid #222222' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid #00ff88',
              }}
            >
              <span style={{ color: '#00ff88', fontWeight: 600 }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: '#ffffff' }}>
                {user?.email}
              </p>
              <p className="text-xs" style={{ color: '#888888' }}>
                Founder
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: '#ff4444',
              border: '1px solid #ff4444',
            }}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 h-16"
          style={{
            backgroundColor: '#0a0a0a',
            borderBottom: '1px solid #222222',
          }}
        >
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 transition-colors"
              style={{ color: '#888888' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#00ff88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888888';
              }}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={20} style={{ color: '#00ff88' }} />
              <span
                className="font-bold"
                style={{ color: '#00ff88' }}
              >
                TinyFeedback
              </span>
            </div>
          </div>

          {/* Desktop: Page Title */}
          <div className="hidden lg:block">
            <h1 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
              {navItems.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Profile Dropdown - Desktop */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 transition-colors"
              style={{
                backgroundColor: isProfileDropdownOpen ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                border: '1px solid #222222',
              }}
              onMouseEnter={(e) => {
                if (!isProfileDropdownOpen) {
                  e.currentTarget.style.borderColor = '#444444';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProfileDropdownOpen) {
                  e.currentTarget.style.borderColor = '#222222';
                }
              }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid #00ff88',
                }}
              >
                <span style={{ color: '#00ff88', fontSize: '0.875rem', fontWeight: 600 }}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm" style={{ color: '#ffffff' }}>
                {user?.email?.split('@')[0]}
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: '#888888',
                  transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 py-2 z-50"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #222222',
                }}
              >
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                  style={{ color: '#888888' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888888';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <Settings size={16} />
                  Configurações
                </Link>
                <div className="my-2" style={{ borderTop: '1px solid #222222' }} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors"
                  style={{ color: '#ff4444' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>

          {/* Mobile: Empty space for alignment */}
          <div className="lg:hidden" />
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
