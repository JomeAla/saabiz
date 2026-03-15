import { LayoutDashboard } from 'lucide-react';

export default function SellerDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
           <LayoutDashboard className="w-8 h-8 text-indigo-500" /> Dashboard Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back. Here is a summary of your performance.</p>
      </div>

      <div className="py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Coming Soon</h3>
        <p className="text-slate-500 max-w-sm">Charts, revenue metrics, and analytics will appear here as your account grows.</p>
      </div>
    </div>
  );
}
