'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Link as LinkIcon, Percent, DollarSign, LayoutDashboard } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/affiliate/dashboard', icon: LayoutDashboard },
  { name: 'My Links', href: '/affiliate/links', icon: LinkIcon },
  { name: 'Commissions', href: '/affiliate/commissions', icon: Percent },
];

export default function AffiliateLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/affiliate/dashboard" className="text-xl font-bold">
                  SAABIZ Affiliates
                </Link>
              </div>
              <div className="hidden ml-10 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-white text-white'
                          : 'border-transparent text-indigo-200 hover:border-indigo-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
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
