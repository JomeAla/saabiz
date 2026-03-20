'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Package, DollarSign, MoreVertical } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

interface Seller {
  id: string;
  businessName: string | null;
  payoutEmail: string | null;
  payoutGateway: string | null;
  totalEarnings: number;
  pendingPayout: number;
  user: { email: string };
  _count: { products: number };
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

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/sellers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error('Failed to fetch sellers:', response.status);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setSellers(data);
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const columns = [
    {
      key: 'businessName',
      header: 'Seller',
      render: (seller: Seller) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-medium">{seller.businessName || 'Unnamed Seller'}</p>
            <p className="text-xs text-gray-500">ID: {seller.id.substring(0, 8)}...</p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (seller: Seller) => (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Mail className="w-4 h-4" />
          {seller.user.email}
        </div>
      )
    },
    {
      key: 'products',
      header: 'Products',
      render: (seller: Seller) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-white font-medium">{seller._count.products}</span>
        </div>
      )
    },
    {
      key: 'payoutGateway',
      header: 'Payout Method',
      render: (seller: Seller) => (
        <div>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 text-sm capitalize">
            {seller.payoutGateway || 'Not set'}
          </span>
          {seller.payoutEmail && (
            <p className="text-xs text-gray-500 mt-1">{seller.payoutEmail}</p>
          )}
        </div>
      )
    },
    {
      key: 'totalEarnings',
      header: 'Total Earnings',
      render: (seller: Seller) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-400 font-semibold">{formatCurrency(seller.totalEarnings)}</span>
        </div>
      )
    },
    {
      key: 'pendingPayout',
      header: 'Pending Payout',
      render: (seller: Seller) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-500" />
          <span className="text-amber-400 font-medium">{formatCurrency(seller.pendingPayout)}</span>
        </div>
      )
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
          <h1 className="text-2xl font-bold text-white">Seller Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all platform sellers</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-gray-400">Total:</span>
          <span className="text-white font-semibold">{sellers.length}</span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Sellers</p>
              <p className="text-2xl font-bold text-white">{sellers.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gradient-emerald">
                {formatCurrency(sellers.reduce((sum, s) => sum + s.totalEarnings, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payouts</p>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(sellers.reduce((sum, s) => sum + s.pendingPayout, 0))}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={sellers}
          keyField="id"
          searchPlaceholder="Search sellers..."
          emptyMessage="No sellers found"
          loading={loading}
        />
      </motion.div>
    </motion.div>
  );
}
