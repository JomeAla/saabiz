'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Check, X, Clock, TrendingUp, ArrowUpRight, Wallet } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

interface Payout {
  sellerId: string;
  businessName: string | null;
  email: string;
  payoutGateway: string | null;
  payoutEmail: string | null;
  totalEarnings: number;
  pendingPayout: number;
  availableForPayout: number;
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

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/payouts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error('Failed to fetch payouts:', response.status);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setPayouts(data);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (sellerId: string, action: 'approve' | 'process' | 'reject', amount: number) => {
    if (!confirm(`Are you sure you want to ${action} this payout?`)) return;

    setProcessing(sellerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/payouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ sellerId, action, amount }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Payout ${action}ed successfully` });
        fetchPayouts();
      } else {
        setMessage({ type: 'error', text: 'Failed to process payout' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process payout' });
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const totalAvailable = payouts.reduce((sum, p) => sum + p.availableForPayout, 0);
  const totalPending = payouts.reduce((sum, p) => sum + p.pendingPayout, 0);
  const totalEarnings = payouts.reduce((sum, p) => sum + p.totalEarnings, 0);

  const columns = [
    {
      key: 'seller',
      header: 'Seller',
      render: (payout: Payout) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-medium">{payout.businessName || 'Unnamed Seller'}</p>
            <p className="text-xs text-gray-500">{payout.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'payoutGateway',
      header: 'Method',
      render: (payout: Payout) => (
        <div>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 text-sm capitalize">
            {payout.payoutGateway || 'Not set'}
          </span>
          {payout.payoutEmail && (
            <p className="text-xs text-gray-500 mt-1">{payout.payoutEmail}</p>
          )}
        </div>
      )
    },
    {
      key: 'totalEarnings',
      header: 'Total Earnings',
      render: (payout: Payout) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-white font-semibold">{formatCurrency(payout.totalEarnings)}</span>
        </div>
      )
    },
    {
      key: 'pendingPayout',
      header: 'Pending',
      render: (payout: Payout) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-amber-400 font-medium">{formatCurrency(payout.pendingPayout)}</span>
        </div>
      )
    },
    {
      key: 'availableForPayout',
      header: 'Available',
      render: (payout: Payout) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-bold">{formatCurrency(payout.availableForPayout)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payout: Payout) => (
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePayout(payout.sellerId, 'approve', payout.availableForPayout)}
            disabled={processing === payout.sellerId || payout.availableForPayout <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Approve for payout"
          >
            {processing === payout.sellerId ? (
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePayout(payout.sellerId, 'process', payout.pendingPayout)}
            disabled={processing === payout.sellerId || payout.pendingPayout <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Process payout"
          >
            {processing === payout.sellerId ? (
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Process
              </>
            )}
          </motion.button>
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
          <h1 className="text-2xl font-bold text-white">Seller Payouts</h1>
          <p className="text-gray-500 mt-1">Manage and process seller payment requests</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="text-sm text-gray-400">Available:</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-bold">{formatCurrency(totalAvailable)}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available for Payout</p>
              <p className="text-2xl font-bold text-gradient-emerald">{formatCurrency(totalAvailable)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payouts</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={payouts}
          keyField="sellerId"
          searchPlaceholder="Search sellers..."
          emptyMessage="No payout data available"
          loading={loading}
        />
      </motion.div>
    </motion.div>
  );
}
