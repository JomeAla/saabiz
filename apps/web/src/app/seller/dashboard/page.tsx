'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, Users, CreditCard, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  sellerId: string;
  businessName: string | null;
  totalEarnings: number;
  pendingPayout: number;
  totalProducts: number;
  activeProducts: number;
  totalTransactions: number;
  successfulTransactions: number;
  activeSubscriptions: number;
  recentTransactions: any[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function SellerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/seller/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-[#111119] border border-white/[0.06] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
        >
          {error}
        </motion.div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Earnings',
      value: formatCurrency(data?.totalEarnings || 0),
      icon: DollarSign,
      trend: '+12.5%',
      positive: true,
      large: true
    },
    {
      label: 'Pending Payout',
      value: formatCurrency(data?.pendingPayout || 0),
      icon: TrendingUp,
      trend: 'Processing',
      positive: null,
      large: false
    },
    {
      label: 'Active Subscriptions',
      value: data?.activeSubscriptions || 0,
      icon: Users,
      trend: '+8',
      positive: true,
      large: false
    },
    {
      label: 'Products',
      value: `${data?.activeProducts || 0} / ${data?.totalProducts || 0}`,
      icon: Package,
      trend: 'Active',
      positive: null,
      large: true
    },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">
          Welcome back{data?.businessName ? `, ${data.businessName}` : ''}
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-12 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            className={`
              glass-card rounded-2xl p-6 relative overflow-hidden
              ${stat.large ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-3'}
            `}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-emerald-500/[0.02] pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <stat.icon className="w-5 h-5 text-emerald-400" />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.positive === true ? 'text-emerald-400' : 
                    stat.positive === false ? 'text-red-400' : 
                    'text-gray-500'
                  }`}>
                    {stat.positive === true ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : stat.positive === false ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : null}
                    {stat.trend}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
              <p className={`font-bold text-white ${stat.large ? 'text-3xl' : 'text-2xl'}`}>
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Latest payment activity across your products</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-400">{data?.totalTransactions || 0} Total</span>
          </div>
        </div>
        
        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#090910]/50">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Reference</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Product</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Plan</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Earnings</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.recentTransactions.map((tx: any, i: number) => (
                  <motion.tr 
                    key={tx.id} 
                    className="hover:bg-white/[0.02] transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-400">
                        {tx.reference?.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-white">
                        {tx.product?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{tx.plan?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{formatCurrency(tx.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(tx.sellerEarnings)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        tx.status === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tx.status === 'success' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                            Success
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#111119] border border-white/[0.06] flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No transactions yet</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              When customers purchase your products, their transactions will appear here.
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
