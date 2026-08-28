'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Loader2, Check, AlertCircle, MailCheck } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to verify email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090910] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Loader2 className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-slate-400">Verifying your email...</p>
        </motion.div>
      </div>
    );
  }

  if (invalidToken) {
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
            className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <AlertCircle className="w-8 h-8 text-red-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Verification Link</h2>
          <p className="text-slate-400 mb-6">
            This email verification link is invalid.
          </p>
          <button
            onClick={() => router.push('/(auth)/login')}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
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
            <MailCheck className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-slate-400 mb-6">
            Your email has been successfully verified. You can now access your account.
          </p>
          <button
            onClick={() => router.push('/(auth)/login')}
            className="btn-primary py-3 px-6"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

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
          className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <AlertCircle className="w-8 h-8 text-red-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
        <p className="text-slate-400 mb-6">
          {error || 'Unable to verify your email. Please try again.'}
        </p>
        <button
          onClick={() => router.push('/(auth)/login')}
          className="text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Go to Login
        </button>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090910] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
