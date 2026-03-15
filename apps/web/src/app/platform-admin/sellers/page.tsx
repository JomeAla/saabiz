'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Package } from 'lucide-react';

interface Seller {
  id: string;
  businessName: string | null;
  payoutEmail: string | null;
  payoutGateway: string | null;
  totalEarnings: number;
  pendingPayout: number;
  user: { email: string };
  _count: { products: number };
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/sellers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSellers(data);
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
        <span className="text-gray-500">{sellers.length} sellers</span>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sellers.map((seller) => (
              <tr key={seller.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-900">{seller.businessName || 'Unnamed Seller'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="w-4 h-4 mr-2" />
                    {seller.user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Package className="w-4 h-4 mr-2" />
                    {seller._count.products}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                  {seller.payoutGateway || 'Not set'} {seller.payoutEmail && `(${seller.payoutEmail})`}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-green-600">{formatCurrency(seller.totalEarnings)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-yellow-600">{formatCurrency(seller.pendingPayout)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sellers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No sellers yet</div>
        )}
      </div>
    </div>
  );
}
