'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Download, FileText } from 'lucide-react';

export default function CustomerBilling() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing & Payment Methods</h1>
        
        <div className="border-t pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
          <p className="text-gray-500 mb-4">Manage your payment methods through the checkout when upgrading.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div className="ml-4">
                <p className="font-medium text-gray-900">No payment method on file</p>
                <p className="text-sm text-gray-500">Add a payment method when you upgrade</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Billing History</h2>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No billing history yet</p>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Download Invoices</h2>
          <p className="text-gray-500 text-sm">
            Invoice PDFs are sent to your email after each transaction. Contact support for duplicate invoices.
          </p>
        </div>
      </div>
    </div>
  );
}
