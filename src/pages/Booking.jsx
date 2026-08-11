import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const passedPackage = location.state?.selectedPackage || null;

  const [chosenPackage, setChosenPackage] = useState(passedPackage);
  const [allPackages, setAllPackages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_date: '',
    event_city: 'الرياض',
    notes: ''
  });

  const generateBookingCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomStr = () => Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `#ZP-${randomStr()}-${randomStr()}`;
  };

  // دالة إرسال الإشعار الفوري عبر OneSignal REST API بأمان باستخدام ملف .env
  const sendBookingNotification = async (clientName, packageName) => {
    try {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}`
        },
        body: JSON.stringify({
          app_id: "63ea57dd-4d4a-4a12-acbb-fa0fa5d4c575",
          included_segments: ["All"],
          headings: { en: "حجز جديد📸" },
          contents: { en: `تم استلام حجز جديد من العميل: ${clientName} للباقة: ${packageName}` }
        }),
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // التحقق من تسجيل الدخول وجلب بيانات الحساب تلقائياً
  useEffect(() => {
    async function checkUserAndProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          showError('يجب تسجيل الدخول أولاً لتتمكن من إتمام الحجز.');
          navigate('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setFormData(prev => ({
          ...prev,
          customer_name: profile?.full_name || session.user.user_metadata?.full_name || '',
          customer_email: session.user.email || '',
          customer_phone: profile?.phone || session.user.user_metadata?.phone || ''
        }));

      } catch (err) {
        console.error('Auth Check Error:', err);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkUserAndProfile();
  }, [navigate]);

  // جلب الباقات إذا لم تُمرر من الصفحة السابقة
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
      showError('الرجاء اختيار الباقة المطلوبة أولاً من القائمة الجانبية.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        showError('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى.');
        navigate('/login');
        return;
      }

      const userId = session.user.id;
      const packageName = chosenPackage.name || 'الباقة المختارة';

      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: userId,
            package_name: packageName,      
            package_price: chosenPackage.price,    
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            customer_email: formData.customer_email,
            event_date: formData.event_date,
            event_city: formData.event_city,        
            notes: formData.notes,
            status: 'بانتظار المراجعة',                     
            booking_code: generateBookingCode()      
          }
        ]);

      if (error) throw error;

      // إرسال الإشعار الفوري عبر OneSignal بعد نجاح الحجز مباشرة
      await sendBookingNotification(formData.customer_name, packageName);

      showSuccess(`شكراً لك! تم رفع طلب حجز (${packageName}) بنجاح. 🎉`);
      navigate('/my-account'); 
    } catch (err) {
      console.error('Booking Error:', err);
      showError('حدث خطأ أثناء حفظ الحجز: ' + (err.message || 'يرجى المحاولة مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <Layout>
        <div className="text-center py-20 text-brand-main font-bold">جاري التحقق من الحساب الشخصي...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-brand-main mb-2">تأكيد حجز باقتك</h2>
          <p className="text-brand-muted text-sm">بياناتك مسجلة تلقائياً من حسابك الشخصي لضمان توثيق الحجز الرقمي الموثق</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1 bg-brand-card border border-brand rounded-2xl p-6 sticky top-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-brand-muted border-b border-brand pb-3 mb-4">الباقة المختارة حالياً</h3>
            
            {chosenPackage ? (
              <div className="relative z-10">
                <h4 className="text-xl font-black text-brand-main mb-1">{chosenPackage.name}</h4>
                <p className="text-2xl font-black text-brand-main mb-4">{Number(chosenPackage.price).toLocaleString()} ر.س</p>
                <p className="text-xs text-brand-muted leading-5 mb-4 line-clamp-4">{chosenPackage.description}</p>
                
                <button 
                  type="button"
                  onClick={() => setChosenPackage(null)}
                  className="w-full bg-brand-main border border-brand hover:border-red-400 text-brand-muted hover:text-red-600 text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                >
                  تغيير الباقة المختارة
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-2">الرجاء اختيار الباقة من القائمة:</label>
                <select 
                  onChange={(e) => {
                    const pkg = allPackages.find(p => p.id === e.target.value);
                    if (pkg) setChosenPackage(pkg);
                  }}
                  className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl text-sm focus:outline-none cursor-pointer"
                >
                  <option value="">-- اختر الباقة المطلوبة --</option>
                  {allPackages.map(p => <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString()} ر.س)</option>)}
                </select>
              </div>
            )}
            
            <div 
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, var(--brand-card), transparent)'
              }}
            ></div>
          </div>

          <div className="md:col-span-2 bg-brand-card border border-brand rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
            <h3 className="text-lg font-bold text-brand-main mb-6 flex items-center gap-2">
              <span className="text-brand-main">✦</span> معلومات الحجز والاتصال
            </h3>

            <form onSubmit={handleBookingSubmit} className="space-y-5">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1.5">اسم العميل (صاحب الحجز)</label>
                <input 
                  type="text" 
                  disabled
                  value={formData.customer_name}
                  className="w-full bg-brand-main/50 border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm cursor-not-allowed opacity-80"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1.5">رقم الجوال الأساسي</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="05XXXXXXXX" 
                    dir="ltr"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1.5">البريد الإلكتروني (الحساب)</label>
                  <input 
                    type="email" 
                    disabled
                    value={formData.customer_email}
                    className="w-full bg-brand-main/50 border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm text-left cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1.5">تاريخ المناسبة / الحفل</label>
                  <input 
                    type="date" 
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                    className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-brand-muted text-xs font-semibold mb-1.5">مدينة المناسبة</label>
                  <select 
                    value={formData.event_city}
                    onChange={(e) => setFormData({...formData, event_city: e.target.value})}
                    className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="الرياض">الرياض</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1.5">ملاحظات أو تفاصيل خاصة (اختياري)</label>
                <textarea 
                  rows="3" 
                  placeholder="أذكر لنا هنا اسم القاعة، أو أي تفاصيل أو شروط خاصة ترغب بإطلاع طاقم التصوير عليها..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm resize-none"
                ></textarea>
              </div>

              <div className="bg-brand-main/60 border border-brand p-4 rounded-xl text-xs text-brand-muted flex items-center justify-between gap-3">
                <span>يرجى قراءة السياسات والشروط والأحكام بعناية قبل تأكيد الحجز.</span>
                <Link 
                  to="/policies" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold text-brand-main underline hover:text-brand-accent transition-colors shrink-0"
                >
                  صفحة السياسات 📋
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading || !chosenPackage}
                className="w-full bg-brand-btn disabled:opacity-50 text-brand-main font-bold p-4 rounded-xl text-sm transition-all shadow-lg hover:scale-[1.01]"
              >
                {loading ? 'جاري توثيق وتأكيد حجزك الفاخر...' : `تأكيد طلب حجزك ${chosenPackage ? chosenPackage.name : 'الباقة'}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}