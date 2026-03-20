'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, PauseCircle, PlayCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

interface Product {
  id: string;
  name: string;
  description: string | null;
  isFrozen: boolean;
  freezeReason: string | null;
  seller: { businessName: string | null; user: { email: string } };
  plans: { id: string; name: string; price: number; interval: string }[];
  _count: { licenses: number; transactions: number };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error('Failed to fetch products:', response.status);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (productId: string, freeze: boolean) => {
    const reason = freeze ? prompt('Enter reason for freezing:') : undefined;
    if (freeze && !reason) return;

    setProcessing(productId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/products/freeze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId, freeze, reason }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Product ${freeze ? 'frozen' : 'unfrozen'} successfully` });
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: 'Failed to update product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update product' });
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            product.isFrozen 
              ? 'bg-red-500/10 border border-red-500/20' 
              : 'bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20'
          }`}>
            <Package className={`w-5 h-5 ${product.isFrozen ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">{product.name}</p>
              {product.isFrozen && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <XCircle className="w-3 h-3" />
                  Frozen
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 max-w-[200px] truncate">{product.description || 'No description'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (product: Product) => (
        <div>
          <p className="text-white text-sm">{product.seller.businessName || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{product.seller.user.email}</p>
        </div>
      )
    },
    {
      key: 'stats',
      header: 'Stats',
      render: (product: Product) => (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Sales:</span>
            <span className="text-emerald-400 font-medium">{product._count.transactions}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Licenses:</span>
            <span className="text-white font-medium">{product._count.licenses}</span>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price Range',
      render: (product: Product) => {
        const prices = product.plans.map(p => p.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return (
          <span className="text-white font-medium">
            {min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          {product.isFrozen ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFreeze(product.id, false)}
              disabled={processing === product.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {processing === product.id ? (
                <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Unfreeze
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFreeze(product.id, true)}
              disabled={processing === product.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {processing === product.id ? (
                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <>
                  <PauseCircle className="w-4 h-4" />
                  Freeze
                </>
              )}
            </motion.button>
          )}
        </div>
      )
    }
  ];

  const activeProducts = products.filter(p => !p.isFrozen).length;
  const frozenProducts = products.filter(p => p.isFrozen).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Management</h1>
          <p className="text-gray-500 mt-1">Monitor and control all platform products</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-gray-400">Total:</span>
          <span className="text-white font-semibold">{products.length}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Products</p>
              <p className="text-2xl font-bold text-emerald-400">{activeProducts}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Frozen Products</p>
              <p className="text-2xl font-bold text-red-400">{frozenProducts}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-white">
                {products.reduce((sum, p) => sum + p._count.transactions, 0)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={products}
          keyField="id"
          searchPlaceholder="Search products..."
          emptyMessage="No products found"
          loading={loading}
        />
      </motion.div>
    </motion.div>
  );
}
