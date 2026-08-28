'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { CreditCard, Download, FileText, Plus, Loader2, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  createdAt: string;
  buyer: { email: string };
  seller: { name: string };
  product: { name: string };
  plan: { name: string; price: number };
  total: number;
  payment: { gateway: string; reference: string };
}

export default function CustomerBilling() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const data = await api.get<Invoice[]>('/api/invoices/my-invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, format: 'pdf' | 'html') => {
    setDownloading(invoiceId);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/invoices/${invoiceId}/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
      FAILED: { bg: 'bg-red-500/10', text: 'text-red-400' },
      REFUNDED: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    };
    const style = statusMap[status] || statusMap.PENDING;
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Manage your payment methods and billing history</p>
      </motion.div>

      {error && (
        <motion.div variants={item} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
          <button onClick={fetchInvoices} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </motion.div>
      )}

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Payment Methods</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="relative">
                  <div className="absolute -inset-px bg-white/5 rounded-xl" />
                  <div className="relative bg-[#090910] rounded-xl p-px">
                    <div className="bg-[#090910] rounded-xl p-6 border border-white/5">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <CreditCard className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Payment Methods</p>
                            <p className="text-sm text-gray-500">Payment methods are managed during checkout</p>
                          </div>
                        </div>
                        <motion.a
                          href="/marketplace"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Browse Products
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Billing History</h2>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-sm text-gray-500">{invoices.length} invoices</span>
                </div>
                
                {invoices.length === 0 && !error ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-gray-500">No billing history yet</p>
                    <p className="text-sm text-gray-600 mt-1">Your invoices will appear here after purchases</p>
                    <motion.a
                      href="/marketplace"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
                    >
                      Browse Products
                    </motion.a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <FileText className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{invoice.invoiceNumber}</span>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span>{invoice.product.name}</span>
                              <span>•</span>
                              <span>{invoice.plan.name}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(invoice.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-white">
                            ₦{invoice.total.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadInvoice(invoice.id, 'pdf')}
                              disabled={downloading === invoice.id}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloading === invoice.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => window.open(
                                `/api/invoices/${invoice.id}/html`,
                                '_blank'
                              )}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                              title="View HTML"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">Download Invoices</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400">
                    Invoice PDFs are sent to your email after each transaction. You can also download them from the billing history above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
