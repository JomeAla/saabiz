'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { DollarSign, Clock, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  product: { name: string };
}

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

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function AffiliateCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.get<Commission[]>('/api/affiliates/commissions');
      setCommissions(data);
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 mr-1.5" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Check className="w-3 h-3 mr-1.5" />
            Approved
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Check className="w-3 h-3 mr-1.5" />
            Paid
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <X className="w-3 h-3 mr-1.5" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const totalPending = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalPaid = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalEarned = totalPending + totalPaid;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
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
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Commissions</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Track your commission history and earnings</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <div className="relative group h-full">
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px h-full">
              <div className="bg-[#090910] rounded-2xl p-6 h-full border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Earned</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalEarned)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="relative group h-full">
            <div className="absolute -inset-px bg-gradient-to-r from-amber-500/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px h-full">
              <div className="bg-[#090910] rounded-2xl p-6 h-full border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="relative group h-full">
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px h-full">
              <div className="bg-[#090910] rounded-2xl p-6 h-full border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid Out</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Commission History</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {commissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No commissions yet</h3>
                    <p className="text-gray-500">Start sharing your links to earn commissions</p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="overflow-x-auto"
                  >
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {commissions.map((commission) => (
                          <motion.tr
                            key={commission.id}
                            variants={item}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-4 text-sm text-white font-medium">{commission.product?.name || 'Unknown'}</td>
                            <td className="px-4 py-4 text-sm font-medium text-emerald-400">
                              {formatCurrency(commission.amount, commission.currency)}
                            </td>
                            <td className="px-4 py-4">
                              {getStatusBadge(commission.status)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(commission.createdAt).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
