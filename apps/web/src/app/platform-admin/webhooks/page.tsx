'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Webhook, RefreshCw, AlertTriangle, CheckCircle2, Clock, RotateCcw, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

interface WebhookEvent {
  id: string;
  gateway: string;
  eventName: string;
  reference: string | null;
  status: string;
  error: string | null;
  replayCount: number;
  lastReplayAt: string | null;
  lastReplayStatus: string | null;
  createdAt: string;
  payload: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  duplicate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ignored: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  processing: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export default function AdminWebhooks() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('');
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const fetchEvents = async (status?: string) => {
    setLoading(true);
    try {
      const q = status && status !== 'all' ? `?status=${status}` : '';
      const data = await api.get<WebhookEvent[]>(`/api/admin/webhooks${q}`);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load webhook events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleReplay = async (event: WebhookEvent) => {
    if (!confirm(`Re-run this ${event.gateway} "${event.eventName}" webhook through the normal handler?\n\nNew transactions/licenses will be created just like the original delivery.`)) return;
    setReplayingId(event.id);
    try {
      const result = await api.post<any>(`/api/admin/webhooks/${event.id}/replay`);
      setNotice(`Replay finished: ${result?.status || 'success'}`);
      setTimeout(() => setNotice(''), 4000);
      fetchEvents(filter && filter !== 'all' ? filter : undefined);
    } catch (err: any) {
      setNotice(`Replay failed: ${err.message}`);
      setTimeout(() => setNotice(''), 6000);
      fetchEvents(filter && filter !== 'all' ? filter : undefined);
    } finally {
      setReplayingId(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const counts = {
    all: events.length,
    processed: events.filter((e) => e.status === 'processed').length,
    failed: events.filter((e) => e.status === 'failed').length,
    duplicate: events.filter((e) => e.status === 'duplicate').length,
    ignored: events.filter((e) => e.status === 'ignored').length,
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhook Events</h1>
          <p className="text-gray-500 mt-1">Every gateway callback received, with one-click replay for missed or mis-processed events</p>
        </div>
        <button
          onClick={() => fetchEvents(filter && filter !== 'all' ? filter : undefined)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm flex items-center gap-2 border ${
            notice.startsWith('Replay failed')
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          {notice.startsWith('Replay failed') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {notice}
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {(['all', 'processed', 'failed', 'duplicate', 'ignored'] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              fetchEvents(s);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              (filter === s || (filter === '' && s === 'all'))
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-xs">{counts[s]}</span>
          </button>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading webhook events...</div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <Webhook className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No webhook events received yet.</p>
            <p className="text-gray-600 text-sm mt-1">Gateway callbacks will appear here (Paystack / Flutterwave).</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#090910]/50">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Event</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Reference</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Replays</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Received</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {events.map((event) => (
                  <motion.tr
                    key={event.id}
                    className="hover:bg-white/[0.02] transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${
                          event.gateway === 'paystack'
                            ? 'bg-sky-500/10 border-sky-500/20'
                            : 'bg-violet-500/10 border-violet-500/20'
                        }`}>
                          <DollarSign className={`w-3.5 h-3.5 ${event.gateway === 'paystack' ? 'text-sky-400' : 'text-violet-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {event.gateway}
                            <span className="text-gray-500 font-normal"> · {event.eventName}</span>
                          </p>
                          <button
                            onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                            className="text-[10px] text-gray-600 hover:text-emerald-400 transition-colors"
                          >
                            {expandedId === event.id ? 'Hide payload' : 'View payload'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-400">{event.reference || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_STYLES[event.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {event.status === 'failed' ? <AlertTriangle className="w-3 h-3" /> : event.status === 'processing' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {event.status}
                      </span>
                      {event.error && (
                        <p className="text-[10px] text-red-400 mt-1 truncate max-w-[160px]">{event.error}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{event.replayCount}</span>
                      {event.lastReplayStatus && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${event.lastReplayStatus === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {event.lastReplayStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(event.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleReplay(event)}
                        disabled={replayingId === event.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                        title="Replay this webhook"
                      >
                        {replayingId === event.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        Replay
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {expandedId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Webhook className="w-4 h-4 text-emerald-400" /> Payload
          </h3>
          <pre className="text-xs text-gray-400 font-mono bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4 overflow-x-auto max-h-96">
            {JSON.stringify(events.find((e) => e.id === expandedId)?.payload, null, 2)}
          </pre>
        </motion.div>
      )}
    </motion.div>
  );
}