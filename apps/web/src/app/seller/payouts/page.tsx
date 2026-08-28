'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
  processedAt: string | null;
}

interface PayoutSummary {
  totalEarnings: number;
  pendingPayout: number;
  totalPaidOut: number;
  payouts: Payout[];
}

export default function SellerPayouts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';

      const [settingsRes, payoutsRes] = await Promise.all([
        fetch('/api/seller/settings', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/payouts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!settingsRes.ok || !payoutsRes.ok) {
        throw new Error('Failed to fetch payout data');
      }

      const settingsData = await settingsRes.json();
      const payoutsData = await payoutsRes.json();

      setSummary({
        totalEarnings: settingsData.totalEarnings || 0,
        pendingPayout: settingsData.pendingPayout || 0,
        totalPaidOut: (settingsData.totalEarnings || 0) - (settingsData.pendingPayout || 0),
        payouts: Array.isArray(payoutsData) ? payoutsData.filter((p: any) => p.reference) : [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
      COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
      PROCESSING: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
      PENDING: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Clock },
      FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
    };
    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
          </div>
          <p className="text-gray-500">Track your earnings and payout history</p>
        </div>
        <button
          onClick={fetchPayouts}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </motion.div>

      {error && (
        <motion.div variants={item} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
          <button onClick={fetchPayouts} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </motion.div>
      )}

      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl border border-emerald-500/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total Earnings</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  ₦{(summary?.totalEarnings || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl border border-amber-500/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-gray-400">Pending Payout</span>
                </div>
                <p className="text-3xl font-bold text-amber-400">
                  ₦{(summary?.pendingPayout || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl border border-blue-500/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total Paid Out</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  ₦{(summary?.totalPaidOut || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Payout History</h2>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-sm text-gray-500">{summary?.payouts?.length || 0} payouts</span>
                </div>

                {(!summary?.payouts || summary.payouts.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <DollarSign className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-gray-500">No payouts yet</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Payouts are processed automatically when you reach the minimum threshold
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Processed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {summary?.payouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm text-white">{payout.reference}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-emerald-400">₦{payout.amount.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(payout.status)}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {payout.processedAt 
                                ? new Date(payout.processedAt).toLocaleDateString()
                                : '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Payout Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-sm text-gray-400">Payout Method</span>
                    <span className="text-sm font-medium text-white">Bank Transfer</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-sm text-gray-400">Minimum Payout</span>
                    <span className="text-sm font-medium text-white">₦50.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-sm text-gray-400">Payout Schedule</span>
                    <span className="text-sm font-medium text-white">Monthly</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                  To update your payout settings, please go to{' '}
                  <a href="/seller/settings" className="text-emerald-400 hover:underline">
                    Seller Settings
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
