'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { DollarSign, Users, Link as LinkIcon, Copy, Check, Percent, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface AffiliateData {
  affiliateCode: string;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: number;
  totalCommission: number;
  pendingPayout: number;
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
    transition: { staggerChildren: 0.08 },
  },
};

export default function AffiliateDashboard() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await api.get<AffiliateData>('/api/affiliates/profile');
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!data?.affiliateCode) return;
    const link = `${window.location.origin}/?ref=${data.affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
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
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Track your earnings and referrals</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={item} className="md:col-span-2">
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-3 bg-emerald-500/20 rounded-2xl blur-xl" />
                      <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                      <p className="text-5xl font-bold tracking-tight text-emerald-400">{formatCurrency(data?.totalEarnings || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Pending Payout</p>
                      <p className="text-2xl font-bold text-amber-400">{formatCurrency(data?.pendingPayout || 0)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-500">Commission Rate</p>
                      <p className="text-2xl font-bold">{((data?.commissionRate || 0) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="relative group h-full">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#090910] rounded-2xl p-px h-full">
              <div className="bg-[#090910] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Referrals</p>
                    <p className="text-3xl font-bold">{data?.totalReferrals || 0}</p>
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
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Commissions</p>
                    <p className="text-3xl font-bold">{formatCurrency(data?.totalCommission || 0)}</p>
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
            <div className="bg-[#090910] rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-semibold">Your Referral Code</h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                  <div className="absolute -inset-px bg-emerald-500/10 rounded-xl" />
                  <div className="relative bg-[#090910] rounded-xl p-px">
                    <div className="bg-[#090910] rounded-xl px-5 py-4 border border-white/5">
                      <code className="font-mono text-xl text-white tracking-wider">{data?.affiliateCode}</code>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyReferralLink}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-xl transition-all ${
                    copied 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-emerald-600/20'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </motion.button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Share this link to earn commissions on every sale made through your referral.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-lg font-semibold">How It Works</h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  { step: 1, title: 'Share Your Link', desc: 'Share your unique referral link with your audience' },
                  { step: 2, title: 'They Purchase', desc: 'When someone makes a purchase, you earn a commission' },
                  { step: 3, title: 'Get Paid', desc: 'Receive payouts directly to your account' },
                ].map((item) => (
                  <motion.div
                    key={item.step}
                    className="relative group/step"
                  >
                    <div className="absolute -inset-2 bg-emerald-500/5 rounded-2xl opacity-0 group-hover/step:opacity-100 transition-opacity" />
                    <div className="relative text-center p-6">
                      <div className="relative inline-block mb-4">
                        <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur-lg" />
                        <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-emerald-400">{item.step}</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
