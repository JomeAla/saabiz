'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import { Shield, CreditCard, ChevronRight } from 'lucide-react';
import PaymentConfigForm from '@/components/admin/PaymentConfigForm';
import Link from 'next/link';

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

export default function AdminPaymentsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-[#090910] bg-grid-subtle py-12 px-6"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/platform-admin/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="text-emerald-400 text-sm font-medium">Payment Configuration</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Payment Configuration</h1>
            <p className="text-gray-500 mt-2">Configure your payment gateways and processing settings</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Secure</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Gateway Settings</h2>
              <p className="text-sm text-gray-500">Manage Paystack and Flutterwave configurations</p>
            </div>
          </div>
          <PaymentConfigForm />
        </motion.div>
      </div>
    </motion.div>
  );
}
