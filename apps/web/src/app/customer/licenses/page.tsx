'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Key, X, ArrowUpCircle, Check, AlertCircle, Download, Copy, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface License {
  id: string;
  key: string;
  active: boolean;
  expiresAt: string | null;
  product: { id: string; name: string };
  transaction: { plan: { name: string; price: number; interval: string } };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
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

export default function CustomerLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Record<string, Plan[]>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openUpgrade, setOpenUpgrade] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await api.get<any>('/api/subscriptions/my-subscriptions');
      setLicenses(data.licenses || []);

      const productIds = [...new Set((data.licenses || []).map((l: License) => l.product.id))] as string[];
      const plansData: Record<string, Plan[]> = {};
      for (const productId of productIds) {
        const plans = await api.get<Plan[]>(`/api/subscriptions/plans/${productId}`);
        plansData[productId] = plans;
      }
      setAvailablePlans(plansData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    setCanceling(subscriptionId);
    try {
      const data = await api.post<any>('/api/subscriptions/cancel', { subscriptionId });
      setMessage({ type: 'success', text: data.message });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCanceling(null);
    }
  };

  const handleUpgrade = async (subscriptionId: string, newPlanId: string) => {
    setUpgrading(subscriptionId);
    try {
      await api.post('/api/subscriptions/upgrade', { subscriptionId, newPlanId });
      setMessage({ type: 'success', text: 'Subscription upgraded successfully!' });
      setOpenUpgrade(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpgrading(null);
    }
  };

  const handleDownload = async (licenseId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/licenses/download/${licenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        setMessage({ type: 'error', text: data.error || 'Download not available' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to get download link' });
    }
  };

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
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
          <h1 className="text-3xl font-bold tracking-tight">My Licenses</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Manage your licenses and subscriptions</p>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="relative"
          >
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-transparent rounded-2xl opacity-0" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className={`rounded-xl p-4 flex items-center ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {message.type === 'success' ? <Check className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                {message.text}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={item}>
        {licenses.length === 0 ? (
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl p-12 text-center border border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Key className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No licenses yet</h3>
                <p className="text-gray-500">Purchase a product to get started</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {licenses.map((license, index) => {
              const plans = availablePlans[license.product.id] || [];
              const currentPrice = license.transaction?.plan?.price || 0;
              const higherPlans = plans.filter(p => p.price > currentPrice);

              return (
                <motion.div
                  key={license.id}
                  variants={item}
                  className="relative group"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-[#090910] rounded-2xl p-px">
                    <div className="bg-[#090910] rounded-2xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{license.product.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {license.transaction?.plan?.name} — ₦{license.transaction?.plan?.price}/{license.transaction?.plan?.interval?.toLowerCase()}
                            </p>
                          </div>
                          <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${
                            license.active 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {license.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="relative mb-6">
                          <div className="absolute -inset-px bg-white/5 rounded-xl" />
                          <div className="relative bg-[#090910] rounded-xl p-px">
                            <div className="bg-[#090910] rounded-xl p-4">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">License Key</label>
                              <div className="flex items-center gap-3 mt-2">
                                <code className="flex-1 font-mono text-lg text-white bg-white/5 px-4 py-2.5 rounded-lg border border-white/5">
                                  {license.key}
                                </code>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => copyToClipboard(license.key)}
                                  className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                >
                                  {copiedKey === license.key ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {license.expiresAt && (
                          <p className="text-sm text-gray-500 mb-6">
                            {license.active 
                              ? `Expires: ${new Date(license.expiresAt).toLocaleDateString()}`
                              : `Expired: ${new Date(license.expiresAt).toLocaleDateString()}`
                            }
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                          {higherPlans.length > 0 && license.active && (
                            <div className="relative">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setOpenUpgrade(openUpgrade === license.id ? null : license.id)}
                                disabled={upgrading === license.id}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl hover:from-emerald-500/30 hover:to-emerald-600/20 transition-all disabled:opacity-50"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                                {upgrading === license.id ? 'Upgrading...' : 'Upgrade'}
                                <ChevronDown className={`w-4 h-4 transition-transform ${openUpgrade === license.id ? 'rotate-180' : ''}`} />
                              </motion.button>
                              
                              <AnimatePresence>
                                {openUpgrade === license.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 mt-2 w-64 bg-[#090910] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10"
                                  >
                                    <div className="p-2">
                                      {higherPlans.map(plan => (
                                        <button
                                          key={plan.id}
                                          onClick={() => handleUpgrade(license.id, plan.id)}
                                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                          <div className="text-sm font-medium text-white">{plan.name}</div>
                                          <div className="text-xs text-gray-500">₦{plan.price}/{plan.interval.toLowerCase()}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {license.active && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleDownload(license.id)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCancel(license.id)}
                            disabled={canceling === license.id || !license.active}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                            {canceling === license.id ? 'Canceling...' : 'Cancel'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
