'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Link as LinkIcon, Plus, Copy, ExternalLink, MousePointer, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AffiliateLink {
  id: string;
  code: string;
  clicks: number;
  conversions: number;
  isActive: boolean;
  product: { id: string; name: string };
}

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

export default function AffiliateLinks() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [linksRes, productsRes] = await Promise.all([
        fetch('http://localhost:3001/api/affiliates/links', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      setLinks(await linksRes.json());
      setProducts(await productsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (productId: string) => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/api/affiliates/links', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create link:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (code: string) => {
    const link = `${window.location.origin}/?ref=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(code);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight">My Affiliate Links</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden sm:block" />
        </div>
        <p className="text-gray-500">Create and manage your affiliate links</p>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#090910] rounded-2xl p-px">
            <div className="bg-[#090910] rounded-2xl p-6 border border-white/5">
              <h2 className="text-sm font-medium text-gray-400 mb-4">Create New Link</h2>
              <div className="flex flex-wrap gap-3">
                {products.map(product => {
                  const hasLink = links.some(l => l.product.id === product.id);
                  return (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: hasLink ? 1 : 1.02 }}
                      whileTap={{ scale: hasLink ? 1 : 0.98 }}
                      onClick={() => createLink(product.id)}
                      disabled={creating || hasLink}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        hasLink
                          ? 'bg-white/5 text-gray-500 border border-white/5 cursor-default'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      } disabled:opacity-50`}
                    >
                      {hasLink ? (
                        <>
                          <Check className="w-4 h-4" />
                          Created
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          {product.name}
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        {links.length === 0 ? (
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#090910] rounded-2xl p-px">
              <div className="bg-[#090910] rounded-2xl p-12 text-center border border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <LinkIcon className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No affiliate links yet</h3>
                <p className="text-gray-500">Create your first link above to start earning</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group/link"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent rounded-2xl opacity-0 group-hover/link:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-[#090910] rounded-2xl p-px">
                    <div className="bg-[#090910] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg">{link.product.name}</h3>
                          <div className="flex items-center gap-3 mt-3">
                            <code className="flex-1 bg-white/5 px-4 py-2 rounded-xl text-sm font-mono text-gray-300 border border-white/5 truncate sm:max-w-xs">
                              {link.code}
                            </code>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => copyLink(link.code)}
                              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                                copiedLink === link.code
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                              }`}
                            >
                              {copiedLink === link.code ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </motion.button>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <MousePointer className="w-4 h-4" />
                            <span className="font-medium">{link.clicks}</span>
                            <span className="text-gray-600">clicks</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-medium text-emerald-400">{link.conversions}</span>
                            <span className="text-gray-600">convs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
