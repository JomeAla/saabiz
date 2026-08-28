'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { User, Link2, Percent, Save, Check, Loader2, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

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

interface AffiliateProfile {
  id: string;
  affiliateCode: string;
  commissionRate: number;
  totalEarnings: number;
  pendingPayout: number;
  totalReferrals: number;
}

export default function AffiliateSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get<AffiliateProfile>('/api/affiliates/profile');
      setProfile(data);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      setReferralLink(`${origin}/checkout?affiliate=${data.affiliateCode}`);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-96 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
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
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Settings</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Manage your affiliate profile and payout settings</p>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl flex items-center ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            <Check className="w-5 h-5 mr-3" />
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Your Affiliate Code</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Your Affiliate Code</p>
                        <p className="text-2xl font-bold font-mono text-emerald-400">
                          {profile?.affiliateCode || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(profile?.affiliateCode || '')}
                        className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Your Referral Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-white border border-white/5 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(referralLink)}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <a
                        href={referralLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Share this link to earn commissions on sales
                    </p>
                  </div>
                </div>
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
                  <h2 className="text-lg font-semibold">Affiliate Statistics</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-500">Commission Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {((profile?.commissionRate || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-500">Total Referrals</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {profile?.totalReferrals || 0}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Total Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                      ₦{(profile?.totalEarnings || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Pending Payout</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      ₦{(profile?.pendingPayout || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
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
                  <h2 className="text-lg font-semibold">How Affiliate Marketing Works</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-400">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Share Your Link</p>
                      <p className="text-sm text-gray-500">Share your unique referral link with your audience</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-400">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">They Purchase</p>
                      <p className="text-sm text-gray-500">When someone clicks your link and makes a purchase</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-400">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">You Earn Commission</p>
                      <p className="text-sm text-gray-500">Get {(profile?.commissionRate || 0.1) * 100}% of every sale automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
