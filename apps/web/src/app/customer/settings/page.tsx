'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

export default function CustomerSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setProfile(user);
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        setSaving(false);
        return;
      }
      if (formData.newPassword.length < 8) {
        setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
        setSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token') || '';
      
      if (formData.newPassword) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/reset-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword,
            }),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to update password');
        }
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-96 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
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
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Manage your account preferences</p>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl border border-white/5">
              <div className="p-6">
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      className="mb-6"
                    >
                      <div className={`p-4 rounded-xl flex items-center ${
                        message.type === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <Check className="w-5 h-5 mr-3" />
                        {message.text}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div className="relative group/field">
                      <div className="absolute -inset-px bg-emerald-500/5 rounded-xl opacity-0 group-hover/field:opacity-100 transition-opacity" />
                      <div className="relative bg-[#090910] rounded-xl p-px">
                        <div className="bg-[#090910] rounded-xl p-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <User className="w-4 h-4 text-emerald-400" />
                            Account ID
                          </label>
                          <input
                            type="text"
                            value={profile?.id || ''}
                            disabled
                            className="w-full px-4 py-3 bg-white/5 rounded-xl text-gray-500 border border-white/5 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative group/field">
                      <div className="absolute -inset-px bg-emerald-500/5 rounded-xl opacity-0 group-hover/field:opacity-100 transition-opacity" />
                      <div className="relative bg-[#090910] rounded-xl p-px">
                        <div className="bg-[#090910] rounded-xl p-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Mail className="w-4 h-4 text-emerald-400" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled
                            className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border border-white/5 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-600 mt-2">Email cannot be changed. Contact support if needed.</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative group/field">
                      <div className="absolute -inset-px bg-emerald-500/5 rounded-xl opacity-0 group-hover/field:opacity-100 transition-opacity" />
                      <div className="relative bg-[#090910] rounded-xl p-px">
                        <div className="bg-[#090910] rounded-xl p-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            Change Password
                          </label>
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Current password"
                                className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="New password (min 8 characters)"
                                className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="Confirm new password"
                              className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-2">Leave empty to keep your current password.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:from-emerald-500/30 hover:to-emerald-600/20 transition-all disabled:opacity-50 font-medium"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </form>
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
                <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-sm text-gray-400">Account Type</span>
                    <span className="text-sm font-medium text-white capitalize">{profile?.role?.toLowerCase() || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-sm text-gray-400">Email Verified</span>
                    <span className="text-sm font-medium text-emerald-400">Yes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
