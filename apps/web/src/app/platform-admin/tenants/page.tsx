'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Globe, Plus, X, Trash2, Star, Pencil, AlertTriangle, Check, ExternalLink, DollarSign, Package, Users, Ticket, LayoutDashboard } from 'lucide-react';
import { api } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  settings: {
    logoUrl?: string;
    primaryColor?: string;
    tagline?: string;
    currency?: string;
  } | null;
  createdAt: string;
  domains: { id: string; host: string; isPrimary: boolean; isVerified: boolean }[];
  seller: { id: string; user: { email: string } | null; _count: { products: number } } | null;
  configs: { id: string; paystackActive: boolean; flutterwaveActive: boolean }[];
}

interface TenantAnalytics {
  totalRevenue: number;
  totalSellerEarnings: number;
  totalTransactions: number;
  activeSubscriptions: number;
  productCount: number;
  licenseCount: number;
}

interface SellerOption {
  id: string;
  businessName: string | null;
  user: { email: string };
  tenant: { id: string; name: string; slug: string } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, TenantAnalytics>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    primaryDomain: '',
    tagline: '',
    primaryColor: '#7c3aed',
    currency: 'NGN',
    assignSellerId: '',
  });
  const [domainInput, setDomainInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [tenantsData, sellersData] = await Promise.all([
        api.get<Tenant[]>('/api/admin/tenants'),
        api.get<SellerOption[]>('/api/admin/sellers'),
      ]);
      setTenants(tenantsData);
      setSellers(sellersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadAnalytics = async (tenant: Tenant) => {
    if (analytics[tenant.id]) return;
    try {
      const data = await api.get<TenantAnalytics>(`/api/admin/tenants/${tenant.id}/analytics`);
      setAnalytics((prev) => ({ ...prev, [tenant.id]: data }));
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/admin/tenants', {
        name: formData.name,
        slug: formData.slug,
        primaryDomain: formData.primaryDomain || undefined,
        assignSellerId: formData.assignSellerId || undefined,
        settings: {
          tagline: formData.tagline || undefined,
          primaryColor: formData.primaryColor,
          currency: formData.currency,
        },
      });
      setSuccess(`Tenant "${formData.name}" created`);
      setTimeout(() => setSuccess(''), 3000);
      setShowCreate(false);
      setFormData({ name: '', slug: '', primaryDomain: '', tagline: '', primaryColor: '#7c3aed', currency: 'NGN', assignSellerId: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await api.patch(`/api/admin/tenants/${tenant.id}`, { isActive: !tenant.isActive });
      setSuccess(tenant.isActive ? `Tenant "${tenant.name}" deactivated` : `Tenant "${tenant.name}" activated`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddDomain = async (tenant: Tenant) => {
    if (!domainInput.trim()) return;
    try {
      await api.post(`/api/admin/tenants/${tenant.id}/domains`, { host: domainInput.trim() });
      setDomainInput('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveDomain = async (tenant: Tenant, domainId: string) => {
    if (!confirm('Remove this domain from the tenant?')) return;
    try {
      await api.delete(`/api/admin/tenants/${tenant.id}/domains/${domainId}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetPrimary = async (tenant: Tenant, domainId: string) => {
    try {
      await api.post(`/api/admin/tenants/${tenant.id}/domains/${domainId}/primary`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveBranding = async (tenant: Tenant) => {
    try {
      await api.patch(`/api/admin/tenants/${tenant.id}`, {
        settings: tenant.settings || {},
      });
      setSuccess('Branding saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`Deactivate tenant "${tenant.name}"? Its storefront domains will return 404.`)) return;
    try {
      await api.delete(`/api/admin/tenants/${tenant.id}`);
      setSuccess(`Tenant "${tenant.name}" deactivated`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const unassignedSellers = sellers.filter((s) => !s.tenant);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-gray-500 mt-1">Storefronts, domains, branding and payment configs per tenant</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Tenant
        </button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div variants={itemVariants} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div className="glass-card rounded-2xl py-20 text-center">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No tenants yet. Create your first storefront.</p>
          </div>
        ) : (
          tenants.map((tenant) => {
            const metric = analytics[tenant.id];
            const primary = tenant.domains.find((d) => d.isPrimary)?.host;
            return (
              <div key={tenant.id} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                      style={{ backgroundColor: `${tenant.settings?.primaryColor || '#7c3aed'}22` }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: tenant.settings?.primaryColor || '#7c3aed' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold truncate">{tenant.name}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                          tenant.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {tenant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="font-mono">{tenant.slug}.saabiz.com</span>
                        {primary && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {primary}
                          </span>
                        )}
                        {tenant.seller && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {tenant.seller.user?.email || 'linked seller'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`http://${primary || `${tenant.slug}.saabiz.com`}:3000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Open storefront"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={`/admin/payments?tenantId=${tenant.id}`}
                      className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Payment config"
                    >
                      <DollarSign className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        setExpandedId(expandedId === tenant.id ? null : tenant.id);
                        if (expandedId !== tenant.id) loadAnalytics(tenant);
                      }}
                      className="px-3 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                    >
                      {expandedId === tenant.id ? 'Close' : 'Manage'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === tenant.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/[0.06]"
                    >
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Domains */}
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" /> Domains
                          </h3>
                          <div className="space-y-2">
                            {tenant.domains.map((d) => (
                              <div key={d.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="font-mono text-sm text-gray-300 flex-1 truncate">{d.host}</span>
                                {d.isPrimary ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                                    <Star className="w-3 h-3" /> Primary
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetPrimary(tenant, d.id)}
                                    className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-emerald-400 transition-all"
                                    title="Set as primary"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveDomain(tenant, d.id)}
                                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-red-400 transition-all"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {tenant.domains.length === 0 && (
                              <p className="text-sm text-gray-600">No domains yet.</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <input
                              type="text"
                              value={domainInput}
                              onChange={(e) => setDomainInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain(tenant))}
                              placeholder="shop.example.com"
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                            />
                            <button
                              onClick={() => handleAddDomain(tenant)}
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm hover:bg-emerald-500/20 transition-all shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Analytics */}
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-emerald-400" /> Storefront stats
                          </h3>
                          {!metric ? (
                            <div className="py-6 text-center text-sm text-gray-500">
                              <LoaderIcon />
                              Loading...
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <Stat label="Revenue" value={`$${(metric.totalRevenue || 0).toFixed(2)}`} />
                              <Stat label="Transactions" value={metric.totalTransactions} />
                              <Stat label="Active subs" value={metric.activeSubscriptions} />
                              <Stat label="Licenses" value={metric.licenseCount} />
                              <Stat label="Products" value={metric.productCount} />
                              <Stat label="Seller earnings" value={`$${(metric.totalSellerEarnings || 0).toFixed(2)}`} />
                            </div>
                          )}
                        </div>

                        {/* Branding + danger zone */}
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-emerald-400" /> Branding & settings
                          </h3>
                          <div className="space-y-3">
                            <label className="block">
                              <span className="text-xs text-gray-500">Tagline</span>
                              <input
                                type="text"
                                value={tenant.settings?.tagline || ''}
                                onChange={(e) => setTenants((prev) =>
                                  prev.map((t) => t.id === tenant.id ? { ...t, settings: { ...t.settings, tagline: e.target.value } } : t)
                                )}
                                className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs text-gray-500">Primary color</span>
                              <input
                                type="color"
                                value={tenant.settings?.primaryColor || '#7c3aed'}
                                onChange={(e) => setTenants((prev) =>
                                  prev.map((t) => t.id === tenant.id ? { ...t, settings: { ...t.settings, primaryColor: e.target.value } } : t)
                                )}
                                className="mt-1 w-full h-10 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs text-gray-500">Currency</span>
                              <input
                                type="text"
                                value={tenant.settings?.currency || 'NGN'}
                                onChange={(e) => setTenants((prev) =>
                                  prev.map((t) => t.id === tenant.id ? { ...t, settings: { ...t.settings, currency: e.target.value } } : t)
                                )}
                                className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                              />
                            </label>
                            <button
                              onClick={() => handleSaveBranding(tenant)}
                              className="w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium hover:bg-emerald-500/20 transition-all"
                            >
                              Save branding
                            </button>
                          </div>

                          <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
                            <button
                              onClick={() => handleToggleActive(tenant)}
                              className="w-full py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-all"
                            >
                              {tenant.isActive ? 'Deactivate tenant' : 'Activate tenant'}
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(tenant)}
                              className="w-full py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-all"
                            >
                              Deactivate permanently
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
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
                  <h2 className="text-xl font-bold text-white">Create Tenant</h2>
                  <p className="text-sm text-gray-500 mt-1">Creates a branded storefront on {formData.slug || 'your-slug'}.saabiz.com</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: formData.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                      placeholder="Acme Software"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                      placeholder="acme"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Primary domain (optional)</label>
                  <input
                    type="text"
                    value={formData.primaryDomain}
                    onChange={(e) => setFormData({ ...formData, primaryDomain: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="store.example.com (defaults to {slug}.saabiz.com)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assign seller (optional)</label>
                  <select
                    value={formData.assignSellerId}
                    onChange={(e) => setFormData({ ...formData, assignSellerId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[#090910]">No seller assignment</option>
                    {unassignedSellers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#090910]">
                        {s.businessName || s.user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="Software that scales with your business"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Primary color</label>
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                    />
                  </div>
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
                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Tenant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

function LoaderIcon() {
  return (
    <svg className="w-5 h-5 animate-spin inline-block mr-2" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}