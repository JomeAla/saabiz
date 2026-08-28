'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, Check, MailOpen } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/auth/forgot-password', { email, website });
      setSent(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#090910] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card rounded-2xl p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-slate-400 mb-6">
            If an account exists with {email}, you will receive a password reset link shortly.
          </p>
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090910] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card rounded-2xl p-8"
      >
        <Link
          href="/login"
          className="flex items-center text-slate-500 hover:text-white mb-6 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <MailOpen className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
          <p className="text-slate-400 mt-2">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot field - hidden from humans, bots fill it */}
          <div aria-hidden="true" className="hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d0d14] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
