import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { showError, showSuccess } from '../utils/alerts';

export default function PaymentRequestModal({ customer, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [payments, setPayments] = useState([]);
  const [mode, setMode] = useState('deposit');
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    let current = true;
    async function load() {
      const query = supabase.from('bookings').select('id,booking_code,package_name,package_price,status').eq('user_id', customer.id).order('created_at', {ascending: false});
      const { data, error } = await query;
      if (!current) return;
      if (error) showError('تعذر جلب حجوزات العميل');
      setBookings((data || []).filter(x => x.status !== 'ملغي'));
      if (data?.length) setBookingId(data.find(x => x.status !== 'ملغي')?.id || '');
    }
    load();
    return () => { current = false; };
  }, [customer.id]);

  useEffect(() => {
    let current = true;
    setLink('');
    setPayments([]);
    if (bookingId) supabase.from('booking_payment_requests').select('amount,status,payment_url,created_at').eq('booking_id',bookingId).order('created_at',{ascending:false}).then(({data,error}) => {
      if (!current) return;
      if (error) showError('تعذر قراءة طلبات الدفع');
      else setPayments(data || []);
    });
    return () => {current=false;};
  }, [bookingId]);

  const selected = bookings.find(x => x.id === bookingId);
  const total = Math.round(Number(selected?.package_price || 0) * 100);
  const paid = payments.filter(x => x.status === 'paid').reduce((s,x)=>s+Math.round(Number(x.amount)*100),0);
  const remaining = Math.max(0,total-paid);
  const active = payments.find(x=>['pending','link_created'].includes(x.status));
  const amountCents = mode === 'full' ? remaining : mode === 'half' ? Math.ceil(remaining/2) : mode === 'deposit' ? Math.min(remaining,Math.max(100,Math.round(total*.25))) : Math.round(Number(custom)*100);
  const amount = amountCents/100;

  const create = async () => {
    if (!selected || !Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > remaining) return showError('المبلغ غير صحيح أو أكبر من المتبقي');
    setLoading(true);
    try {
      const {data:{session}} = await supabase.auth.getSession();
      if (!session) throw new Error('يرجى إعادة تسجيل الدخول');
      const response = await fetch('/.netlify/functions/create-booking-payment', {method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({bookingId,amount})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعذر إنشاء الرابط');
      setLink(result.paymentUrl);
      const {data} = await supabase.from('booking_payment_requests').select('amount,status,payment_url,created_at').eq('booking_id',bookingId).order('created_at',{ascending:false});
      setPayments(data || []);
      showSuccess('رابط الدفع جاهز ويمكن نسخه أو مشاركته');
    } catch (e) {showError(e.message)} finally {setLoading(false)}
  };
  const copy = async url => {try {await navigator.clipboard.writeText(url);showSuccess('تم نسخ رابط الدفع')}catch {showError('تعذر النسخ')}};
  const share = url => {
    const message = 'رابط سداد حجز zobaidhphoto: '+url;
    const phone = String(customer.phone||'').replace(/\D/g,'');
    window.open(phone ? 'https://wa.me/'+(phone.startsWith('0')?'966'+phone.slice(1):phone)+'?text='+encodeURIComponent(message) : 'https://wa.me/?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
  };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65" dir="rtl" role="dialog" aria-modal="true" aria-label="إدارة طلبات الدفع">
    <div className="bg-brand-card border border-brand rounded-3xl p-5 sm:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-black text-xl text-brand-main">إصدار رابط دفع</h3><button onClick={onClose} className="text-brand-muted border border-brand rounded-lg px-3 py-1" aria-label="إغلاق">✕</button></div>
      <p className="text-sm text-brand-muted">العميل: {customer.full_name}</p>
      <label className="block text-sm font-bold text-brand-text">الحجز
        <select className="w-full mt-2 p-3 rounded-lg border border-brand bg-brand-main text-brand-text" value={bookingId} onChange={e=>setBookingId(e.target.value)}>
          <option value="">اختر الحجز</option>{bookings.map(b=><option key={b.id} value={b.id}>{b.booking_code} — {b.package_name}</option>)}
        </select>
      </label>
      {selected ? <>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-brand-main rounded-lg p-3"><p className="text-brand-muted">الإجمالي</p><b>{(total/100).toFixed(2)}</b></div>
          <div className="bg-brand-main rounded-lg p-3"><p className="text-brand-muted">المدفوع</p><b>{(paid/100).toFixed(2)}</b></div>
          <div className="bg-brand-main rounded-lg p-3"><p className="text-brand-muted">المتبقي</p><b>{(remaining/100).toFixed(2)}</b></div>
        </div>
        <label className="block text-sm text-brand-text font-bold">نوع الدفعة
          <select className="w-full mt-2 p-3 rounded-lg bg-brand-main border border-brand" value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="deposit">عربون 25% من إجمالي الحجز</option><option value="half">نصف المبلغ المتبقي</option><option value="full">المبلغ المتبقي كاملًا</option><option value="custom">مبلغ مخصص</option>
          </select>
        </label>
        {mode==='custom' && <input type="number" min="1" step="0.01" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="المبلغ بالريال" className="w-full p-3 bg-brand-main border border-brand rounded-lg" />}
        <p className="font-bold text-brand-main">المبلغ المطلوب: {Number.isFinite(amount)?amount.toFixed(2):'—'} ريال</p>
        {active && <p className="text-sm text-amber-600">توجد مطالبة نشطة لهذا الحجز. لا تنشئ مطالبة أخرى حتى تتم تسويتها.</p>}
        <button disabled={loading||!!active||remaining===0} onClick={create} className="w-full bg-brand-btn py-3 rounded-xl font-bold disabled:opacity-50">{loading?'جارٍ إنشاء الرابط...':'إنشاء رابط دفع'}</button>
        {(link||active?.payment_url)&&<div className="flex flex-wrap gap-2">
          <button onClick={()=>copy(link||active.payment_url)} className="px-3 py-2 rounded-lg border border-brand text-brand-text">نسخ الرابط</button>
          <button onClick={()=>share(link||active.payment_url)} className="px-3 py-2 rounded-lg border border-brand text-brand-text">إرساله عبر واتساب</button>
          <a href={link||active.payment_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg border border-brand text-brand-text">فتح الرابط</a>
        </div>}
        <p className="text-xs text-brand-muted">لا يُثبت السداد إلا بعد التحقق من البوابة. لا تشارك روابط الدفع قبل اكتمال اختبارات الإنتاج.</p>
      </>:<p className="text-brand-muted text-sm">لا توجد حجوزات متاحة لهذا المستخدم.</p>}
    </div>
  </div>;
}
