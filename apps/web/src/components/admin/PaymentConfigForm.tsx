'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, CreditCard, ShieldCheck, Globe } from 'lucide-react';

interface PaymentConfig {
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
  flutterwaveEncryptionKey?: string;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  webhookSecret?: string;
}

export default function PaymentConfigForm() {
  const [config, setConfig] = useState<PaymentConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/payments/config', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
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
      const response = await fetch('/api/payments/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save payment configuration.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        Payment Gateway Configuration
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Paystack Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-teal-600">
            <ShieldCheck className="w-5 h-5" />
            Paystack (Local Nigeria/Africa)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
              <input
                type="text"
                value={config.paystackPublicKey || ''}
                onChange={(e) => setConfig({ ...config, paystackPublicKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input
                type="password"
                value={config.paystackSecretKey || ''}
                onChange={(e) => setConfig({ ...config, paystackSecretKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="sk_test_..."
              />
            </div>
          </div>
        </section>

        {/* Flutterwave Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-600">
            <ShieldCheck className="w-5 h-5" />
            Flutterwave (Africa + PayPal Routing)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
              <input
                type="text"
                value={config.flutterwavePublicKey || ''}
                onChange={(e) => setConfig({ ...config, flutterwavePublicKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="FLWPUBK_TEST-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input
                type="password"
                value={config.flutterwaveSecretKey || ''}
                onChange={(e) => setConfig({ ...config, flutterwaveSecretKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="FLWSECK_TEST-..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Key</label>
              <input
                type="password"
                value={config.flutterwaveEncryptionKey || ''}
                onChange={(e) => setConfig({ ...config, flutterwaveEncryptionKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Stripe Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-600">
            <Globe className="w-5 h-5" />
            Stripe (Global Fallback)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
              <input
                type="text"
                value={config.stripePublicKey || ''}
                onChange={(e) => setConfig({ ...config, stripePublicKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input
                type="password"
                value={config.stripeSecretKey || ''}
                onChange={(e) => setConfig({ ...config, stripeSecretKey: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="sk_test_..."
              />
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:bg-blue-400"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Configuration
        </button>
      </form>
    </div>
  );
}
