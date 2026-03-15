'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users, Package, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalSellerEarnings: number;
  netPlatformRevenue: number;
  totalTransactions: number;
  activeSubscriptions: number;
  totalSellers: number;
  totalProducts: number;
  revenueByGateway: { gateway: string; revenue: number }[];
  recentTransactions: any[];
  topSellingProducts: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total GMV</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Platform Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.netPlatformRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalSellers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Gateway</h2>
          <div className="space-y-3">
            {stats?.revenueByGateway.map((gw) => (
              <div key={gw.gateway} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium capitalize">{gw.gateway}</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(gw.revenue)}</span>
              </div>
            ))}
            {(!stats?.revenueByGateway || stats.revenueByGateway.length === 0) && (
              <p className="text-gray-500">No revenue data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {stats?.topSellingProducts.map((product: any) => (
              <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.seller?.businessName || 'Unknown seller'}</p>
                </div>
                <span className="text-lg font-bold text-indigo-600">{product._count?.transactions || 0} sales</span>
              </div>
            ))}
            {(!stats?.topSellingProducts || stats.topSellingProducts.length === 0) && (
              <p className="text-gray-500">No products yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats?.recentTransactions?.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{tx.reference?.substring(0, 12)}...</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tx.product?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{tx.gateway}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
            <p className="text-center py-8 text-gray-500">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
