'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Package, DollarSign, Settings, LogOut, Shield, ChevronRight } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/platform-admin/dashboard', icon: LayoutDashboard },
  { name: 'Sellers', href: '/platform-admin/sellers', icon: Users },
  { name: 'Products', href: '/platform-admin/products', icon: Package },
  { name: 'Payouts', href: '/platform-admin/payouts', icon: DollarSign },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#090910] bg-grid-subtle">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-card border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                    <span className="font-bold text-xl text-gradient-emerald">S</span>
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">SAARBIZ</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Admin</span>
                </motion.div>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
                        {item.name}
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 rounded-xl bg-emerald-500/10 -z-10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/payments"
                className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </Link>

              <div className="w-px h-8 bg-white/10 mx-2" />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence mode="wait">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
