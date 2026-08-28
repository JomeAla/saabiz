'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Settings, Save, Loader2, Building2, CreditCard, AlertCircle, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface SellerSettings {
  businessName: string;
  payoutEmail: string;
  payoutGateway: string;
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

export default function SellerSettingsPage() {
  const [settings, setSettings] = useState<SellerSettings>({
    businessName: '',
    payoutEmail: '',
    payoutGateway: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get<SellerSettings>('/api/seller/settings');
      if (data.businessName || data.payoutEmail || data.payoutGateway) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.patch('/api/seller/settings', settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
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
          <p className="text-sm text-gray-500">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Profile & Settings</h1>
        <p className="text-sm text-gray-500">Manage your storefront profile and payout arrangements.</p>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-5">
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Business Profile</h2>
                <p className="text-xs text-gray-500">Your storefront identity</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 pt-0">
            <div className="glass-card-inner rounded-xl p-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settings.businessName || ''}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#090910]/50 border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Payout Configuration</h2>
                <p className="text-xs text-gray-500">Choose how you receive earnings</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 pt-0">
            <div className="glass-card-inner rounded-xl p-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Payout Email
                  </label>
                  <input
                    type="email"
                    value={settings.payoutEmail || ''}
                    onChange={(e) => setSettings({ ...settings, payoutEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-[#090910]/50 border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="payout@example.com"
                  />
                  <p className="text-xs text-gray-600">Email where you want to receive payouts</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'paystack', label: 'Paystack' },
                      { value: 'flutterwave', label: 'Flutterwave' },
                      { value: 'bank', label: 'Bank Transfer' },
                    ].map((gateway) => (
                      <button
                        key={gateway.value}
                        type="button"
                        onClick={() => setSettings({ ...settings, payoutGateway: gateway.value })}
                        className={`
                          relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                          ${settings.payoutGateway === gateway.value
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : 'bg-[#090910]/50 border-white/[0.06] text-gray-400 hover:border-white/[0.12]'
                          }
                          border
                        `}
                      >
                        {settings.payoutGateway === gateway.value && (
                          <motion.div 
                            layoutId="gateway"
                            className="absolute inset-0 border-2 border-emerald-500/50 rounded-xl"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {gateway.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">Select your preferred payment method</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <button
            type="submit"
            disabled={saving}
            className="w-full relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50">
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </div>
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
