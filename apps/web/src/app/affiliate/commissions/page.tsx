'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Clock, Check, X } from 'lucide-react';

interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  product: { name: string };
}

export default function AffiliateCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/affiliates/commissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommissions(await response.json());
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'PAID':
        return (
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const totalPending = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalPaid = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid + totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid Out</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Commission History</h1>

        {commissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No commissions yet. Start sharing your links!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commissions.map(commission => (
                  <tr key={commission.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{commission.product?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(commission.amount, commission.currency)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(commission.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
