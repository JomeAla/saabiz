'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Clock, AlertTriangle, TrendingUp, Shield, AlertCircle, RefreshCw } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  product: { name: string };
  plan: { name: string; price: number; interval: string };
}

interface License {
  id: string;
  key: string;
  active: boolean;
  expiresAt: string | null;
  product: { name: string };
  transaction: { plan: { name: string; price: number; interval: string } };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/subscriptions/my-subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to load subscriptions');
        return;
      }

      setSubscriptions(data.subscriptions || []);
      setLicenses(data.licenses || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const activeLicenses = licenses.filter(l => l.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Your Customer Portal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-indigo-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-indigo-900">{activeSubscriptions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Key className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Active Licenses</p>
                <p className="text-2xl font-bold text-green-900">{activeLicenses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {licenses.filter(l => l.expiresAt && new Date(l.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-900">{subscriptions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <p className="text-gray-500">No active subscriptions</p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map(sub => (
                <div key={sub.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{sub.product.name}</h3>
                      <p className="text-sm text-gray-500">{sub.plan.name} - ${sub.plan.price}/{sub.plan.interval.toLowerCase()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  {sub.cancelAtPeriodEnd && (
                    <div className="mt-2 flex items-center text-yellow-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Cancels at period end
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your License Keys</h2>
          {licenses.length === 0 ? (
            <p className="text-gray-500">No license keys yet</p>
          ) : (
            <div className="space-y-4">
              {licenses.map(lic => (
                <div key={lic.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{lic.product.name}</h3>
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">{lic.key}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lic.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {lic.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {lic.expiresAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Expires: {new Date(lic.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
