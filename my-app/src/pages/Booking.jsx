import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts'; // 👈 استيراد نظام الإشعارات الفاخر

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  // استقبال الباقة الممررة من الصفحة الرئيسية
  const passedPackage = location.state?.selectedPackage || null;

  const [chosenPackage, setChosenPackage] = useState(passedPackage);
  const [allPackages, setAllPackages] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_date: '',
    event_city: 'الرياض',
    notes: ''
  });

  // دالة توليد رقم الحجز الفريد (إضافة الميزة)
  const generateBookingCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomStr = () => Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `#ZP-${randomStr()}-${randomStr()}`;
  };

  useEffect(() => {
    if (!chosenPackage) {
      async function fetchPackages() {
        const { data } = await supabase.from('packages').select('*').order('price', { ascending: true });
        if (data) setAllPackages(data);
      }
      fetchPackages();
    }
  }, [chosenPackage]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!chosenPackage) {
      showError('الرجاء اختيار الباقة المطلوبة أولاً من القائمة الجانبية.'); // 👈 إشعار خطأ فاخر
      return;
    }

    setLoading(true);

    try {
      // التحقق مما إذا كان العميل مسجل دخول أم زائر (ليتم ربط الـ user_id إن وجد)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // إرسال البيانات بشكل متطابق 100% مع الجدول الجديد في Supabase + إضافة كود الحجز
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: userId,
            package_id: chosenPackage.id,
            package_name: chosenPackage.name,       // توثيق الاسم
            package_price: chosenPackage.price,     // توثيق السعر
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            customer_email: formData.customer_email,
            event_date: formData.event_date,
            event_city: formData.event_city,        // عمود المدينة
            notes: formData.notes,
            status: 'بانتظار المراجعة',                         // الحالة بالعربية
            booking_code: generateBookingCode()      // 👈 رقم الحجز الفريد
          }
        ]);

      if (error) throw error;

      showSuccess(`شكراً لك! تم رفع طلب حجز "${chosenPackage.name}" بنجاح. سيتواصل معك فريقنا قريباً. 🎉`); // 👈 إشعار نجاح فاخر
      navigate('/'); 
    } catch (err) {
      console.error('Booking Error:', err);
      showError('حدث خطأ أثناء حفظ الحجز. يرجى المحاولة مرة أخرى.'); // 👈 إشعار خطأ فاخر
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-amber-400 mb-2">تأكيد حجز باقتك</h2>
          <p className="text-slate-400 text-sm">أدخل بياناتك الشخصية وتفاصيل ليلة العمر لإتمام الحجز الرقمي الموثق</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* العمود الجانبي: تفاصيل الباقة */}
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 border-b border-slate-800 pb-3 mb-4">الباقة المختارة حالياً</h3>
            
            {chosenPackage ? (
              <div>
                <h4 className="text-xl font-black text-white mb-1">{chosenPackage.name}</h4>
                <p className="text-2xl font-black text-amber-400 mb-4">{Number(chosenPackage.price).toLocaleString()} ر.س</p>
                <p className="text-xs text-slate-400 leading-5 mb-4 line-clamp-4">{chosenPackage.description}</p>
                
                <button 
                  type="button"
                  onClick={() => setChosenPackage(null)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-red-500/30 text-slate-500 hover:text-red-400 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  تغيير الباقة المختارة
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2">الرجاء اختيار الباقة من القائمة:</label>
                <select 
                  onChange={(e) => {
                    const pkg = allPackages.find(p => p.id === e.target.value);
                    if (pkg) setChosenPackage(pkg);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- اختر الباقة المطلوبة --</option>
                  {allPackages.map(p => <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString()} ر.س)</option>)}
                </select>
              </div>
            )}
          </div>

          {/* العمود الأساسي: نموذج المعلومات */}
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <span className="text-amber-400">✦</span> معلومات الحجز والاتصال
            </h3>

            <form onSubmit={handleBookingSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">الاسم بالكامل (صاحب الحجز)</label>
                <input 
                  type="text" required placeholder="مثال: سارة محمد العبدالله"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">رقم الجوال للتواصل وتأكيد العقد</label>
                  <input 
                    type="tel" required placeholder="05XXXXXXXX" dir="ltr"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">البريد الإلكتروني (لإرسال الفاتورة)</label>
                  <input 
                    type="email" required placeholder="name@example.com" dir="ltr"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">تاريخ المناسبة / الحفل</label>
                  <input 
                    type="date" 
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">مدينة المناسبة</label>
                  <select 
                    value={formData.event_city}
                    onChange={(e) => setFormData({...formData, event_city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm cursor-pointer"
                  >
                    <option value="الرياض">الرياض</option>
                    <option value="المزاحمية">المزاحمية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">ملاحظات أو تفاصيل خاصة (اختياري)</label>
                <textarea 
                  rows="3" placeholder="أذكر لنا هنا اسم القاعة، أو أي تفاصيل أو شروط خاصة ترغب بإطلاع طاقم التصوير عليها..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading || !chosenPackage}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 font-bold p-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10 hover:scale-[1.01]"
              >
                {loading ? 'جاري توثيق وتأكيد حجزك الفاخر...' : `تأكيد طلب حجز ${chosenPackage ? chosenPackage.name : 'الباقة'}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}