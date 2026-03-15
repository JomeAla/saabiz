'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader2, Key, CheckCircle2, XCircle, Search, Calendar } from 'lucide-react';
import axios from 'axios';

interface Subscriber {
  id: string;
  key: string;
  active: boolean;
  expiresAt: string | null;
  product: { name: string };
  transaction: { reference: string, amount: number, gateway: string, plan: { name: string, interval: string } } | null;
}

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await axios.get('/api/licenses/subscribers', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setSubscribers(res.data);
    } catch (err: any) {
      setError('Failed to fetch subscribers. Make sure you are logged in as a Seller.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s => 
    s.key.toLowerCase().includes(search.toLowerCase()) || 
    s.product.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.transaction && s.transaction.reference.toLowerCase().includes(search.toLowerCase()))
  );

  const calculateStatus = (sub: Subscriber) => {
    if (!sub.active) return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold"><XCircle className="w-3 h-3" /> Revoked</span>;
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold"><Calendar className="w-3 h-3" /> Expired</span>;
    }
    return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> Active</span>;
  };

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <Users className="w-8 h-8 text-emerald-500" /> Subscribers Data
          </h1>
          <p className="text-sm text-slate-500 mt-1">View incoming revenues and generated software licenses.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by key, product or reference..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {subscribers.length === 0 && !error ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
           <Key className="w-12 h-12 text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-800 mb-1">No subscribers yet</h3>
           <p className="text-slate-500">When users buy your software, their license keys will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">License Key</th>
                  <th className="px-6 py-4">Product & Plan</th>
                  <th className="px-6 py-4 hidden md:table-cell">Transaction</th>
                  <th className="px-6 py-4">Expiration</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                       <div className="flex items-center gap-2">
                         <Key className="w-4 h-4 text-indigo-400" />
                         {sub.key}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-bold text-slate-800">{sub.product.name}</span>
                       <div className="text-xs text-slate-500 mt-0.5">{sub.transaction?.plan?.name}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                       {sub.transaction ? (
                          <>
                            <div className="text-slate-900 font-medium">{sub.transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">{sub.transaction.gateway} ({sub.transaction.reference.substring(0, 10)}...)</div>
                          </>
                       ) : (
                          <span className="text-slate-400 italic">Manual</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                       {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="px-6 py-4">
                       {calculateStatus(sub)}
                    </td>
                  </tr>
                ))}
                
                {filteredSubscribers.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No subscribers found matching your search.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
