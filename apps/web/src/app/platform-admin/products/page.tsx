'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Freeze, Unfreeze, Check, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  isFrozen: boolean;
  freezeReason: string | null;
  seller: { businessName: string | null; user: { email: string } };
  plans: { name: string; price: number; interval: string }[];
  _count: { licenses: number; transactions: number };
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <span className="text-gray-500">{products.length} products</span>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className={`bg-white shadow rounded-lg p-6 ${product.isFrozen ? 'border-l-4 border-red-500' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  {product.isFrozen && (
                    <span className="flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      <Freeze className="w-3 h-3 mr-1" />
                      Frozen
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{product.description || 'No description'}</p>
                
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span>Seller: {product.seller.businessName || product.seller.user.email}</span>
                  <span>Licenses: {product._count.licenses}</span>
                  <span>Transactions: {product._count.transactions}</span>
                </div>

                {product.isFrozen && product.freezeReason && (
                  <div className="mt-3 flex items-start text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 mr-1 mt-0.5" />
                    {product.freezeReason}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {product.isFrozen ? (
                  <button
                    onClick={() => handleFreeze(product.id, false)}
                    disabled={processing === product.id}
                    className="flex items-center px-4 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
                  >
                    {processing === product.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <>
                        <Unfreeze className="w-4 h-4 mr-2" />
                        Unfreeze
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleFreeze(product.id, true)}
                    disabled={processing === product.id}
                    className="flex items-center px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {processing === product.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <>
                        <Freeze className="w-4 h-4 mr-2" />
                        Freeze
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pricing Plans</h4>
              <div className="flex flex-wrap gap-2">
                {product.plans.map((plan) => (
                  <span key={plan.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {plan.name} - {formatCurrency(plan.price)}/{plan.interval.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            No products yet
          </div>
        )}
      </div>
    </div>
  );
}
