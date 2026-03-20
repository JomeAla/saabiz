'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Link2, 
  Percent, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navLinks: NavLink[] = [
  { name: 'Dashboard', href: '/affiliate/dashboard', icon: LayoutDashboard },
  { name: 'My Links', href: '/affiliate/links', icon: Link2 },
  { name: 'Commissions', href: '/affiliate/commissions', icon: Percent },
  { name: 'Settings', href: '/affiliate/settings', icon: Settings },
];

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const linkVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
  },
  tap: { scale: 0.98 },
};

interface NavBarProps {
  showLogout?: boolean;
  onLogout?: () => void;
}

export default function NavBar({ showLogout = false, onLogout }: NavBarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/affiliate/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="glass rounded-full px-2 py-1.5 flex items-center gap-1 max-w-3xl w-full">
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-3 px-3 py-2"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-400/20 to-transparent blur-md -z-10" />
          </div>
          <span className="font-bold text-white text-sm hidden sm:inline">
            SAABIZ <span className="text-emerald-400">Affiliates</span>
          </span>
        </motion.div>

        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <motion.div
                key={link.name}
                variants={linkVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href={link.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                    ${active 
                      ? 'text-emerald-400 bg-emerald-500/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{link.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-2"
        >
          {showLogout && (
            <motion.button
              variants={linkVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-2 left-4 right-4 md:hidden"
          >
            <div className="glass rounded-2xl p-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200
                      ${active 
                        ? 'text-emerald-400 bg-emerald-500/10' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
