import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import emailAdminApi from '@/modules/booking/api/emailAdminApi';
import Button from '@/shared/components/ui/Button';

const TYPE_LABEL = { INVITATION: 'Invitation', RESCHEDULE: 'Reschedule', CANCELLATION: 'Cancellation' };

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Addis_Ababa',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const EmailLogPanel = () => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailAdminApi.getEmailLogs({ page, size: 15, status, search: query });
      setRows(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotal(data.totalElements || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load the email log.');
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(0); setQuery(search.trim()); }}
          className="relative w-full sm:w-96"
        >
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search guest name, email, booking code, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none"
          />
        </form>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}
            className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
          >
            <option value="">All results</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <Button variant="ghost" size="sm" onClick={load} icon={RefreshCw}>Refresh</Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <th className="py-2.5 pl-4">When (EAT)</th>
              <th className="py-2.5 px-3">Guest</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Meeting</th>
              <th className="py-2.5 px-3">Sent by</th>
              <th className="py-2.5 pr-4">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">No emails logged yet.</td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="py-2.5 pl-4 whitespace-nowrap text-slate-600">{formatDate(r.createdAt)}</td>
                <td className="py-2.5 px-3">
                  <p className="font-semibold text-slate-800">{r.recipientName || '—'}</p>
                  <p className="font-mono text-[11px] text-slate-500">{r.recipientEmail}</p>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#00adef] font-bold text-[11px]">
                    {TYPE_LABEL[r.emailType] || r.emailType}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <p className="font-semibold text-slate-800">{r.meetingTitle || '—'}</p>
                  <p className="text-[11px] text-slate-500">{r.roomName} · <span className="font-mono">{r.bookingCode}</span></p>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{r.triggeredBy || 'system'}</td>
                <td className="py-2.5 pr-4">
                  {r.status === 'SENT' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-start gap-1 text-rose-700 font-bold" title={r.errorMessage || ''}>
                      <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Failed
                        {r.errorMessage && (
                          <span className="block font-normal text-[10px] text-rose-600 max-w-[220px] truncate">{r.errorMessage}</span>
                        )}
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{total} email{total === 1 ? '' : 's'} logged</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
};

export default EmailLogPanel;
