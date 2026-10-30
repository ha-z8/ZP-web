import React,{useCallback,useEffect,useMemo,useState} from 'react';
import AdminLayout from '../components/AdminLayout';
import {supabase} from '../supabase';
import {showError,showSuccess,confirmAction} from '../utils/alerts';

const money=n=>Number(n||0).toLocaleString('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2})+' ر.س';
const date=t=>t?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Riyadh'}).format(new Date(t)):'—';
const labels={paid:'مدفوع ومتحقق',link_created:'رابط جاهز',pending:'جاري الإنشاء',failed:'فشل'};
const csvEscape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';

export default function PaymentOperationsPage(){
 const [payments,setPayments]=useState([]);
 const [bookings,setBookings]=useState([]);
 const [audit,setAudit]=useState([]);
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState('all');
 const [showArchived,setShowArchived]=useState(false);
 const [dateFrom,setDateFrom]=useState('');
 const [dateTo,setDateTo]=useState('');
 const [sortMode,setSortMode]=useState('newest');
 const [onlyOutstanding,setOnlyOutstanding]=useState(false);
 const [search,setSearch]=useState('');
 const [selected,setSelected]=useState(null);
 const [busy,setBusy]=useState(null);
 const [error,setError]=useState('');

 const load=useCallback(async()=>{
  setLoading(true);
  const [p,b,a]=await Promise.all([
   supabase.from('booking_payment_requests').select('id,booking_id,order_id,amount,currency,status,payment_url,created_at,paid_at,transaction_id,hidden_at,archived_at,created_by').order('created_at',{ascending:false}).limit(1000),
   supabase.from('bookings').select('id,booking_code,customer_name,customer_email,customer_phone,package_price,status').limit(1000),
   supabase.from('payment_admin_audit').select('id,payment_request_id,action,reason,actor_id,created_at').order('created_at',{ascending:false}).limit(250)
  ]);
  if(p.error||b.error||a.error){const message=p.error?.message||b.error?.message||a.error?.message||'تعذر تحميل البيانات';setError(message);showError(message)}
  else{setError('');setPayments(p.data||[]);setBookings(b.data||[]);setAudit(a.data||[])}
  setLoading(false);
 },[]);
 useEffect(()=>{load()},[load]);
 const bookingById=useMemo(()=>new Map(bookings.map(b=>[b.id,b])),[bookings]);
 const rows=useMemo(()=>payments.map(p=>({...p,booking:bookingById.get(p.booking_id)})),[payments,bookingById]);
 const stats=useMemo(()=>{
  const confirmed=payments.filter(p=>p.status==='paid');
  return {
   collected:confirmed.reduce((x,p)=>x+Number(p.amount),0),
   outstanding:bookings.reduce((x,b)=>{
    const paid=confirmed.filter(p=>p.booking_id===b.id).reduce((s,p)=>s+Number(p.amount),0);
    return x+Math.max(0,Number(b.package_price||0)-paid);
   },0),
   paid:confirmed.length,
   active:payments.filter(p=>['pending','link_created'].includes(p.status)).length,
   hidden:payments.filter(p=>p.hidden_at).length
  };
 },[payments,bookings]);
 const filtered=useMemo(()=>rows.filter(p=>{
  if(!showArchived&&p.archived_at)return false;
  if(onlyOutstanding&&p.status==='paid')return false;
  if(filter==='archived'&&!p.archived_at)return false;
  if(filter==='hidden'&&!p.hidden_at)return false;
  if(filter==='visible'&&p.hidden_at)return false;
  if(!['all','hidden','visible','archived'].includes(filter)&&p.status!==filter)return false;
  if(dateFrom&&new Date(p.created_at)<new Date(dateFrom+'T00:00:00+03:00'))return false;
  if(dateTo&&new Date(p.created_at)>new Date(dateTo+'T23:59:59+03:00'))return false;
  const b=p.booking||{};
  return [p.order_id,p.transaction_id,b.booking_code,b.customer_name,b.customer_email,b.customer_phone].some(x=>String(x||'').toLowerCase().includes(search.toLowerCase()));
 }).sort((a,b)=>sortMode==='amount_high'?Number(b.amount)-Number(a.amount):sortMode==='amount_low'?Number(a.amount)-Number(b.amount):sortMode==='oldest'?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at)),[rows,filter,search,showArchived,dateFrom,dateTo,sortMode,onlyOutstanding]);
 const copy=async value=>{try{await navigator.clipboard.writeText(value);showSuccess('تم النسخ')}catch{showError('تعذر النسخ')}};
 const share=(p)=>{
  const b=p.booking||{};
  const note='رابط دفع الحجز '+(b.booking_code||'')+' بقيمة '+money(p.amount)+': '+p.payment_url;
  const phone=String(b.customer_phone||'').replace(/\D/g,'');
  const digits=phone.startsWith('0')?'966'+phone.slice(1):phone;
  window.open('https://wa.me/'+(digits||'')+'?text='+encodeURIComponent(note),'_blank','noopener,noreferrer');
 };
 const change=async(p,action)=>{
  const hide=action==='hide_link';
  const archive=action==='archive_link';
  const ok=await confirmAction(archive?'إزالة الرابط من الموقع':action==='unarchive_link'?'استعادة الرابط من الأرشيف':hide?'إخفاء رابط الدفع':'إعادة إظهار الرابط',archive?'سيختفي الرابط من قائمة الموقع وحساب العميل، مع حفظ سجل العملية. الرابط قد يظل صالحًا عند مزود الدفع، ولن يسمح هذا بإنشاء مطالبة جديدة ما دامت المطالبة السابقة نشطة. هل تتابع؟':hide?'هذه العملية تخفي الرابط من حساب العميل فقط ولا تلغيه لدى مزود الدفع، وقد يبقى قابلًا للدفع. هل تريد المتابعة؟':'هل تريد إعادة إظهار رابط الدفع للعميل؟',archive?'إزالة من الموقع':action==='unarchive_link'?'استعادة':'إظهار الرابط');
  if(!ok)return;
  setBusy(p.id);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session)throw new Error('انتهت الجلسة');
   const res=await fetch('/.netlify/functions/manage-payment-request',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({paymentId:p.id,action,reason:archive?'إزالة الرابط من قائمة الموقع':action==='unarchive_link'?'استعادة من الأرشيف':hide?'إخفاء بواسطة المشرف':'استعادة بواسطة المشرف'})});
   const body=await res.json();
   if(!res.ok)throw new Error(body.error||'فشل الإجراء');
   showSuccess(body.message);setSelected(null);await load();
  }catch(err){showError(err.message)}finally{setBusy(null)}
 };
 const exportCsv=()=>{
  const header=['رقم الحجز','رقم الدفع','العميل','المبلغ','العملة','الحالة','مخفي','تاريخ الإنشاء','تاريخ السداد','رقم المعاملة'];
  const content=[header,...filtered.map(p=>[p.booking?.booking_code,p.order_id,p.booking?.customer_name,p.amount,p.currency,p.status,p.hidden_at?'نعم':'لا',p.created_at,p.paid_at,p.transaction_id])].map(r=>r.map(csvEscape).join(',')).join('\r\n');
  const blob=new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='zobaidhphoto-payments.csv';a.click();URL.revokeObjectURL(url);
 };
 return <AdminLayout><div className="max-w-7xl mx-auto py-6 space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black text-brand-main">المركز المالي وإدارة عمليات الدفع</h1><p className="text-sm text-brand-muted mt-2">متابعة المدفوعات والمطالبات والحجوزات وسجل الإجراءات — بتوقيت الرياض</p></div><div className="flex gap-2"><button onClick={load} disabled={loading} className="border border-brand bg-brand-card rounded-xl px-4 py-2 text-sm">تحديث</button><button onClick={exportCsv} className="bg-brand-btn rounded-xl px-4 py-2 text-sm font-bold">تصدير CSV</button></div></header>
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[['المحصّل المؤكد',money(stats.collected)],['المتبقي بالحجوزات',money(stats.outstanding)],['الدفعات المؤكدة',stats.paid],['المطالبات النشطة',stats.active],['الروابط المخفية',stats.hidden]].map(([label,value])=><div key={label} className="bg-brand-card border border-brand rounded-2xl p-4"><p className="text-xs text-brand-muted">{label}</p><p className="text-base md:text-xl font-black text-brand-text mt-2">{value}</p></div>)}</div>
  <label className="flex items-center gap-2 text-xs text-brand-text"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>عرض الروابط المؤرشفة في القوائم</label>
  <p className="text-xs text-brand-muted">الأرقام مبنية على المدفوعات التي أكدها نظام الموقع فقط، وليست كشف تسوية بنكية من مزود الدفع. لا يُسمح بحذف أي عملية مالية مسددة.</p>
  <div className="bg-brand-card border border-brand rounded-2xl p-4 grid sm:grid-cols-[1fr_auto] gap-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث برقم الحجز أو الدفع أو اسم العميل أو الجوال" className="bg-brand-main border border-brand rounded-lg p-3 text-brand-text w-full"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-brand-main border border-brand rounded-lg p-3 text-brand-text"><option value="all">كل العمليات</option><option value="paid">المدفوعة</option><option value="link_created">الروابط الجاهزة</option><option value="pending">قيد الإنشاء</option><option value="failed">الفاشلة</option><option value="hidden">المخفية</option><option value="archived">المؤرشفة</option><option value="visible">الظاهرة</option></select></div>
  <div className="bg-brand-card border border-brand rounded-2xl p-4 flex flex-wrap gap-3 items-end">
    <label className="text-xs text-brand-muted">من تاريخ<input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="block mt-1 bg-brand-main text-brand-text border border-brand rounded-lg p-2"/></label>
    <label className="text-xs text-brand-muted">إلى تاريخ<input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="block mt-1 bg-brand-main text-brand-text border border-brand rounded-lg p-2"/></label>
    <label className="text-xs text-brand-muted">ترتيب العمليات<select value={sortMode} onChange={e=>setSortMode(e.target.value)} className="block mt-1 bg-brand-main text-brand-text border border-brand rounded-lg p-2"><option value="newest">الأحدث</option><option value="oldest">الأقدم</option><option value="amount_high">المبلغ الأعلى</option><option value="amount_low">المبلغ الأقل</option></select></label>
    <label className="flex items-center gap-2 text-xs text-brand-text"><input type="checkbox" checked={onlyOutstanding} onChange={e=>setOnlyOutstanding(e.target.checked)}/>العمليات غير المدفوعة فقط</label>
    <button onClick={()=>{setOnlyOutstanding(false);setDateFrom('');setDateTo('');setSearch('');setFilter('all');setShowArchived(false);setSortMode('newest')}} className="border border-brand rounded-lg px-4 py-2 text-xs">إعادة ضبط الفلاتر</button>
    <div className="mr-auto text-sm text-brand-text font-bold">النتائج: {filtered.length} — إجمالي مبالغ النتائج: {money(visibleTotal)}</div>
  </div>
  {error&&<p className="text-red-600 text-sm" role="alert">{error}</p>}
  {loading?<p className="text-brand-muted">جاري تحميل العمليات...</p>:<div className="space-y-3">{filtered.map(p=><article key={p.id} className="bg-brand-card border border-brand rounded-2xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
   <div className="space-y-1 min-w-0"><h3 className="font-bold text-brand-text">{p.booking?.customer_name||'حجز غير معروف'} <span className="text-xs text-brand-muted">— {p.booking?.booking_code}</span></h3><p className="text-xs text-brand-muted break-all" dir="ltr">{p.order_id}</p><p className="text-sm">{money(p.amount)} — {labels[p.status]||p.status} {p.archived_at?'— مؤرشف':p.hidden_at?'— مخفي عن العميل':''}</p><p className="text-xs text-brand-muted">{date(p.created_at)} (الرياض)</p></div>
   <button onClick={()=>setSelected(p)} className="bg-brand-btn px-4 py-2 rounded-xl font-bold text-sm shrink-0">عرض وإدارة</button>
  </article>)}{filtered.length===0&&<p className="text-center text-brand-muted py-10">لا توجد عمليات مطابقة</p>}</div>}
  <section className="bg-brand-card border border-brand rounded-2xl p-5"><h2 className="font-bold text-brand-main mb-3">سجل إجراءات الإدارة</h2>{audit.length===0?<p className="text-xs text-brand-muted">لا توجد إجراءات مسجلة.</p>:<div className="space-y-2">{audit.slice(0,25).map(a=><div key={a.id} className="text-xs border-b border-brand py-2 text-brand-muted">{a.action==='hide_link'?'إخفاء رابط':a.action==='archive_link'?'إزالة رابط':a.action==='unarchive_link'?'استعادة من الأرشيف':'استعادة رابط'} — {date(a.created_at)} — {a.payment_request_id}</div>)}</div>}</section>
  {selected&&<div role="dialog" aria-modal="true" aria-label="إدارة معاملة الدفع" className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-3" dir="rtl"><div className="bg-brand-card border border-brand rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3 shadow-2xl"><div className="flex justify-between"><h2 className="text-xl font-black">تفاصيل عملية الدفع</h2><button onClick={()=>setSelected(null)} className="border border-brand rounded-lg px-3 py-1">إغلاق</button></div>
  {[['رقم الحجز',selected.booking?.booking_code],['رقم معاملة مزود الدفع',selected.order_id],['اسم العميل',selected.booking?.customer_name],['المبلغ',money(selected.amount)],['الحالة',labels[selected.status]||selected.status],['إصدار الرابط',date(selected.created_at)],['تاريخ السداد',date(selected.paid_at)],['رقم العملية لدى البوابة',selected.transaction_id||'—'],['ظهور الرابط',selected.archived_at?'مؤرشف':selected.hidden_at?'مخفي':'ظاهر']].map(([k,v])=><div className="flex justify-between gap-3 text-sm border-b border-brand py-2" key={k}><span className="text-brand-muted shrink-0">{k}</span><span className="text-brand-text break-all text-left">{v}</span></div>)}
  {selected.booking?.customer_phone&&<button onClick={()=>copy(selected.booking.customer_phone)} className="border border-brand rounded-lg px-4 py-2 text-xs">نسخ جوال العميل</button>}
  {selected.payment_url&&<div className="grid grid-cols-2 gap-2"><button onClick={()=>copy(selected.payment_url)} className="border border-brand rounded-lg py-2 text-sm">نسخ الرابط</button><button onClick={()=>share(selected)} className="border border-brand rounded-lg py-2 text-sm">إرسال عبر واتساب</button><a href={selected.payment_url} target="_blank" rel="noopener noreferrer" className="text-center border border-brand rounded-lg py-2 text-sm">فتح الرابط</a><button onClick={()=>copy(selected.order_id)} className="border border-brand rounded-lg py-2 text-sm">نسخ رقم العملية</button></div>}
  {selected.status!=='paid'&&<button disabled={busy===selected.id} onClick={()=>change(selected,selected.archived_at?'unarchive_link':'archive_link')} className="w-full bg-brand-btn rounded-xl p-3 font-bold">{selected.archived_at?'استعادة الرابط من الأرشيف':'إزالة الرابط من قائمة الموقع'}</button>}
  {selected.status!=='paid'&&!selected.archived_at&&<button disabled={busy===selected.id} onClick={()=>change(selected,selected.hidden_at?'restore_link':'hide_link')} className="w-full border border-brand rounded-xl p-3 font-bold">{selected.hidden_at?'استعادة إظهار الرابط':'إخفاء الرابط عن العميل'}</button>}
  <p className="text-xs text-brand-muted leading-6">إخفاء الرابط لا يلغيه لدى مزود الدفع ولا يضمن إيقاف التحصيل. لا يوجد حذف نهائي للسجلات المالية، والاسترداد والإلغاء الفعلي يتطلبان إجراءً مستقلًا لدى مزود الدفع بعد التحقق.</p>
  </div></div>}
 </div></AdminLayout>;
}