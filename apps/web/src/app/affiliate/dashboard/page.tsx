'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users, Link as LinkIcon, Copy, Check } from 'lucide-react';

interface AffiliateData {
  affiliateCode: string;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: number;
  totalCommission: number;
  pendingPayout: number;
}

export default function AffiliateDashboard() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/affiliates/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!data?.affiliateCode) return;
    const link = `${window.location.origin}/?ref=${data.affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Affiliate Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(data?.totalEarnings || 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Referrals</p>
                <p className="text-2xl font-bold text-blue-900">{data?.totalReferrals || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Percent className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Commission Rate</p>
                <p className="text-2xl font-bold text-purple-900">{((data?.commissionRate || 0) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Pending Payout</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(data?.pendingPayout || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 font-mono text-lg">
              {data?.affiliateCode}
            </div>
            <button
              onClick={copyReferralLink}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Share this link to earn commissions on every sale made through your referral.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 font-bold">1</span>
            </div>
            <h3 className="font-medium">Share Your Link</h3>
            <p className="text-sm text-gray-500 mt-1">Share your unique referral link with your audience</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 font-bold">2</span>
            </div>
            <h3 className="font-medium">They Purchase</h3>
            <p className="text-sm text-gray-500 mt-1">When someone makes a purchase, you earn a commission</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 font-bold">3</span>
            </div>
            <h3 className="font-medium">Get Paid</h3>
            <p className="text-sm text-gray-500 mt-1">Receive payouts directly to your account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
