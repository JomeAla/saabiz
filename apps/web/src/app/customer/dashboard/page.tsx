'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Clock, AlertTriangle, TrendingUp, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  product: { name: string };
  plan: { name: string; price: number; interval: string };
}

interface License {
  id: string;
  key: string;
  active: boolean;
  expiresAt: string | null;
  product: { name: string };
  transaction: { plan: { name: string; price: number; interval: string } };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/subscriptions/my-subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to load subscriptions');
        return;
      }

      setSubscriptions(data.subscriptions || []);
      setLicenses(data.licenses || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const activeLicenses = licenses.filter(l => l.active);

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-96"
      >
        <div className="relative">
          <div className="absolute -inset-4 bg-red-500/10 rounded-3xl blur-xl" />
          <div className="relative bg-[#090910] border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchSubscriptions}
              className="inline-flex items-center px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </motion.button>
          </div>
        </div>
      </motion.div>
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Manage your subscriptions and licenses</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={item} className="md:col-span-2">
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
                      <p className="text-4xl font-bold tracking-tight">{activeSubscriptions.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Key className="w-7 h-7 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Active Licenses</p>
                      <p className="text-4xl font-bold tracking-tight">{activeLicenses.length}</p>
                    </div>
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
              <div className="bg-[#090910] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiring Soon</p>
                    <p className="text-2xl font-bold">
                      {licenses.filter(l => l.expiresAt && new Date(l.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
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
              <div className="bg-[#090910] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold">{subscriptions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <div className="relative group h-full">
            <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px h-full">
              <div className="bg-[#090910] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Your Subscriptions</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {subscriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500">No active subscriptions</p>
                    <p className="text-sm text-gray-600 mt-1">Visit the marketplace to get started</p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {subscriptions.map((sub) => (
                      <motion.div
                        key={sub.id}
                        variants={item}
                        className="group relative"
                      >
                        <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-[#090910] rounded-xl p-px">
                          <div className="bg-[#090910] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-white">{sub.product.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{sub.plan.name} — ${sub.plan.price}/{sub.plan.interval.toLowerCase()}</p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                sub.status === 'ACTIVE' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-white/5 text-gray-400 border border-white/10'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            {sub.cancelAtPeriodEnd && (
                              <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Cancels at period end</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="relative group h-full">
            <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px h-full">
              <div className="bg-[#090910] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Your License Keys</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {licenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Key className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500">No license keys yet</p>
                    <p className="text-sm text-gray-600 mt-1">Purchase a product to get started</p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {licenses.map((lic) => (
                      <motion.div
                        key={lic.id}
                        variants={item}
                        className="group relative"
                      >
                        <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-[#090910] rounded-xl p-px">
                          <div className="bg-[#090910] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white truncate">{lic.product.name}</h3>
                                <div className="mt-2 flex items-center gap-2">
                                  <code className="flex-1 bg-white/5 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-300 border border-white/5 truncate">
                                    {lic.key}
                                  </code>
                                </div>
                              </div>
                              <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full shrink-0 ${
                                lic.active 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {lic.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {lic.expiresAt && (
                              <p className="text-sm text-gray-500 mt-3">
                                {lic.active ? 'Expires' : 'Expired'}: {new Date(lic.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
