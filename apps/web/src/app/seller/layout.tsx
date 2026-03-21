'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Users, Settings, LayoutDashboard, LogOut, CreditCard, Hexagon, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/seller/products', icon: Package, label: 'Products & Plans' },
  { href: '/seller/subscribers', icon: Users, label: 'Subscribers' },
  { href: '/seller/payouts', icon: DollarSign, label: 'Payouts' },
  { href: '/seller/settings', icon: Settings, label: 'Settings' },
];

const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

const navItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  })
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-[#090910]">
      <motion.aside 
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        className="w-64 bg-[#0d0d18]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] via-transparent to-transparent pointer-events-none" />
        
        <div className="h-20 flex items-center px-6 border-b border-white/[0.06] relative">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                <Hexagon className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
              </div>
              <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">SAARBIZ</span>
              <span className="block text-[10px] text-emerald-500/60 font-medium tracking-[0.2em] uppercase -mt-0.5">Seller</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 p-4 relative">
          <p className="px-4 text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-4">Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <motion.div key={item.href} custom={i} variants={navItemVariants}>
                  <Link 
                    href={item.href} 
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                      ${isActive 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                      }
                      group
                    `}
                    style={{
                      boxShadow: isActive ? 'inset 3px 0 0 #10b981' : 'none'
                    }}
                  >
                    <item.icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'
                    }`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/[0.06] relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <Link 
            href="/checkout" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all duration-300 group"
          >
            <CreditCard className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors duration-300" />
            <span className="text-sm font-medium">Go to Checkout</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 group mt-1"
          >
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors duration-300" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto w-full bg-grid-subtle">
        <div className="p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] via-transparent to-transparent pointer-events-none" />
          {children}
        </div>
      </main>
    </div>
  );
}
