'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, ShieldCheck, Eye, EyeOff, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';

interface PaymentConfig {
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  paystackActive?: boolean;
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
  flutterwaveEncryptionKey?: string;
  flutterwaveActive?: boolean;
  webhookSecret?: string;
}

export default function PaymentConfigForm() {
  const [config, setConfig] = useState<PaymentConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await api.get<PaymentConfig>('/api/admin/payments/config');
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.post('/api/admin/payments/config', config);
      setMessage({ type: 'success', text: 'Payment configuration saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save payment configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGateway = (gateway: 'paystack' | 'flutterwave') => {
    setConfig(prev => ({
      ...prev,
      [`${gateway}Active`]: !prev[`${gateway}Active`]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-transparent blur-xl opacity-50" />
          <div className="relative glass-card rounded-2xl p-8 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Paystack</h3>
                  <p className="text-sm text-gray-500">Local Nigeria / Africa Payments</p>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleGateway('paystack')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  config.paystackActive
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                <motion.div
                  animate={{ rotate: config.paystackActive ? 0 : -90 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  {config.paystackActive ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </motion.div>
                <span className="text-sm font-medium">
                  {config.paystackActive ? 'Active' : 'Disabled'}
                </span>
              </motion.button>
            </div>

            <motion.div
              animate={{ opacity: config.paystackActive ? 1 : 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Public Key</label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.paystackPublicKey || ''}
                    onChange={(e) => setConfig({ ...config, paystackPublicKey: e.target.value })}
                    disabled={!config.paystackActive}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="pk_test_..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecrets.paystackSecret ? 'text' : 'password'}
                    value={config.paystackSecretKey || ''}
                    onChange={(e) => setConfig({ ...config, paystackSecretKey: e.target.value })}
                    disabled={!config.paystackActive}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="sk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('paystackSecret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showSecrets.paystackSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500/10 to-transparent blur-xl opacity-50" />
          <div className="relative glass-card rounded-2xl p-8 border border-orange-500/10">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Flutterwave</h3>
                  <p className="text-sm text-gray-500">Africa + PayPal Routing</p>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleGateway('flutterwave')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  config.flutterwaveActive
                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                <motion.div
                  animate={{ rotate: config.flutterwaveActive ? 0 : -90 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  {config.flutterwaveActive ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </motion.div>
                <span className="text-sm font-medium">
                  {config.flutterwaveActive ? 'Active' : 'Disabled'}
                </span>
              </motion.button>
            </div>

            <motion.div
              animate={{ opacity: config.flutterwaveActive ? 1 : 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Public Key</label>
                <input
                  type="text"
                  value={config.flutterwavePublicKey || ''}
                  onChange={(e) => setConfig({ ...config, flutterwavePublicKey: e.target.value })}
                  disabled={!config.flutterwaveActive}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
                  placeholder="FLWPUBK_TEST-..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecrets.flutterwaveSecret ? 'text' : 'password'}
                    value={config.flutterwaveSecretKey || ''}
                    onChange={(e) => setConfig({ ...config, flutterwaveSecretKey: e.target.value })}
                    disabled={!config.flutterwaveActive}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
                    placeholder="FLWSECK_TEST-..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('flutterwaveSecret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showSecrets.flutterwaveSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-400">Encryption Key</label>
                <div className="relative">
                  <input
                    type={showSecrets.flutterwaveEncryption ? 'text' : 'password'}
                    value={config.flutterwaveEncryptionKey || ''}
                    onChange={(e) => setConfig({ ...config, flutterwaveEncryptionKey: e.target.value })}
                    disabled={!config.flutterwaveActive}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
                    placeholder="Encryption key"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('flutterwaveEncryption')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showSecrets.flutterwaveEncryption ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={saving}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full relative group"
      >
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
        <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : 'Save Configuration'}
        </div>
      </motion.button>
    </form>
  );
}
