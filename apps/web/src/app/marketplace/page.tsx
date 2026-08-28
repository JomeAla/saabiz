'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Loader2, ArrowRight, Search, Star, ShoppingCart, Eye, Grid3X3 } from 'lucide-react';
import { api } from '@/lib/api';

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
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
];

const SkeletonCard = () => (
  <div className="glass-card rounded-2xl overflow-hidden">
    <div className="h-48 skeleton" />
    <div className="p-6">
      <div className="h-6 w-3/4 skeleton rounded mb-3" />
      <div className="h-4 w-1/2 skeleton rounded mb-4" />
      <div className="h-4 w-full skeleton rounded mb-4" />
      <div className="h-12 skeleton rounded" />
    </div>
  </div>
);

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get<Product[]>('/api/products/public')
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLowestPrice = (product: Product) => {
    if (!product.plans?.length) return null;
    return product.plans.reduce((min, p) => p.price < min.price ? p : min, product.plans[0]);
  };

  const getProductImage = (index: number) => {
    return productImages[index % productImages.length];
  };

  const bentoGrid = [
    { col: 'col-span-1 md:col-span-2', height: 'h-80' },
    { col: 'col-span-1', height: 'h-80' },
    { col: 'col-span-1', height: 'h-64' },
    { col: 'col-span-1', height: 'h-64' },
    { col: 'col-span-1 md:col-span-2', height: 'h-72' },
  ];

  return (
    <div className="min-h-screen bg-[#090910] text-white">
      <header className="border-b border-white/[0.06] bg-[#090910]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="font-bold text-xl">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight">SAABIZ</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
              <Link href="/checkout" className="text-sm text-slate-400 hover:text-white transition-colors">Checkout</Link>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/[0.05] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Discover <span className="text-gradient-emerald">Premium Software</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Browse our curated collection of powerful tools to supercharge your workflow
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="max-w-2xl mx-auto relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-2xl blur-xl opacity-50" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d0d14] border border-white/[0.08] rounded-2xl py-4 pl-14 pr-5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <div className="w-24 h-24 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Check back soon for new software products! Try adjusting your search.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => {
                const lowestPrice = getLowestPrice(product);
                const isLarge = index % 5 === 0 || index % 5 === 4;
                
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      delay: index * 0.08,
                      type: 'spring',
                      stiffness: 100,
                      damping: 20
                    }}
                    className={`group ${isLarge ? 'md:col-span-2' : ''}`}
                  >
                    <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col border-white/[0.06] hover:border-emerald-500/20 transition-colors">
                      <div className={`relative ${isLarge ? 'h-56' : 'h-48'} overflow-hidden`}>
                        <motion.div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${getProductImage(index)})` }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090910] via-transparent to-transparent" />
                        
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button className="p-2.5 bg-[#090910]/60 backdrop-blur rounded-xl border border-white/10 hover:border-emerald-500/30 transition-colors">
                            <Eye className="w-4 h-4 text-slate-300" />
                          </button>
                          <button className="p-2.5 bg-[#090910]/60 backdrop-blur rounded-xl border border-white/10 hover:border-emerald-500/30 transition-colors">
                            <ShoppingCart className="w-4 h-4 text-slate-300" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold group-hover:text-emerald-400 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-slate-500">by {product.seller?.businessName || 'Unknown'}</p>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">4.8</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-400 mt-3 mb-4 line-clamp-2 flex-1 text-sm leading-relaxed">
                          {product.description || 'No description available.'}
                        </p>

                        {product.plans && product.plans.length > 0 && (
                          <div className="pt-4 border-t border-white/[0.06]">
                            <p className="text-xs text-slate-500 mb-1">Starting at</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-white">₦{lowestPrice?.price.toFixed(2)}</span>
                              <span className="text-slate-500">/{lowestPrice?.interval.toLowerCase()}</span>
                            </div>
                          </div>
                        )}

                        <Link
                          href={`/checkout?product=${product.id}`}
                          className="mt-4 w-full flex items-center justify-center gap-2 btn-primary group-hover:shadow-lg group-hover:shadow-emerald-500/10"
                        >
                          View Plans <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}