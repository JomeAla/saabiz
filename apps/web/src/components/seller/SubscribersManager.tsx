'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader2, Key, CheckCircle2, XCircle, Search, Calendar, Ticket, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subscriber {
  id: string;
  key: string;
  active: boolean;
  expiresAt: string | null;
  product: { name: string };
  transaction: { reference: string, amount: number, gateway: string, plan: { name: string, interval: string } } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/licenses/subscribers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSubscribers(data);
    } catch (err: any) {
      setError('Failed to fetch subscribers. Make sure you are logged in as a Seller.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s => 
    s.key.toLowerCase().includes(search.toLowerCase()) || 
    s.product.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.transaction && s.transaction.reference.toLowerCase().includes(search.toLowerCase()))
  );

  const calculateStatus = (sub: Subscriber) => {
    if (!sub.active) return { 
      label: 'Revoked', 
      class: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: XCircle,
      dot: 'bg-red-400'
    };
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      return { 
        label: 'Expired', 
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: Calendar,
        dot: 'bg-amber-400'
      };
    }
    return { 
      label: 'Active', 
      class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      dot: 'bg-emerald-400'
    };
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
          <p className="text-sm text-gray-500">Loading subscribers...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">View license keys and subscriber activity.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by key, product..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full sm:w-72 bg-[#111119] border border-white/[0.06] rounded-xl text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111119] border border-white/[0.06]">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-400">{subscribers.length} Total</span>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          variants={itemVariants}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      {subscribers.length === 0 && !error ? (
        <motion.div 
          variants={itemVariants}
          className="py-24 flex flex-col items-center justify-center text-center glass-card border border-white/[0.06] rounded-2xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#111119] border border-white/[0.06] flex items-center justify-center mb-5">
            <Key className="w-10 h-10 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No subscribers yet</h3>
          <p className="text-gray-500 max-w-sm">
            When users purchase your software, their license keys will appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#090910]/50 border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">License Key</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Product & Plan</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] hidden lg:table-cell">Transaction</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Expiration</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSubscribers.map((sub, i) => {
                  const status = calculateStatus(sub);
                  return (
                    <motion.tr 
                      key={sub.id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                            <Key className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span className="text-sm font-mono font-semibold text-white">
                            {sub.key.substring(0, 20)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-sm">{sub.product.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{sub.transaction?.plan?.name || 'Manual'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {sub.transaction ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">${sub.transaction.amount?.toFixed(2)}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                                {sub.transaction.gateway}
                              </span>
                              <span className="text-xs text-gray-600">
                                {sub.transaction.reference.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600 italic">Manual Activation</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-400">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Lifetime'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.class}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
                
                {filteredSubscribers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Search className="w-8 h-8 text-gray-700 mb-3" />
                        <p className="text-gray-500">No subscribers found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
