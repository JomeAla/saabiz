'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Check, X, Clock } from 'lucide-react';

interface Payout {
  sellerId: string;
  businessName: string | null;
  email: string;
  payoutGateway: string | null;
  payoutEmail: string | null;
  totalEarnings: number;
  pendingPayout: number;
  availableForPayout: number;
}

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/payouts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPayouts(data);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (sellerId: string, action: 'approve' | 'process' | 'reject', amount: number) => {
    if (!confirm(`Are you sure you want to ${action} this payout?`)) return;

    setProcessing(sellerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ sellerId, action, amount }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Payout ${action}ed successfully` });
        fetchPayouts();
      } else {
        setMessage({ type: 'error', text: 'Failed to process payout' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process payout' });
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

  const totalAvailable = payouts.reduce((sum, p) => sum + p.availableForPayout, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Seller Payouts</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Available for Payout</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAvailable)}</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.sellerId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{payout.businessName || 'Unnamed'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{payout.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                  {payout.payoutGateway || 'Not set'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {formatCurrency(payout.totalEarnings)}
                </td>
                <td className="px-6 py-4 text-sm text-yellow-600">
                  {formatCurrency(payout.pendingPayout)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">
                  {formatCurrency(payout.availableForPayout)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePayout(payout.sellerId, 'approve', payout.availableForPayout)}
                      disabled={processing === payout.sellerId || payout.availableForPayout <= 0}
                      className="flex items-center px-3 py-1 text-xs text-green-600 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50"
                      title="Approve for payout"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handlePayout(payout.sellerId, 'process', payout.pendingPayout)}
                      disabled={processing === payout.sellerId || payout.pendingPayout <= 0}
                      className="flex items-center px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50"
                      title="Process payout"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Process
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payouts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            No payout data available
          </div>
        )}
      </div>
    </div>
  );
}
