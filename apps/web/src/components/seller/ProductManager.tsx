'use client';

import React, { useState, useEffect } from 'react';
import { PackageOpen, Plus, Tag, Loader2, Save, ChevronDown, ChevronUp, Sparkles, Box } from 'lucide-react';
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
  description: string;
  plans: Plan[];
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

const expandVariants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' },
  visible: { 
    opacity: 1, 
    height: 'auto',
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [addingPlanTo, setAddingPlanTo] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanInterval, setNewPlanInterval] = useState('MONTHLY');

  useEffect(() => {
    fetchProducts();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token') || '';
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', { headers: getHeaders() });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Failed to fetch products. Please make sure you are logged in as a Seller.');
        setProducts([]);
        return;
      }
      
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Failed to fetch products. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ name: newProductName, description: newProductDesc })
      });
      setCreatingProduct(false);
      setNewProductName('');
      setNewProductDesc('');
      fetchProducts();
    } catch (err) {
      alert('Failed to create product');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    try {
      await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ productId, name: newPlanName, price: parseFloat(newPlanPrice), interval: newPlanInterval })
      });
      setAddingPlanTo(null);
      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanInterval('MONTHLY');
      fetchProducts();
    } catch (err) {
      alert('Failed to create plan');
    }
  };

  const toggleProduct = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
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
          <p className="text-sm text-gray-500">Loading products...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Products & Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your software products and pricing tiers.</p>
        </div>
        <button
          onClick={() => setCreatingProduct(!creatingProduct)}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all">
            <Plus className="w-4 h-4" />
            Create Product
          </div>
        </button>
      </motion.div>

      {error && (
        <motion.div 
          variants={itemVariants}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {creatingProduct && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Box className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">New Software Product</h3>
                  <p className="text-xs text-gray-500">Define your product details</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-5">
              <div className="glass-card-inner rounded-xl p-5 space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Product Name
                  </label>
                  <input 
                    type="text" 
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#090910]/50 border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="e.g. Acme CRM Pro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea 
                    value={newProductDesc}
                    onChange={e => setNewProductDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#090910]/50 border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all resize-none"
                    placeholder="Describe your product's core value proposition..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setCreatingProduct(false)} 
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="relative group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition-opacity" />
                  <div className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all">
                    <Save className="w-4 h-4" />
                    Save Product
                  </div>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {products.length === 0 && !loading && !error && (
        <motion.div 
          variants={itemVariants}
          className="py-24 flex flex-col items-center justify-center text-center glass-card border border-white/[0.06] rounded-2xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#111119] border border-white/[0.06] flex items-center justify-center mb-5">
            <PackageOpen className="w-10 h-10 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your warehouse is empty</h3>
          <p className="text-gray-500 mb-8 max-w-sm">
            Start packaging your software by defining your first product and its pricing plans.
          </p>
          <button
            onClick={() => setCreatingProduct(true)}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all">
              <Plus className="w-4 h-4" />
              Add your first product
            </div>
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {products.map((product, productIndex) => (
          <motion.div 
            key={product.id} 
            variants={itemVariants}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div 
              className="p-5 border-b border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent cursor-pointer hover:bg-white/[0.03] transition-colors"
              onClick={() => toggleProduct(product.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{product.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded">
                      ID: {product.id.substring(0, 8)}...
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {product.plans?.length || 0} Plans
                    </span>
                  </div>
                </div>
                <div className={`ml-4 p-2 rounded-lg bg-white/5 transition-transform duration-300 ${expandedProducts.has(product.id) ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedProducts.has(product.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing Plans</h4>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingPlanTo(addingPlanTo === product.id ? null : product.id);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Plan
                      </button>
                    </div>

                    <AnimatePresence>
                      {addingPlanTo === product.id && (
                        <motion.form 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onSubmit={(e) => handleCreatePlan(e, product.id)}
                          className="glass-card-inner rounded-xl p-4 space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plan Name</label>
                              <input 
                                type="text" 
                                value={newPlanName} 
                                onChange={e => setNewPlanName(e.target.value)} 
                                required 
                                placeholder="Starter" 
                                className="w-full text-sm px-3 py-2 bg-[#090910]/50 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price (₦)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                value={newPlanPrice} 
                                onChange={e => setNewPlanPrice(e.target.value)} 
                                required 
                                placeholder="0.00" 
                                className="w-full text-sm px-3 py-2 bg-[#090910]/50 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors" 
                              />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Billing Interval</label>
                              <select 
                                value={newPlanInterval} 
                                onChange={e => setNewPlanInterval(e.target.value)} 
                                className="w-full text-sm px-3 py-2 bg-[#090910]/50 border border-white/[0.06] rounded-lg text-white outline-none focus:border-emerald-500/50 transition-colors"
                              >
                                <option value="ONETIME">Lifetime (One-Time)</option>
                                <option value="MONTHLY">Monthly Subscription</option>
                                <option value="ANNUAL">Annual Subscription</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button 
                              type="button" 
                              onClick={() => setAddingPlanTo(null)} 
                              className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                            >
                              Save Plan
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {product.plans && product.plans.length > 0 ? (
                      <div className="space-y-2">
                        {product.plans.map(plan => (
                          <div 
                            key={plan.id} 
                            className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-sm">{plan.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {plan.interval}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-gray-600 mt-0.5">{plan.id.substring(0, 12)}...</div>
                            </div>
                            <div className="font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                              ₦{plan.price.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center border-2 border-dashed border-white/[0.06] rounded-xl">
                        <p className="text-sm text-gray-600">No pricing plans defined yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
