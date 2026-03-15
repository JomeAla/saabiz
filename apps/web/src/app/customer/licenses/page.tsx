'use client';

import { useEffect, useState } from 'react';
import { Key, X, ArrowUpCircle, Check, AlertCircle } from 'lucide-react';

interface License {
  id: string;
  key: string;
  active: boolean;
  expiresAt: string | null;
  product: { id: string; name: string };
  transaction: { plan: { name: string; price: number; interval: string } };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
}

export default function CustomerLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Record<string, Plan[]>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscriptions/my-subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLicenses(data.licenses || []);
      
      const productIds = [...new Set((data.licenses || []).map((l: License) => l.product.id))];
      const plansData: Record<string, Plan[]> = {};
      for (const productId of productIds) {
        const plansResponse = await fetch(`/api/subscriptions/plans/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        plansData[productId] = await plansResponse.json();
      }
      setAvailablePlans(plansData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    setCanceling(subscriptionId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ subscriptionId }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    } finally {
      setCanceling(null);
    }
  };

  const handleUpgrade = async (subscriptionId: string, newPlanId: string) => {
    setUpgrading(subscriptionId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ subscriptionId, newPlanId }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription upgraded successfully!' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upgrade subscription' });
    } finally {
      setUpgrading(null);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Licenses & Subscriptions</h1>
        
        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {licenses.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">You don't have any licenses yet.</p>
            <p className="text-sm text-gray-400 mt-1">Purchase a product to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {licenses.map(license => {
              const plans = availablePlans[license.product.id] || [];
              const currentPrice = license.transaction?.plan?.price || 0;
              const higherPlans = plans.filter(p => p.price > currentPrice);

              return (
                <div key={license.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{license.product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {license.transaction?.plan?.name} - ${license.transaction?.plan?.price}/{license.transaction?.plan?.interval?.toLowerCase()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      license.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {license.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <label className="text-sm font-medium text-gray-700">License Key</label>
                    <p className="font-mono text-lg mt-1 bg-white px-4 py-2 rounded border">
                      {license.key}
                    </p>
                  </div>

                  {license.expiresAt && (
                    <p className="text-sm text-gray-500 mb-4">
                      {license.active 
                        ? `Expires: ${new Date(license.expiresAt).toLocaleDateString()}`
                        : `Expired: ${new Date(license.expiresAt).toLocaleDateString()}`
                      }
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {higherPlans.length > 0 && license.active && (
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded-md px-3 py-2 text-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpgrade(license.id, e.target.value);
                            }
                          }}
                          disabled={upgrading === license.id}
                          defaultValue=""
                        >
                          <option value="">Upgrade to...</option>
                          {higherPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - ${plan.price}/{plan.interval.toLowerCase()}
                            </option>
                          ))}
                        </select>
                        {upgrading === license.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleCancel(license.id)}
                      disabled={canceling === license.id || !license.active}
                      className="flex items-center px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {canceling === license.id ? 'Canceling...' : 'Cancel Subscription'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
