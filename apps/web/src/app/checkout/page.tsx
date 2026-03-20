'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle, Package, Check, ChevronRight, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  seller: { businessName: string | null };
  plans: Plan[];
}

const productImages = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=300&fit=crop',
];

const steps = [
  { num: 1, label: 'Product' },
  { num: 2, label: 'Plan' },
  { num: 3, label: 'Payment' },
];

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-1 md:gap-2">
    {steps.map((s, i) => (
      <React.Fragment key={s.num}>
        <motion.div 
          initial={false}
          animate={{
            backgroundColor: currentStep >= s.num ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: currentStep >= s.num ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
          }}
          className="flex items-center gap-2"
        >
          <motion.div 
            initial={false}
            animate={{
              scale: currentStep >= s.num ? 1 : 1
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              currentStep >= s.num 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white/5 text-slate-500'
            }`}
          >
            {currentStep > s.num ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="w-5 h-5" />
              </motion.div>
            ) : s.num}
          </motion.div>
          <span className={`hidden md:inline text-sm font-medium ${currentStep >= s.num ? 'text-emerald-400' : 'text-slate-600'}`}>
            {s.label}
          </span>
        </motion.div>
        {i < 2 && (
          <motion.div 
            initial={false}
            animate={{
              backgroundColor: currentStep > s.num ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
            }}
            className="w-8 h-0.5 rounded-full"
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [gateway, setGateway] = useState('');
  
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeConfig, setActiveConfig] = useState({
    paystackActive: false,
    flutterwaveActive: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, configRes] = await Promise.all([
        fetch('http://localhost:3001/api/products/public'),
        fetch('http://localhost:3001/api/checkout/config'),
      ]);
      
      const productsData = await productsRes.json();
      const configData = await configRes.json();
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setActiveConfig(configData);
      
      if (configData.paystackActive) setGateway('paystack');
      else if (configData.flutterwaveActive) setGateway('flutterwave');
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedPlan(null);
    setStep(2);
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPlan) return;
    
    setSubmitting(true);
    setPaymentUrl(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          productId: selectedProduct.id, 
          planId: selectedPlan.id,
          gateway 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (gateway === 'paystack') {
          setPaymentUrl(data.data.authorization_url);
        } else if (gateway === 'flutterwave') {
          setPaymentUrl(data.data.link);
        }
      } else {
        setError(data.message || data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (paymentUrl) {
    window.location.href = paymentUrl;
    return (
      <div className="min-h-screen bg-[#090910] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-lg font-medium text-white">Redirecting to payment gateway...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090910] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-slate-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const getProductImage = (index: number) => {
    return productImages[index % productImages.length];
  };

  return (
    <div className="min-h-screen bg-[#090910] py-12 px-6">
      <header className="max-w-5xl mx-auto mb-12">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight group-hover:text-emerald-400 transition-colors">SAABIZ</span>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Checkout</h1>
          <p className="text-slate-400">Complete your purchase securely</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <StepIndicator currentStep={step} />
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {products.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-2xl">
                  <div className="w-16 h-16 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500">No products available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <motion.button
                      key={product.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleProductSelect(product)}
                      className="glass-card rounded-2xl overflow-hidden text-left group hover:border-emerald-500/30 transition-all"
                    >
                      <div className="h-40 overflow-hidden relative">
                        <motion.div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${getProductImage(index)})` }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090910] to-transparent" />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description || 'No description'}</p>
                        <p className="text-xs text-slate-600 mt-3">by {product.seller?.businessName || 'Unknown'}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && selectedProduct && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <motion.button 
                whileHover={{ x: -4 }}
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to products
              </motion.button>
              
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h2>
                <p className="text-slate-400 mb-8">{selectedProduct.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedProduct.plans?.map((plan, index) => (
                    <motion.button
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePlanSelect(plan)}
                      className="p-6 border border-white/[0.08] rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                    >
                      <div className="font-semibold text-white group-hover:text-emerald-400">{plan.name}</div>
                      <div className="text-3xl font-bold text-white mt-3">
                        ${plan.price.toFixed(2)}
                        <span className="text-sm font-normal text-slate-500">/{plan.interval.toLowerCase()}</span>
                      </div>
                    </motion.button>
                  ))}
                  {(!selectedProduct.plans || selectedProduct.plans.length === 0) && (
                    <p className="col-span-full text-center text-slate-500 py-8">No plans available</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && selectedProduct && selectedPlan && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <motion.button 
                whileHover={{ x: -4 }}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to plans
              </motion.button>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Complete Your Purchase</h2>
                  
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{selectedProduct.name}</p>
                        <p className="text-sm text-slate-500">{selectedPlan.name}</p>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        ${selectedPlan.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                      <label className="absolute left-4 top-3 text-sm text-slate-500 transition-all pointer-events-none">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-[#0d0d14] border border-white/[0.08] rounded-xl py-3 px-4 pt-6 text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Payment Method</label>
                      <div className="space-y-3">
                        {!activeConfig.paystackActive && !activeConfig.flutterwaveActive ? (
                          <div className="text-red-400 flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4" /> No payment gateways enabled
                          </div>
                        ) : (
                          <>
                            {activeConfig.paystackActive && (
                              <motion.label 
                                whileHover={{ scale: 1.01 }}
                                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                                  gateway === 'paystack' 
                                    ? 'border-emerald-500 bg-emerald-500/10' 
                                    : 'border-white/[0.08] hover:border-white/[0.15]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="gateway"
                                  value="paystack"
                                  checked={gateway === 'paystack'}
                                  onChange={() => setGateway('paystack')}
                                  className="h-4 w-4 text-emerald-500"
                                />
                                <span className="ml-3 font-medium text-white">Paystack</span>
                              </motion.label>
                            )}
                            {activeConfig.flutterwaveActive && (
                              <motion.label 
                                whileHover={{ scale: 1.01 }}
                                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                                  gateway === 'flutterwave' 
                                    ? 'border-emerald-500 bg-emerald-500/10' 
                                    : 'border-white/[0.08] hover:border-white/[0.15]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="gateway"
                                  value="flutterwave"
                                  checked={gateway === 'flutterwave'}
                                  onChange={() => setGateway('flutterwave')}
                                  className="h-4 w-4 text-emerald-500"
                                />
                                <span className="ml-3 font-medium text-white">Flutterwave</span>
                              </motion.label>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !gateway}
                      className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-4 h-4" /> Pay ${selectedPlan.price.toFixed(2)}
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="glass-card rounded-2xl p-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>{selectedProduct.name} - {selectedPlan.name}</span>
                      <span className="text-white">${selectedPlan.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="border-t border-white/[0.06] pt-3 mt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-white">${selectedPlan.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/[0.06]">
                    <p className="text-xs text-slate-500">
                      By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}