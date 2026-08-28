'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Shield, Plus, Trash2, X, Check, UserCircle } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'AFFILIATE';
  isEmailVerified: boolean;
  createdAt: string;
  seller?: { id: string; businessName: string | null; totalEarnings: number; _count?: { products: number } };
  affiliate?: { id: string; affiliateCode: string; totalEarnings: number };
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

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SELLER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CUSTOMER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  AFFILIATE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'SELLER' as const,
    businessName: '',
    skipVerification: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const url = filterRole
        ? `/api/admin/users?role=${filterRole}`
        : '/api/admin/users';
      const data = await api.get<User[]>(url);
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/api/admin/users', formData);

      setShowModal(false);
      setFormData({ email: '', password: '', role: 'SELLER', businessName: '', skipVerification: false });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/api/admin/users/${userId}`);

      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openCreateModal = () => {
    setFormData({ email: '', password: '', role: 'SELLER', businessName: '', skipVerification: false });
    setError('');
    setShowModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${roleColors[user.role]}`}>
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-medium">{user.seller?.businessName || user.affiliate?.affiliateCode || user.email.split('@')[0]}</p>
            <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Mail className="w-4 h-4" />
          {user.email}
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${roleColors[user.role]}`}>
          {user.role}
        </span>
      )
    },
    {
      key: 'verified',
      header: 'Status',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          {user.isEmailVerified ? (
            <span className="flex items-center gap-1 text-emerald-400 text-sm">
              <Check className="w-4 h-4" />
              Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 text-sm">
              <X className="w-4 h-4" />
              Pending
            </span>
          )}
        </div>
      )
    },
    {
      key: 'created',
      header: 'Created',
      render: (user: User) => (
        <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDelete(user.id)}
            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-500 mt-1">Create and manage platform users and administrators</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6 cursor-pointer" onClick={() => setFilterRole('')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6 cursor-pointer" onClick={() => setFilterRole('ADMIN')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-400">{roleCounts.ADMIN || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6 cursor-pointer" onClick={() => setFilterRole('SELLER')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sellers</p>
              <p className="text-2xl font-bold text-emerald-400">{roleCounts.SELLER || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6 cursor-pointer" onClick={() => setFilterRole('CUSTOMER')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-2xl font-bold text-blue-400">{roleCounts.CUSTOMER || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {filterRole && (
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtered by:</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${roleColors[filterRole]}`}>
            {filterRole}
          </span>
          <button
            onClick={() => setFilterRole('')}
            className="text-sm text-gray-400 hover:text-white"
          >
            Clear filter
          </button>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          searchPlaceholder="Search users..."
          emptyMessage="No users found"
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
              className="w-full max-w-lg glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New User</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                    placeholder="Temporary password"
                  />
                  <p className="text-xs text-gray-500 mt-1">User should change this after first login</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  >
                    <option value="SELLER" className="bg-[#090910]">Seller</option>
                    <option value="ADMIN" className="bg-[#090910]">Admin</option>
                    <option value="CUSTOMER" className="bg-[#090910]">Customer</option>
                    <option value="AFFILIATE" className="bg-[#090910]">Affiliate</option>
                  </select>
                </div>

                {formData.role === 'SELLER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                      placeholder="Business name (optional)"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <input
                    type="checkbox"
                    id="skipVerification"
                    checked={formData.skipVerification}
                    onChange={(e) => setFormData({ ...formData, skipVerification: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <label htmlFor="skipVerification" className="text-sm text-gray-300 cursor-pointer">
                    Skip email verification
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
                    {submitting ? 'Creating...' : 'Create User'}
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
