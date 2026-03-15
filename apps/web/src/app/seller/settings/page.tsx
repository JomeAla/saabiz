import { Settings } from 'lucide-react';

export default function SellerSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
           <Settings className="w-8 h-8 text-slate-400" /> Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your storefront profile, API keys, and bank arrangements.</p>
      </div>

      <div className="py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Coming Soon</h3>
        <p className="text-slate-500 max-w-sm">Payout configurations and profile modifications will be available soon.</p>
      </div>
    </div>
  );
}
