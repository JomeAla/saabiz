'use client';

import { useEffect, useState } from 'react';
import { Link as LinkIcon, Plus, Copy, ExternalLink, MousePointer } from 'lucide-react';

interface AffiliateLink {
  id: string;
  code: string;
  clicks: number;
  conversions: number;
  isActive: boolean;
  product: { id: string; name: string };
}

export default function AffiliateLinks() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [linksRes, productsRes] = await Promise.all([
        fetch('/api/affiliates/links', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      setLinks(await linksRes.json());
      setProducts(await productsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (productId: string) => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/affiliates/links', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create link:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link);
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Affiliate Links</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Create New Link</h2>
          <div className="flex flex-wrap gap-2">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => createLink(product.id)}
                disabled={creating || links.some(l => l.product.id === product.id)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {product.name}
              </button>
            ))}
          </div>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No affiliate links yet. Create one above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map(link => (
              <div key={link.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{link.product.name}</h3>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-2">{link.code}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MousePointer className="w-4 h-4 mr-1" />
                      {link.clicks} clicks
                    </div>
                    <div className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {link.conversions} conversions
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => copyLink(link.code)}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
