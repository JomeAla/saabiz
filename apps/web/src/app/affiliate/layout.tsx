'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Link as LinkIcon, Percent, DollarSign, LayoutDashboard, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', href: '/affiliate/dashboard', icon: LayoutDashboard },
  { name: 'My Links', href: '/affiliate/links', icon: LinkIcon },
  { name: 'Commissions', href: '/affiliate/commissions', icon: Percent },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function AffiliateLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#090910]">
      <nav className="bg-[#090910]/95 backdrop-blur-xl border-b border-white/[0.05] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-10">
              <Link href="/affiliate/dashboard" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
                    <span className="font-bold text-xl text-emerald-400">S</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight">SAARBIZ</span>
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full -mt-1 uppercase tracking-[0.15em]">Affiliates</span>
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="flex items-center gap-1"
                >
                  {navItems.map((navItem) => {
                    const Icon = navItem.icon;
                    const isActive = pathname === navItem.href;
                    return (
                      <motion.div key={navItem.name} variants={item}>
                        <Link
                          href={navItem.href}
                          className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                          <span>{navItem.name}</span>
                          {isActive && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute inset-0 bg-emerald-500/10 rounded-xl -z-10"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-px h-6 bg-white/10 mr-3" />
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
