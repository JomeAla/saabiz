'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, DollarSign, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/platform-admin/dashboard', icon: LayoutDashboard },
  { name: 'Sellers', href: '/platform-admin/sellers', icon: Users },
  { name: 'Products', href: '/platform-admin/products', icon: Package },
  { name: 'Payouts', href: '/platform-admin/payouts', icon: DollarSign },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/platform-admin/dashboard" className="text-xl font-bold">
                  SAABIZ Admin
                </Link>
              </div>
              <div className="hidden ml-10 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-indigo-400 text-white'
                          : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/platform-admin/settings" className="text-gray-300 hover:text-white">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
