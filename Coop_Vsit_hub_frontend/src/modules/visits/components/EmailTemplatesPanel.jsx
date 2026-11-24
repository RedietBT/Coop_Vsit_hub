import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import emailAdminApi from '@/modules/booking/api/emailAdminApi';
import Button from '@/shared/components/ui/Button';

const inputCls =
  'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none';

export const EmailTemplatesPanel = () => {
  const [templates, setTemplates] = useState([]);
  const [activeKey, setActiveKey] = useState('GUEST_INVITE');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailAdminApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load email templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = templates.find((t) => t.key === activeKey);

  useEffect(() => {
    if (active) setForm({ ...active });
  }, [active]);

  const isBranding = activeKey === 'BRANDING';

  const handleSave = async () => {
    setSaving(true);
    try {
      await emailAdminApi.saveTemplate(activeKey, form);
      toast.success('Email content saved. New emails will use it right away.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset this email to the built-in default text?')) return;
    try {
      await emailAdminApi.resetTemplate(activeKey);
      toast.success('Reset to defaults.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset.');
    }
  };

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveKey(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeKey === t.key
                ? 'bg-[#00adef] text-white border-[#00adef]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
            {t.customized && <span className="ml-1.5 text-[10px] opacity-80">• edited</span>}
          </button>
        ))}
      </div>

      {loading && !active ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading...</p>
      ) : active ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{active.description}</p>

            {isBranding ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Logo image URL</label>
                  <input
                    type="url"
                    placeholder="https://your-site.com/logo.png"
                    value={form.logoUrl || ''}
                    onChange={set('logoUrl')}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Must be a public https link so it loads in the guest's inbox. Leave empty for no logo.
                  </p>
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="Logo preview" className="mt-2 max-h-12 border border-slate-200 rounded-lg p-1 bg-white" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accent colour</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(form.accentColor || '') ? form.accentColor : '#00adef'}
                      onChange={set('accentColor')}
                      className="h-9 w-12 rounded border border-slate-200 cursor-pointer"
                    />
                    <input type="text" value={form.accentColor || ''} onChange={set('accentColor')} className={`${inputCls} max-w-[140px] font-mono`} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Used for the banner and links. Cancellation emails always stay red.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sign-off (bottom of every email)</label>
                  <textarea rows={4} value={form.signature || ''} onChange={set('signature')} className={inputCls} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject line</label>
                  <input type="text" value={form.subject || ''} onChange={set('subject')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banner headline</label>
                  <input type="text" value={form.headline || ''} onChange={set('headline')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening message</label>
                  <textarea rows={5} value={form.intro || ''} onChange={set('intro')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note under the details table</label>
                  <textarea rows={3} value={form.footerNote || ''} onChange={set('footerNote')} className={inputCls} />
                </div>
              </>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button variant="orange" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} disabled={!active.customized}>
                Reset to default
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {!isBranding && (
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-slate-700">
                <p className="font-bold text-slate-800 mb-1.5">Placeholders</p>
                <p className="text-[11px] text-slate-500 mb-2">
                  Type these in any field above; they are replaced with the real booking details.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(active.placeholders || []).map((p) => (
                    <code key={p} className="px-1.5 py-0.5 rounded bg-white border border-sky-200 text-[11px] text-[#0088cc]">{`{{${p}}}`}</code>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              The details table (meeting, time, venue, location &amp; map link, host, reference), the calendar
              attachment and the "Visit us at…" line are added automatically. Text you write here is plain text;
              line breaks are kept.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EmailTemplatesPanel;
