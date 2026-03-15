import Link from 'next/link';
import { Package, Users, Settings, LayoutDashboard } from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">SAABIZ</h2>
          <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-medium">Seller</span>
        </div>
        <nav className="p-4 flex-1 space-y-1">
          <Link href="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" /> Dashboard
          </Link>
          <Link href="/seller/products" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 text-white transition-colors">
            <Package className="w-5 h-5 text-blue-400" /> Products & Plans
          </Link>
          <Link href="/seller/subscribers" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <Users className="w-5 h-5 text-emerald-400" /> Subscribers
          </Link>
          <Link href="/seller/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <Settings className="w-5 h-5 text-slate-400" /> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 sm:p-12 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
