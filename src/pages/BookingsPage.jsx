import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [creatingPaymentFor, setCreatingPaymentFor] = useState(null);
  const [packages, setPackages] = useState([]); // قائمة الباقات الفعلية
  const [searchQuery, setSearchQuery] = useState(''); 
  const [copiedId, setCopiedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // حالات نافذة التعديل الشامل
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // 🎨 ألوان الحالات الأصلية
  const getStatusStyle = (status) => {
    switch (status) {
      case 'بانتظار المراجعة': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'تمت المراجعة': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'مؤكد': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'انتظار الدفع': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'ملغي': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyableText = ({ label, text, id }) => (
    <div 
      onClick={() => copyToClipboard(text, id)}
      className="group cursor-pointer p-3 rounded-xl bg-brand-main border border-brand hover:border-brand-accent transition-all shadow-sm"
    >
      <p className="text-[10px] uppercase text-brand-muted font-bold mb-1">{label}</p>
      <p className={`text-xs font-medium ${copiedId === id ? 'text-brand-main font-bold' : 'text-brand-text'}`}>
        {copiedId === id ? 'تم النسخ!' : (text || 'غير متوفر')}
      </p>
    </div>
  );

  const fetchData = async () => {
    setIsRefreshing(true);
    
    // جلب الحجوزات والباقات معاً
    const [{ data: bookingsData, error: bookingsError }, { data: pkgsData }] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('packages').select('*').order('price', { ascending: true })
    ]);
    
    if (bookingsError) {
      showError('خطأ أثناء جلب الحجوزات');
      console.error(bookingsError);
    } else if (bookingsData) {
      setBookings(bookingsData);
    }

    const { data: payments, error: paymentError } = await supabase.from('booking_payment_requests').select('id,booking_id,amount,currency,payment_url,status,created_at').order('created_at', { ascending: false });
    if (!paymentError) setPaymentRequests(payments || []);
    if (pkgsData) {
      setPackages(pkgsData);
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleCreatePayment = async (booking) => {
    const amount = Number(paymentAmounts[booking.id]);
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000 || Math.round(amount * 100) !== amount * 100) {
      showError('أدخل مبلغاً صحيحاً لا يقل عن ريال واحد');
      return;
    }
    if (!await confirmAction('إنشاء رابط دفع', `إصدار مطالبة دفع بقيمة ${amount.toFixed(2)} ريال للحجز ${booking.booking_code}؟`, 'إنشاء الرابط')) return;
    setCreatingPaymentFor(booking.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('يجب تسجيل الدخول');
      const response = await fetch('/.netlify/functions/create-booking-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ bookingId: booking.id, amount })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل إصدار الرابط');
      await fetchData();
      await navigator.clipboard.writeText(result.paymentUrl);
      showSuccess('تم إنشاء رابط الدفع ونسخه. يمكنك إرساله للعميل.');
    } catch (error) {
      showError(error.message || 'تعذر إنشاء الرابط');
    } finally {
      setCreatingPaymentFor(null);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      showSuccess('تم تحديث الحالة بنجاح');
    } else {
      showError('خطأ أثناء التحديث: ' + error.message);
    }
  };

  // دالة حفظ التعديلات الشاملة للحجز
  const handleSaveFullEdit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          customer_name: editingBooking.customer_name,
          customer_phone: editingBooking.customer_phone,
          customer_email: editingBooking.customer_email,
          package_name: editingBooking.package_name,
          package_price: Number(editingBooking.package_price),
          event_date: editingBooking.event_date,
          event_city: editingBooking.event_city,
          notes: editingBooking.notes
        })
        .eq('id', editingBooking.id)
        .select();

      if (error) throw error;

      setBookings(bookings.map(b => b.id === editingBooking.id ? data[0] : b));
      setIsEditModalOpen(false);
      showSuccess('تم حفظ تعديلات الحجز بنجاح!');
    } catch (err) {
      showError('حدث خطأ أثناء حفظ التعديلات.');
      console.error(err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (await confirmAction('حذف الحجز', 'هل أنت متأكد من حذف هذا الحجز نهائياً؟', 'حذف', true)) {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (!error) {
        setBookings(bookings.filter(b => b.id !== id));
        showSuccess('تم الحذف');
      } else showError('خطأ في الحذف');
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer_phone?.includes(searchQuery)
  );

  useEffect(() => { fetchData(); }, []);

  const statuses = ['بانتظار المراجعة', 'تمت المراجعة', 'مؤكد', 'انتظار الدفع', 'ملغي'];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-brand-main">إدارة الحجوزات</h2>
          
          <input 
            type="text" 
            placeholder="بحث برقم الطلب، الاسم، أو الجوال..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-brand-card border border-brand text-brand-text px-4 py-2 rounded-xl text-sm focus:outline-none shadow-sm"
          />

          <button 
            onClick={fetchData} 
            disabled={isRefreshing}
            className="bg-brand-card hover:bg-brand-card-hover border border-brand text-brand-text px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-brand-card border border-brand rounded-3xl border-dashed shadow-sm">
            <svg className="w-12 h-12 text-brand-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-bold text-brand-main">لا توجد نتائج مطابقة</h3>
          </div>
        ) : (
          <div className="space-y-10">
            {statuses.map((statusName) => {
              const sectionBookings = filteredBookings.filter(b => b.status === statusName);
              
              if (sectionBookings.length === 0) return null;

              return (
                <div key={statusName} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-brand pb-2">
                    <span className={`px-4 py-1 rounded-full text-xs font-black border ${getStatusStyle(statusName)}`}>
                      {statusName} ({sectionBookings.length})
                    </span>
                  </div>

                  <div className="space-y-4">
                    {sectionBookings.map((b) => (
                      <div key={b.id} className="bg-brand-card border border-brand rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="flex flex-wrap justify-between items-center mb-6 border-b border-brand pb-4 gap-4">
                          <div className="flex items-center gap-4">
                             <span className="text-xs text-brand-muted">تاريخ الطلب: {new Date(b.created_at).toLocaleDateString('ar-SA')}</span>
                             <button 
                               onClick={() => copyToClipboard(b.booking_code, `${b.id}-code`)}
                               className="text-[10px] font-bold bg-brand-main text-brand-text px-3 py-1 rounded-full border border-brand hover:bg-brand-card-hover transition-all shadow-sm"
                             >
                                {copiedId === `${b.id}-code` ? 'تم النسخ!' : (b.booking_code || 'بدون كود')}
                             </button>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-wrap">
                            <select value={b.status} onChange={(e) => handleUpdateStatus(b.id, e.target.value)} 
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${getStatusStyle(b.status)}`}>
                              <option value="بانتظار المراجعة">بانتظار المراجعة</option>
                              <option value="تمت المراجعة">تمت المراجعة</option>
                              <option value="مؤكد">مؤكد</option>
                              <option value="انتظار الدفع">انتظار الدفع</option>
                              <option value="ملغي">ملغي</option>
                            </select>

                            {/* زر فتح نافذة التعديل الشامل */}
                            <button 
                              onClick={() => { setEditingBooking(b); setIsEditModalOpen(true); }}
                              className="bg-brand-main hover:bg-brand-card-hover border border-brand text-brand-text px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              تعديل الحجز
                            </button>

                            <button onClick={() => handleDelete(b.id)} className="text-red-700 hover:text-red-800 bg-brand-main px-3 py-1.5 rounded-lg text-xs font-bold border border-brand shadow-sm">حذف</button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-5 gap-4">
                          <CopyableText label="العميل" text={b.customer_name} id={`${b.id}-name`} />
                          <CopyableText label="الباقة والسعر" text={`${b.package_name} (${b.package_price} ر.س)`} id={`${b.id}-pkg`} />
                          <CopyableText label="الهاتف" text={b.customer_phone} id={`${b.id}-phone`} />
                          <CopyableText label="البريد" text={b.customer_email || 'غير متوفر'} id={`${b.id}-email`} />
                          <CopyableText label="التاريخ والمناسبة" text={`${b.event_date} - ${b.event_city}`} id={`${b.id}-date`} />
                        </div>

                        <div className="mt-5 p-4 bg-brand-main rounded-xl border border-brand space-y-3">
                          <h4 className="font-bold text-brand-text text-sm">طلب دفع عبر EdfaPay</h4>
                          <p className="text-xs text-brand-muted">حدد المبلغ المستحق. يظهر رابط الدفع في حساب العميل بعد إنشائه ويمكن نسخه لإرساله خارج الموقع.</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <input type="number" min="1" max="1000000" step="0.01" value={paymentAmounts[b.id] ?? ''} onChange={e => setPaymentAmounts(a => ({...a, [b.id]: e.target.value}))} placeholder="المبلغ بالريال" aria-label="المبلغ بالريال السعودي" className="bg-brand-card border border-brand rounded-lg p-2 text-brand-text w-44 text-sm" />
                            <button disabled={creatingPaymentFor === b.id || b.status === 'ملغي'} onClick={() => handleCreatePayment(b)} className="bg-brand-btn border border-brand rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50">{creatingPaymentFor === b.id ? 'جاري الإنشاء...' : 'إنشاء رابط دفع'}</button>
                          </div>
                          {paymentRequests.filter(p => p.booking_id === b.id).map(p => (
                            <div key={p.id} className="flex gap-3 items-center flex-wrap text-xs border-t border-brand pt-3">
                              <span className="text-brand-text">{Number(p.amount).toFixed(2)} ر.س — {p.status === 'paid' ? 'مدفوع (متحقق)' : p.status === 'link_created' ? 'الرابط جاهز — لم يؤكد الدفع' : p.status}</span>
                              {p.payment_url && <button onClick={() => copyToClipboard(p.payment_url, p.id)} className="underline text-brand-accent">{copiedId === p.id ? 'تم النسخ' : 'نسخ الرابط'}</button>}
                              {p.payment_url && <a href={p.payment_url} target="_blank" rel="noopener noreferrer" className="underline text-brand-accent">فتح صفحة الدفع</a>}
                            </div>
                          ))}
                        </div>

                        {b.notes && (
                          <div className="mt-6 p-4 bg-brand-main rounded-2xl border border-brand cursor-pointer hover:border-brand-accent shadow-sm transition-all" 
                               onClick={() => copyToClipboard(b.notes, `${b.id}-notes`)}>
                            <p className="text-[10px] text-brand-main font-bold mb-1 uppercase">ملاحظات العميل {copiedId === `${b.id}-notes` && '(تم النسخ!)'}</p>
                            <p className="text-sm text-brand-text italic">{b.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* نافذة (Modal) تعديل بيانات الحجز بالكامل */}
      {isEditModalOpen && editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-brand-main mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              تعديل معلومات الحجز بالكامل
            </h3>
            
            <form onSubmit={handleSaveFullEdit} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">اسم العميل</label>
                <input 
                  type="text" 
                  required 
                  value={editingBooking.customer_name || ''} 
                  onChange={(e) => setEditingBooking({...editingBooking, customer_name: e.target.value})} 
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1">رقم الهاتف</label>
                  <input 
                    type="text" 
                    required 
                    value={editingBooking.customer_phone || ''} 
                    onChange={(e) => setEditingBooking({...editingBooking, customer_phone: e.target.value})} 
                    className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={editingBooking.customer_email || ''} 
                    onChange={(e) => setEditingBooking({...editingBooking, customer_email: e.target.value})} 
                    className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1">اختر الباقة</label>
                  <select 
                    required 
                    value={editingBooking.package_name || ''} 
                    onChange={(e) => {
                      const selectedPkgName = e.target.value;
                      const foundPkg = packages.find(p => p.name === selectedPkgName);
                      setEditingBooking({
                        ...editingBooking, 
                        package_name: selectedPkgName,
                        package_price: foundPkg ? foundPkg.price : editingBooking.package_price
                      });
                    }}
                    className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">-- اختر الباقة --</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name} ({Number(pkg.price).toLocaleString()} ر.س)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1">سعر الباقة (ر.س)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingBooking.package_price || ''} 
                    onChange={(e) => setEditingBooking({...editingBooking, package_price: e.target.value})} 
                    className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1">تاريخ المناسبة</label>
                  <input 
                    type="date" 
                    required 
                    value={editingBooking.event_date || ''} 
                    onChange={(e) => setEditingBooking({...editingBooking, event_date: e.target.value})} 
                    className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1">مدينة المناسبة</label>
                  <input 
                    type="text" 
                    required 
                    value={editingBooking.event_city || ''} 
                    onChange={(e) => setEditingBooking({...editingBooking, event_city: e.target.value})} 
                    className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">ملاحظات العميل</label>
                <textarea 
                  rows="3" 
                  value={editingBooking.notes || ''} 
                  onChange={(e) => setEditingBooking({...editingBooking, notes: e.target.value})} 
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingEdit} 
                className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all"
              >
                {submittingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>

              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-full bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all"
              >
                إلغاء
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}