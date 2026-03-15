'use client';

import React, { useState, useEffect } from 'react';
import { PackageOpen, Plus, Tag, Loader2, Save } from 'lucide-react';
import axios from 'axios';

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

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  // Plan states
  const [addingPlanTo, setAddingPlanTo] = useState<string | null>(null);
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
      const res = await axios.get('/api/products', { headers: getHeaders() });
      setProducts(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
         setError('You must be logged in as a Seller. Please add a valid JWT token to localStorage "token" for testing.');
      } else {
         setError('Failed to fetch products. ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/products', {
        name: newProductName,
        description: newProductDesc
      }, { headers: getHeaders() });
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
      await axios.post(`/api/plans`, {
        productId,
        name: newPlanName,
        price: parseFloat(newPlanPrice),
        interval: newPlanInterval
      }, { headers: getHeaders() });
      setAddingPlanTo(null);
      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanInterval('MONTHLY');
      fetchProducts();
    } catch (err) {
      alert('Failed to create plan');
    }
  };

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Products & Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage what you sell and how you price it.</p>
        </div>
        <button
          onClick={() => setCreatingProduct(!creatingProduct)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Create Product
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {creatingProduct && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-indigo-500" /> New Software Product
          </h3>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
              <input 
                type="text" 
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g. Acme CRM Pro"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea 
                value={newProductDesc}
                onChange={e => setNewProductDesc(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Describe your product's core value proposition..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreatingProduct(false)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" /> Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                <p className="text-sm text-slate-500 max-w-sm line-clamp-2">{product.description || 'No description provided.'}</p>
                <div className="pt-2 text-xs font-mono text-slate-400">ID: {product.id}</div>
              </div>
            </div>

            <div className="p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-500" /> Pricing Plans
                </h4>
                <button 
                  onClick={() => setAddingPlanTo(addingPlanTo === product.id ? null : product.id)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Plan
                </button>
              </div>

              {addingPlanTo === product.id && (
                <form onSubmit={(e) => handleCreatePlan(e, product.id)} className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Name</label>
                      <input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} required placeholder="e.g. Starter" className="w-full text-sm p-2 rounded-lg border border-slate-300" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Price</label>
                      <input type="number" step="0.01" value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} required placeholder="0.00" className="w-full text-sm p-2 rounded-lg border border-slate-300" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Interval</label>
                      <select value={newPlanInterval} onChange={e => setNewPlanInterval(e.target.value)} className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white">
                        <option value="ONETIME">Lifetime (One-Time)</option>
                        <option value="MONTHLY">Monthly Subscription</option>
                        <option value="ANNUAL">Annual Subscription</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                     <button type="button" onClick={() => setAddingPlanTo(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                     <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Save Plan</button>
                  </div>
                </form>
              )}

              {product.plans && product.plans.length > 0 ? (
                <div className="space-y-3">
                  {product.plans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
                      <div>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                           {plan.name}
                           <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 tracking-wider">
                             {plan.interval}
                           </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {plan.id}</div>
                      </div>
                      <div className="font-black text-slate-900 tabular-nums bg-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                        {plan.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  No pricing plans defined yet.
                </div>
              )}
            </div>
          </div>
        ))}

        {products.length === 0 && !loading && !error && (
           <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
             <PackageOpen className="w-12 h-12 text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-800 mb-1">Your warehouse is empty</h3>
             <p className="text-slate-500 mb-6 max-w-sm">Start packaging your software by defining your first product and its pricing plans.</p>
             <button
                onClick={() => setCreatingProduct(true)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add your first product
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
