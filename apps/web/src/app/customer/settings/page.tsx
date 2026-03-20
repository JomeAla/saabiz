'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { User, Mail, Lock, Save, Check } from 'lucide-react';
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

export default function CustomerSettings() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    }, 1000);
  };

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
                            Full Name
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                            placeholder="Your full name"
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
                            className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                            placeholder="your@email.com"
                          />
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
                            <input
                              type="password"
                              className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                              placeholder="New password"
                            />
                            <input
                              type="password"
                              className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-600 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                              placeholder="Confirm new password"
                            />
                          </div>
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
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
