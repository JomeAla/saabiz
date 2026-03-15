'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState('');
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeConfig, setActiveConfig] = useState({
    paystackActive: false,
    flutterwaveActive: false,
    stripeActive: false,
  });

  useEffect(() => {
    fetch('/api/checkout/config')
      .then(res => res.json())
      .then(data => {
        setActiveConfig(data);
        if (data.paystackActive) setGateway('paystack');
        else if (data.flutterwaveActive) setGateway('flutterwave');
        else if (data.stripeActive) setGateway('stripe');
        setConfigLoading(false);
      })
      .catch(err => {
        console.error('Failed to load gateway config:', err);
        setConfigLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentUrl(null);
    setError(null);

    try {
      const response = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, amount: parseFloat(amount), gateway }),
      });

      const data = await response.json();

      if (response.ok) {
        if (gateway === 'paystack') {
          setPaymentUrl(data.data.authorization_url);
        } else if (gateway === 'flutterwave') {
          setPaymentUrl(data.data.link);
        } else if (gateway === 'stripe') {
          setPaymentUrl(data.url);
        }
      } else {
        setError(data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentUrl) {
    window.location.href = paymentUrl;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-lg font-medium">Redirecting to payment gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <CreditCard className="w-6 h-6" />
          Secure Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
            <div className="mt-2 flex space-x-4">
              {configLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading gateways...
                </div>
              ) : (
                <>
                  {!activeConfig.paystackActive && !activeConfig.flutterwaveActive && !activeConfig.stripeActive && (
                    <div className="text-red-500 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4" /> No payment gateways are currently enabled by the admin.
                    </div>
                  )}

                  {activeConfig.paystackActive && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gateway"
                        value="paystack"
                        checked={gateway === 'paystack'}
                        onChange={() => setGateway('paystack')}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 font-medium">Paystack</span>
                    </label>
                  )}
                  {activeConfig.flutterwaveActive && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gateway"
                        value="flutterwave"
                        checked={gateway === 'flutterwave'}
                        onChange={() => setGateway('flutterwave')}
                        className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-gray-700 font-medium">Flutterwave</span>
                    </label>
                  )}
                  {activeConfig.stripeActive && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gateway"
                        value="stripe"
                        checked={gateway === 'stripe'}
                        onChange={() => setGateway('stripe')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-gray-700 font-medium">Stripe</span>
                    </label>
                  )}
                </>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:bg-blue-400"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
