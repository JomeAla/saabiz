'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, KeyRound, Bot, Plus, X, Trash2, Eye, AlertTriangle, Search, RefreshCw, Box } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface HoneypotKey {
  id: string;
  productId: string;
  key: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  product: { id: string; name: string };
  _count: { hits: number };
}

interface HoneypotHit {
  id: string;
  endpoint: string;
  machineId: string | null;
  domain: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface BotSubmission {
  id: string;
  form: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface ProductOption {
  id: string;
  name: string;
  seller: { businessName: string | null } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const ENDPOINT_LABELS: Record<string, string> = {
  verify: 'License verify',
  'ota-check': 'OTA update check',
  'ota-validate': 'OTA validate',
  activate: 'Activate',
  deactivate: 'Deactivate',
  status: 'Activation status',
};

export default function AdminHoneypots() {
  const [tab, setTab] = useState<'keys' | 'bots'>('keys');
  const [keys, setKeys] = useState<HoneypotKey[]>([]);
  const [bots, setBots] = useState<BotSubmission[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedKey, setSelectedKey] = useState<HoneypotKey | null>(null);
  const [hits, setHits] = useState<HoneypotHit[]>([]);
  const [hitsLoading, setHitsLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    label: '',
    key: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async (specificTab?: 'keys' | 'bots') => {
    const target = specificTab || tab;
    try {
      const [keysData, botsData, productsData] = await Promise.all([
        api.get<HoneypotKey[]>('/api/honeypots'),
        api.get<BotSubmission[]>('/api/honeypots/bot-submissions'),
        api.get<ProductOption[]>('/api/admin/products'),
      ]);
      setKeys(keysData);
      setBots(botsData);
      setProducts(productsData);
    } catch (err: any) {
      console.error('Failed to fetch honeypot data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = { productId: formData.productId, label: formData.label || undefined };
      if (formData.key.trim()) payload.key = formData.key.trim();

      await api.post('/api/honeypots', payload);

      setSuccess('Honeypot key created');
      setTimeout(() => setSuccess(''), 3000);
      setShowCreate(false);
      setFormData({ productId: '', label: '', key: '' });
      fetchData('keys');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (hk: HoneypotKey) => {
    try {
      await api.patch(`/api/honeypots/${hk.id}`, { isActive: !hk.isActive });
      fetchData('keys');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (hk: HoneypotKey) => {
    if (!confirm(`Delete honeypot key ${hk.key} and all its hits?`)) return;
    try {
      await api.delete(`/api/honeypots/${hk.id}`);
      setSuccess('Honeypot key deleted');
      setTimeout(() => setSuccess(''), 3000);
      fetchData('keys');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openHits = async (hk: HoneypotKey) => {
    setSelectedKey(hk);
    setHits([]);
    setHitsLoading(true);
    try {
      const data = await api.get<HoneypotHit[]>(`/api/honeypots/${hk.id}/hits`);
      setHits(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setHitsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalHits = keys.reduce((sum, k) => sum + k._count.hits, 0);
  const activeKeys = keys.filter((k) => k.isActive);

  const keyColumns = [
    {
      key: 'key',
      header: 'Decoy Key',
      render: (hk: HoneypotKey) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-mono font-medium">{hk.key}</p>
            {hk.label && <p className="text-xs text-gray-500 truncate max-w-[260px]">{hk.label}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (hk: HoneypotKey) => (
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-sm text-gray-300">{hk.product.name}</span>
        </div>
      ),
    },
    {
      key: 'hits',
      header: 'Hits',
      render: (hk: HoneypotKey) => (
        <span className={`text-sm font-semibold ${hk._count.hits > 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {hk._count.hits}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (hk: HoneypotKey) => (
        <button
          onClick={() => toggleActive(hk)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            hk.isActive
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
        >
          {hk.isActive ? 'Armed' : 'Disarmed'}
        </button>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (hk: HoneypotKey) => (
        <span className="text-sm text-gray-400">{formatDate(hk.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (hk: HoneypotKey) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openHits(hk)}
            className={`p-2 rounded-lg transition-colors ${
              hk._count.hits > 0
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="View hits"
          >
            <Eye className={`w-4 h-4 ${hk._count.hits > 0 ? 'animate-pulse' : ''}`} />
          </button>
          <button
            onClick={() => handleDelete(hk)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const botColumns = [
    {
      key: 'form',
      header: 'Form',
      render: (b: BotSubmission) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-sm font-mono text-white">{b.form}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Attempted Email',
      render: (b: BotSubmission) => (
        <span className="text-sm text-gray-300">{b.email || '—'}</span>
      ),
    },
    {
      key: 'ip',
      header: 'IP Address',
      render: (b: BotSubmission) => (
        <span className="text-sm font-mono text-gray-300">{b.ipAddress || '—'}</span>
      ),
    },
    {
      key: 'ua',
      header: 'User Agent',
      render: (b: BotSubmission) => (
        <span className="text-xs text-gray-500 truncate max-w-[220px] block" title={b.userAgent || ''}>
          {b.userAgent || '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Time',
      render: (b: BotSubmission) => (
        <span className="text-sm text-gray-400">{formatDate(b.createdAt)}</span>
      ),
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Honeypots</h1>
          <p className="text-gray-500 mt-1">
            Decoy license keys &amp; bot traps — catch pirates and spam bots red-handed
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Decoy Key
        </button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          {success}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Decoy Keys</p>
              <p className="text-2xl font-bold text-white">
                {keys.length}
                <span className="text-sm text-gray-500 font-normal ml-2">({activeKeys.length} armed)</span>
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Trap Hits</p>
              <p className={`text-2xl font-bold ${totalHits > 0 ? 'text-red-400' : 'text-white'}`}>{totalHits}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bot Submissions</p>
              <p className={`text-2xl font-bold ${bots.length > 0 ? 'text-amber-400' : 'text-white'}`}>{bots.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-2">
        {([
          { id: 'keys', label: 'License Keys', icon: KeyRound },
          { id: 'bots', label: 'Bot Submissions', icon: Bot },
        ] as const).map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                fetchData(t.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.id === 'keys' && keys.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs">{keys.length}</span>
              )}
              {t.id === 'bots' && bots.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs">{bots.length}</span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => fetchData()}
          className="ml-auto flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      <motion.div variants={itemVariants}>
        {tab === 'keys' ? (
          <DataTable
            columns={keyColumns}
            data={keys}
            keyField="id"
            searchPlaceholder="Search decoy keys..."
            emptyMessage="No honeypot keys yet. Create one and plant it in a leaked build."
            loading={loading}
          />
        ) : (
          <DataTable
            columns={botColumns}
            data={bots}
            keyField="id"
            searchPlaceholder="Search bot submissions..."
            emptyMessage="No bots caught yet. The trap field is quietly waiting on the register and forgot-password forms."
            loading={loading}
          />
        )}
      </motion.div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Create Decoy License Key</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Any use of this key on a license endpoint triggers a trap alert — no real access is granted.
                  </p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Product *</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[#090910]">Select a product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#090910]">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Label (where it's planted)</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="e.g. Planted in leaked v2.0 build (forum)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Custom Key (optional)</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="SAABIZ-XXXXXXXXXXXXXXX (leave empty to generate)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-generate a key in the real license format.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Decoy Key'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hits modal */}
      <AnimatePresence>
        {selectedKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedKey(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Hits on {selectedKey.key}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedKey.product.name}
                    {selectedKey.label ? ` — ${selectedKey.label}` : ''}
                  </p>
                </div>
                <button onClick={() => setSelectedKey(null)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {hitsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : hits.length === 0 ? (
                <div className="py-16 text-center">
                  <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hits recorded for this key yet.</p>
                  <p className="text-gray-600 text-sm mt-1">Use it against /api/licenses/verify or ota-check to test the trap.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hits.map((hit) => (
                    <div key={hit.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {ENDPOINT_LABELS[hit.endpoint] || hit.endpoint}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(hit.createdAt)}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">IP</span>
                          <p className="font-mono text-gray-300">{hit.ipAddress || '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Machine</span>
                          <p className="font-mono text-gray-300 truncate" title={hit.machineId || ''}>{hit.machineId || '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Domain</span>
                          <p className="font-mono text-gray-300">{hit.domain || '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">User Agent</span>
                          <p className="text-gray-300 truncate" title={hit.userAgent || ''}>{hit.userAgent || '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}