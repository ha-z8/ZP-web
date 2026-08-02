import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import Layout from '../components/Layout';

export default function MyAccount() {
  const [data, setData] = useState({ bookings: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 🎨 ألوان الحالات الأصلية كما طلبت
  const getStatusStyle = (status) => {
    const s = (status || '').trim();
    switch (s) {
      case 'بانتظار المراجعة': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'تمت المراجعة': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'مؤكد': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'انتظار الدفع': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'قيد المعالجة': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'تم الرد': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'ملغي': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const loadAllData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [bookingsRes, messagesRes] = await Promise.all([
      supabase.from('bookings').select('*').or(`user_id.eq.${user.id},customer_email.eq.${user.email}`).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);
    setData({ bookings: bookingsRes.data || [], messages: messagesRes.data || [] });
  }, []);

  useEffect(() => {
    async function init() { await loadAllData(); setLoading(false); }
    init();
  }, [loadAllData]);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div className="text-right">
            <h2 className="text-3xl font-black text-brand-main">مركز المتابعة</h2>
            <p className="text-brand-muted mt-2">إدارة الحجوزات ومتابعة سجل الطلبات</p>
          </div>
          <button 
            onClick={handleGlobalRefresh} 
            disabled={isRefreshing} 
            className="bg-brand-card hover:bg-brand-card-hover text-brand-text border border-brand px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isRefreshing ? 'جاري التحديث...' : '🔄 تحديث الكل'}
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 text-brand-muted">جاري تحميل البيانات...</div>
        ) : (
          <div className="space-y-12">
            
            {/* قسم الحجوزات */}
            <section>
              <h3 className="text-lg font-bold text-brand-main mb-6">📅 حجوزاتي</h3>
              {data.bookings.length === 0 ? (
                <div className="bg-brand-card border border-brand border-dashed rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-brand-muted text-lg">لا توجد حجوزات حالياً</p>
                  <p className="text-brand-muted text-sm mt-2">جميع حجوزاتك ستظهر هنا فور إتمامها</p>
                </div>
              ) : (
                data.bookings.map(b => (
                  <div key={b.id} className="bg-brand-card p-6 rounded-2xl border border-brand mb-6 shadow-xl transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-2xl text-brand-main">{b.package_name}</h4>
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-sm text-brand-muted">كود الحجز:</span>
                          <button onClick={() => copyToClipboard(b.booking_code)} className="font-mono bg-brand-main px-4 py-1.5 rounded-lg border border-brand text-brand-text font-bold hover:bg-brand-card-hover transition-all cursor-pointer shadow-sm">
                            {b.booking_code}
                          </button>
                          {copiedId === b.booking_code && <span className="text-xs text-brand-main font-bold">تم النسخ!</span>}
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${getStatusStyle(b.status)}`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-main p-6 rounded-xl border border-brand">
                       {[ {l:'المدينة', v:b.event_city}, {l:'التاريخ', v:b.event_date}, {l:'العميل', v:b.customer_name}, {l:'الهاتف', v:b.customer_phone} ].map(i => (
                          <div key={i.l} className="flex justify-between border-b border-brand pb-2">
                             <span className="text-brand-muted text-sm">{i.l}:</span>
                             <span className="text-brand-text font-medium text-sm">{i.v}</span>
                          </div>
                       ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* قسم الرسائل */}
            <section>
              <h3 className="text-lg font-bold text-brand-main mb-6">✉️ سجل التواصل والرسائل</h3>
              {data.messages.length === 0 ? (
                <div className="bg-brand-card border border-brand border-dashed rounded-2xl p-12 text-center shadow-sm">
                    <p className="text-brand-muted text-lg">لا توجد سجلات تواصل</p>
                    <p className="text-brand-muted text-sm mt-2">لم تقم بإرسال أي رسائل بعد</p>
                </div>
              ) : (
                data.messages.map(m => (
                  <div key={m.id} className="bg-brand-card p-6 rounded-2xl border border-brand mb-6 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-brand-main">{m.category}</h4>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyle(m.status)}`}>{m.status}</span>
                    </div>
                    <div className="bg-brand-main p-5 rounded-xl border border-brand mb-5">
                      <p className="text-sm text-brand-text leading-relaxed">{m.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {[{l:'الاسم', v:m.client_name}, {l:'الهاتف', v:m.client_phone}, {l:'الإيميل', v:m.client_email}, {l:'التاريخ', v:new Date(m.created_at).toLocaleDateString('ar-SA')}].map(field => (
                          <div key={field.l} className="flex justify-between border-b border-brand pb-2">
                              <span className="text-brand-muted">{field.l}:</span>
                              <span className="text-brand-text">{field.v}</span>
                          </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
            
          </div>
        )}
      </div>
    </Layout>
  );
}