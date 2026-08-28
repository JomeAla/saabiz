'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Package, CreditCard, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface DashboardStats {
  totalRevenue: number;
  totalSellerEarnings: number;
  netPlatformRevenue: number;
  totalTransactions: number;
  activeSubscriptions: number;
  totalSellers: number;
  totalProducts: number;
  revenueByGateway: { gateway: string; revenue: number }[];
  recentTransactions: any[];
  topSellingProducts: any[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not logged in. Please login first.');
        setLoading(false);
        return;
      }
      const data = await api.get<DashboardStats>('/api/admin/dashboard');
      setStats(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API server.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount ?? 0);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium mb-2">Dashboard Error</p>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => fetchStats()}
            className="mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total GMV',
      value: formatCurrency(stats?.totalRevenue),
      icon: DollarSign,
      change: '+12.5%',
      positive: true,
      color: 'emerald'
    },
    {
      label: 'Net Platform Revenue',
      value: formatCurrency(stats?.netPlatformRevenue),
      icon: TrendingUp,
      change: '+8.2%',
      positive: true,
      color: 'emerald'
    },
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: Activity,
      change: '+24',
      positive: true,
      color: 'slate'
    },
    {
      label: 'Total Sellers',
      value: stats?.totalSellers || 0,
      icon: Users,
      change: '+6',
      positive: true,
      color: 'slate'
    }
  ];

  const transactionColumns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (tx: any) => (
        <span className="font-mono text-xs text-gray-400">{tx.reference?.substring(0, 12)}...</span>
      )
    },
    {
      key: 'product',
      header: 'Product',
      render: (tx: any) => <span className="text-white font-medium">{tx.product?.name}</span>
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: any) => (
        <span className="text-emerald-400 font-semibold">{formatCurrency(tx.amount)}</span>
      )
    },
    {
      key: 'gateway',
      header: 'Gateway',
      render: (tx: any) => (
        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 text-xs capitalize">
          {tx.gateway}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx: any) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
          tx.status === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {tx.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (tx: any) => (
        <span className="text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
      )
    }
  ];

  const productColumns = [
    {
      key: 'name',
      header: 'Product',
      render: (product: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-medium">{product.name}</p>
            <p className="text-xs text-gray-500">{product.seller?.businessName || 'Unknown seller'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'sales',
      header: 'Sales',
      render: (product: any) => (
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold">{product._count?.transactions || 0}</span>
          <span className="text-gray-500 text-xs">orders</span>
        </div>
      )
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: () => <span className="text-white font-medium">—</span>
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor your platform performance and metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="group relative glass-card rounded-2xl p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stat.color === 'emerald' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${stat.color === 'emerald' ? 'text-emerald-400' : 'text-gray-400'}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.positive ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Revenue by Gateway</h2>
                  <p className="text-xs text-gray-500">Payment method distribution</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {(stats?.revenueByGateway || []).map((gw: any, index: number) => (
              <motion.div
                key={gw.gateway}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-medium text-gray-300 capitalize">{gw.gateway}</span>
                </div>
                <span className="text-xl font-bold text-gradient-emerald">{formatCurrency(gw.revenue)}</span>
              </motion.div>
            ))}
            {(!stats?.revenueByGateway || stats.revenueByGateway.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No revenue data yet</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Top Selling Products</h2>
                  <p className="text-xs text-gray-500">Best performing products</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {(stats?.topSellingProducts || []).map((product: any, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.seller?.businessName || 'Unknown seller'}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-400">{product._count?.transactions || 0} sales</span>
              </motion.div>
            ))}
            {(!stats?.topSellingProducts || stats.topSellingProducts.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <DataTable
          title="Recent Transactions"
          columns={transactionColumns}
          data={stats?.recentTransactions || []}
          keyField="id"
          searchPlaceholder="Search transactions..."
          emptyMessage="No transactions yet"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          title="Top Products"
          columns={productColumns}
          data={(stats as any)?.topSellingProducts || []}
          keyField="id"
          searchable={false}
          emptyMessage="No products yet"
        />
      </motion.div>
    </motion.div>
  );
}
