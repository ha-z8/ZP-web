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

  const getStatusStyle = (status) => {
    const s = (status || '').trim();
    switch (s) {
      case 'بانتظار المراجعة': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'تمت المراجعة': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'مؤكد': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'انتظار الدفع': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'قيد المعالجة': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'تم الرد': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ملغي': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
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
            <h2 className="text-3xl font-black text-white">مركز المتابعة</h2>
            <p className="text-slate-400 mt-2">إدارة الحجوزات ومتابعة سجل الطلبات</p>
          </div>
          <button 
            onClick={handleGlobalRefresh} 
            disabled={isRefreshing} 
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {isRefreshing ? 'جاري التحديث...' : '🔄 تحديث الكل'}
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-500">جاري تحميل البيانات...</div>
        ) : (
          <div className="space-y-12">
            
            {/* قسم الحجوزات */}
            <section>
              <h3 className="text-lg font-bold text-white mb-6">📅 حجوزاتي</h3>
              {data.bookings.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                  <p className="text-slate-500 text-lg">لا توجد حجوزات حالياً</p>
                  <p className="text-slate-600 text-sm mt-2">جميع حجوزاتك ستظهر هنا فور إتمامها</p>
                </div>
              ) : (
                data.bookings.map(b => (
                  <div key={b.id} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 mb-6 hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-2xl text-white">{b.package_name}</h4>
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-sm text-slate-500">كود الحجز:</span>
                          <button onClick={() => copyToClipboard(b.booking_code)} className="font-mono bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-700 text-amber-500 font-bold hover:bg-slate-800 transition-all cursor-pointer">
                            {b.booking_code}
                          </button>
                          {copiedId === b.booking_code && <span className="text-xs text-emerald-500">تم النسخ!</span>}
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${getStatusStyle(b.status)}`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
                       {[ {l:'المدينة', v:b.event_city}, {l:'التاريخ', v:b.event_date}, {l:'العميل', v:b.customer_name}, {l:'الهاتف', v:b.customer_phone} ].map(i => (
                         <div key={i.l} className="flex justify-between border-b border-slate-800/50 pb-2">
                           <span className="text-slate-500 text-sm">{i.l}:</span>
                           <span className="text-slate-200 font-medium text-sm">{i.v}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* قسم الرسائل */}
            <section>
              <h3 className="text-lg font-bold text-blue-400 mb-6">✉️ سجل التواصل والرسائل</h3>
              {data.messages.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-lg">لا توجد سجلات تواصل</p>
                    <p className="text-slate-600 text-sm mt-2">لم تقم بإرسال أي رسائل بعد</p>
                </div>
              ) : (
                data.messages.map(m => (
                  <div key={m.id} className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-slate-200">{m.category}</h4>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyle(m.status)}`}>{m.status}</span>
                    </div>
                    <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 mb-5">
                      <p className="text-sm text-slate-300 leading-relaxed">{m.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {[{l:'الاسم', v:m.client_name}, {l:'الهاتف', v:m.client_phone}, {l:'الإيميل', v:m.client_email}, {l:'التاريخ', v:new Date(m.created_at).toLocaleDateString('ar-SA')}].map(field => (
                          <div key={field.l} className="flex justify-between border-b border-slate-800/50 pb-2">
                              <span className="text-slate-500">{field.l}:</span>
                              <span className="text-slate-200">{field.v}</span>
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