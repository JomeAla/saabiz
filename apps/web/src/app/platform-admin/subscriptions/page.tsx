'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Package, Calendar, ArrowUpRight, Check, X, AlertCircle, User, Zap } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Subscription {
  id: string;
  customerEmail: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'IN_GRACE_PERIOD';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  product: { id: string; name: string };
  plan: { id: string; name: string; price: number; interval: string };
  licenses: { id: string }[];
  _count: { transactions: number };
  gateway: string;
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

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CANCELED: 'bg-red-500/20 text-red-400 border-red-500/30',
  PAST_DUE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  TRIALING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_GRACE_PERIOD: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const data = await api.get<any[]>('/api/admin/subscriptions');
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUpgradeModal = async (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowUpgradeModal(true);
    setError('');
    setSuccess('');
    setSelectedPlanId('');
    setUpgradeReason('');

    // Fetch available plans for this product
    try {
      const data = await api.get<any>(`/api/products/public/${subscription.product.id}`);
      setAvailablePlans(data.plans.filter((p: any) => p.id !== subscription.plan.id));
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription || !selectedPlanId) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/api/admin/subscriptions/${selectedSubscription.id}/upgrade`, {
        newPlanId: selectedPlanId,
        reason: upgradeReason,
      });

      setSuccess('Subscription upgraded successfully');
      setTimeout(() => {
        setShowUpgradeModal(false);
        setSuccess('');
      }, 2000);
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (subscription: Subscription) => {
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User cancelled the prompt

    try {
      await api.post(`/api/admin/subscriptions/${subscription.id}/cancel`, {
        reason,
      });

      setSuccess('Subscription cancelled successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (subscription: Subscription) => {
    return new Date(subscription.currentPeriodEnd) < new Date();
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (sub: Subscription) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-medium">{sub.customerEmail}</p>
            <p className="text-xs text-gray-500">ID: {sub.id.substring(0, 8)}...</p>
          </div>
        </div>
      )
    },
    {
      key: 'product',
      header: 'Product & Plan',
      render: (sub: Subscription) => (
        <div>
          <p className="text-white font-medium">{sub.product.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{sub.plan.name}</span>
            <span className="text-xs text-gray-500">{formatCurrency(sub.plan.price)}/{sub.plan.interval.toLowerCase()}</span>
          </div>
        </div>
      )
    },
    {
      key: 'period',
      header: 'Period',
      render: (sub: Subscription) => (
        <div className="text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(sub.currentPeriodEnd)}
          </div>
          {isExpired(sub) && (
            <span className="text-xs text-red-400">Expired</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (sub: Subscription) => (
        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusColors[sub.status]}`}>
          {sub.status}
        </span>
      )
    },
    {
      key: 'gateway',
      header: 'Gateway',
      render: (sub: Subscription) => (
        <span className="text-sm text-gray-400 capitalize">{sub.gateway}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (sub: Subscription) => (
        <div className="flex items-center gap-2">
          {sub.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => openUpgradeModal(sub)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Upgrade
              </button>
              <button
                onClick={() => handleCancel(sub)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
  const expiredSubs = subscriptions.filter(s => s.status === 'CANCELED' || isExpired(s));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
        <p className="text-gray-500 mt-1">Manage customer subscriptions and perform manual upgrades</p>
      </motion.div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {success}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Subscriptions</p>
              <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-emerald-400">{activeSubs.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Canceled/Expired</p>
              <p className="text-2xl font-bold text-red-400">{expiredSubs.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(activeSubs.reduce((sum, s) => sum + s.plan.price, 0))}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={subscriptions}
          keyField="id"
          searchPlaceholder="Search subscriptions..."
          emptyMessage="No subscriptions found"
          loading={loading}
        />
      </motion.div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && selectedSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Upgrade Subscription</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedSubscription.customerEmail}</p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="mb-4 p-4 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium">{selectedSubscription.plan.name}</p>
                  <p className="text-emerald-400 font-semibold">{formatCurrency(selectedSubscription.plan.price)}/{selectedSubscription.plan.interval.toLowerCase()}</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {success}
                </div>
              )}

              <form onSubmit={handleUpgrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select New Plan *</label>
                  <select
                    required
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[#090910]">Choose a plan...</option>
                    {availablePlans.map((plan) => (
                      <option key={plan.id} value={plan.id} className="bg-[#090910]">
                        {plan.name} - {formatCurrency(plan.price)}/{plan.interval.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reason (for audit log)</label>
                  <textarea
                    value={upgradeReason}
                    onChange={(e) => setUpgradeReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="e.g., Customer requested upgrade, Special offer, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedPlanId}
                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        Upgrade Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
