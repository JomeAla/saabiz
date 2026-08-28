'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Percent, Calendar, DollarSign, Plus, X, Check, AlertCircle, Edit2, Trash2, Copy } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface Promotion {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  maxUses: number | null;
  uses: number;
  createdAt: string;
  _count: { transactions: number };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    startDate: '',
    endDate: '',
    isActive: true,
    maxUses: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const data = await api.get<Promotion[]>('/api/admin/promotions');
      setPromotions(data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      await api.post('/api/admin/promotions', payload);

      setSuccess('Promotion created successfully');
      setTimeout(() => setSuccess(''), 3000);
      setShowModal(false);
      resetForm();
      fetchPromotions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromotion) return;

    setSubmitting(true);
    setError('');

    try {
      const payload: any = {};
      if (formData.description !== selectedPromotion.description) payload.description = formData.description;
      if (formData.discountValue !== selectedPromotion.discountValue) payload.discountValue = formData.discountValue;
      if (formData.endDate !== selectedPromotion.endDate?.split('T')[0]) {
        payload.endDate = formData.endDate ? new Date(formData.endDate).toISOString() : null;
      }
      if (formData.isActive !== selectedPromotion.isActive) payload.isActive = formData.isActive;
      if (formData.maxUses !== selectedPromotion.maxUses) payload.maxUses = formData.maxUses;

      if (Object.keys(payload).length === 0) {
        setShowModal(false);
        return;
      }

      await api.patch(`/api/admin/promotions/${selectedPromotion.id}`, payload);

      setSuccess('Promotion updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setShowModal(false);
      fetchPromotions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      await api.delete(`/api/admin/promotions/${promotionId}`);

      setSuccess('Promotion deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchPromotions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (promotion: Promotion) => {
    try {
      await api.patch(`/api/admin/promotions/${promotion.id}`, { isActive: !promotion.isActive });

      fetchPromotions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPromotion(null);
    resetForm();
    setError('');
    setShowModal(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setModalMode('edit');
    setSelectedPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description || '',
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: new Date(promotion.startDate).toISOString().split('T')[0],
      endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
      isActive: promotion.isActive,
      maxUses: promotion.maxUses,
    });
    setError('');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      maxUses: null,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess('Code copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discountType === 'PERCENTAGE') {
      return `${promotion.discountValue}%`;
    }
    return `₦${promotion.discountValue.toFixed(2)}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (promotion: Promotion) => {
    if (!promotion.endDate) return false;
    return new Date(promotion.endDate) < new Date();
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (promotion: Promotion) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
            <Tag className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-mono font-medium">{promotion.code}</p>
            {promotion.description && (
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{promotion.description}</p>
            )}
          </div>
          <button
            onClick={() => copyCode(promotion.code)}
            className="ml-2 p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (promotion: Promotion) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-400">{formatDiscount(promotion)}</span>
          <span className="text-xs text-gray-500 px-1.5 py-0.5 rounded bg-white/5">
            {promotion.discountType === 'PERCENTAGE' ? 'Percent' : 'Fixed'}
          </span>
        </div>
      )
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (promotion: Promotion) => (
        <div className="text-sm">
          <span className="text-white font-medium">{promotion.uses}</span>
          <span className="text-gray-500"> / {promotion.maxUses || '∞'}</span>
          <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: promotion.maxUses
                  ? `${Math.min((promotion.uses / promotion.maxUses) * 100, 100)}%`
                  : '0%'
              }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'dates',
      header: 'Validity',
      render: (promotion: Promotion) => (
        <div className="text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(promotion.startDate)}
          </div>
          {promotion.endDate && (
            <div className="text-xs text-gray-500 mt-0.5">
              to {formatDate(promotion.endDate)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (promotion: Promotion) => {
        const expired = isExpired(promotion);
        return (
          <button
            onClick={() => !expired && toggleActive(promotion)}
            disabled={expired}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              expired
                ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                : promotion.isActive
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
          >
            {expired ? 'Expired' : promotion.isActive ? 'Active' : 'Inactive'}
          </button>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (promotion: Promotion) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(promotion)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit promotion"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(promotion.id)}
            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            title="Delete promotion"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const activePromotions = promotions.filter(p => p.isActive && !isExpired(p));
  const totalUses = promotions.reduce((sum, p) => sum + p.uses, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promotions</h1>
          <p className="text-gray-500 mt-1">Create and manage discount codes for your platform</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Promotion
        </button>
      </motion.div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {success}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Tag className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Promotions</p>
              <p className="text-2xl font-bold text-white">{promotions.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Promotions</p>
              <p className="text-2xl font-bold text-emerald-400">{activePromotions.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Uses</p>
              <p className="text-2xl font-bold text-amber-400">{totalUses}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={promotions}
          keyField="id"
          searchPlaceholder="Search promotions..."
          emptyMessage="No promotions found"
          loading={loading}
        />
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {modalMode === 'create' ? 'Create Promotion' : 'Edit Promotion'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={modalMode === 'create' ? handleCreate : handleUpdate} className="space-y-4">
                {modalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Promo Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                      placeholder="SAVE20"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="Optional description"
                  />
                </div>

                {modalMode === 'create' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Discount Type
                        </label>
                        <select
                          value={formData.discountType}
                          onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                        >
                          <option value="PERCENTAGE" className="bg-[#090910]">Percentage</option>
                          <option value="FIXED" className="bg-[#090910]">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Discount Value *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                          placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '10.00'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}

                {modalMode === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Discount Value</label>
                    <input
                      type="number"
                      min="0"
                      step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Max Uses</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxUses || ''}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="Unlimited"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300 cursor-pointer">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
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
