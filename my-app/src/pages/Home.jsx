import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts';
import zLogo from '../assets/z-logo.png'; // أضف هذا السطر

export default function Home() {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [photosPage, setPhotosPage] = useState(0);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PHOTOS_PER_PAGE = 8;

  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', type: 'استفسار', message: '' });
  const [comparePkg1, setComparePkg1] = useState('');
  const [comparePkg2, setComparePkg2] = useState('');

  // 👈 الحالة الجديدة لعرض الصورة بملء الشاشة
  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const { data: pkgs } = await supabase.from('packages').select('*').order('price', { ascending: true });
        if (pkgs) setPackages(pkgs);

        // 👈 ترتيب الصور بناءً على عمود sort_order
        const { data: photos } = await supabase
          .from('album_photos')
          .select('*')
          .range(0, PHOTOS_PER_PAGE - 1)
          .order('sort_order', { ascending: true }); 

        if (photos && photos.length > 0) {
          setPortfolioPhotos(photos);
          if (photos.length < PHOTOS_PER_PAGE) setHasMorePhotos(false);
        } else {
          setHasMorePhotos(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  const loadMorePhotos = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = photosPage + 1;
    const fromIndex = nextPage * PHOTOS_PER_PAGE;
    const toIndex = fromIndex + PHOTOS_PER_PAGE - 1;

    try {
      const { data: newPhotos, error } = await supabase
        .from('album_photos')
        .select('*')
        .range(fromIndex, toIndex)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (newPhotos && newPhotos.length > 0) {
        setPortfolioPhotos(prev => [...prev, ...newPhotos]);
        setPhotosPage(nextPage);
        if (newPhotos.length < PHOTOS_PER_PAGE) setHasMorePhotos(false);
      } else {
        setHasMorePhotos(false);
      }
    } catch (err) {
      console.error('Error loading more photos:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    // 1. التحقق من تسجيل الدخول (لضمان وجود user_id)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      showError('يجب تسجيل الدخول أولاً لإرسال رسالة تواصل.');
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase.from('expenses').insert([{
        category: `رسالة تواصل - ${contactForm.type}`,
        description: contactForm.message,
        client_name: contactForm.name,
        // 👈 التعديل هنا: نستخدم الإيميل الذي أدخله العميل في النموذج
        client_email: contactForm.email, 
        client_phone: contactForm.phone,
        user_id: user.id // نحتفظ بالربط بالحساب حتى لو تغير الإيميل
      }]);
      
      if (error) throw error;
      showSuccess('تم إرسال رسالتك بنجاح! سيتواصل معك فريق استوديو لوميير قريباً. 🎉');
      setContactForm({ name: '', email: '', phone: '', type: 'استفسار', message: '' });
    } catch (err) {
      showError('حدث خطأ أثناء محاولة إرسال الرسالة، يرجى إعادة المحاولة.');
    }
  };

  const selectedPkg1 = packages.find(p => p.id === comparePkg1);
  const selectedPkg2 = packages.find(p => p.id === comparePkg2);

  return (
    <Layout>
      {/* 👈 نافذة العرض السينمائي بملء الشاشة */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-pointer" 
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-white bg-slate-800 hover:bg-red-500 rounded-full w-10 h-10 flex items-center justify-center transition-all text-xl z-50">✕</button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen Masterpiece" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl animate-fadeIn" 
            onClick={(e) => e.stopPropagation()} // منع الإغلاق عند النقر على الصورة نفسها
          />
        </div>
      )}

      {/* المربع الترحيبي الأصلي */}
      <div className="text-center py-20 bg-gradient-to-b from-slate-900 to-transparent rounded-3xl p-8 mb-16 border border-slate-800 shadow-2xl">
        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent">
          نوثّق ليلة عمركم الساحرة بجودة عالية
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            في zobaidhphoto، نلتقط أجمل اللحظات من يوم زفافكم بأسلوب عالي الجودة وفريد. دعونا نروي قصتكم بحرفية وإبداع لا مثيل لهما.
        </p>
        <button onClick={() => navigate('/booking')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-lg font-bold px-8 py-4 rounded-xl hover:scale-105 shadow-xl shadow-orange-500/20 transition-all">
          احجز باقتك الآن
        </button>
      </div>

      {/* قسم التعريف */}
      <section className="mb-24 max-w-5xl mx-auto px-4 grid md:grid-cols-2 items-center gap-12">
        <div className="text-right order-2 md:order-1">
          <h3 className="text-2xl md:text-3xl font-bold text-amber-400 mb-4">من انا وماذا اقدم؟</h3>
          <p className="text-slate-300 text-base md:text-lg leading-8">
          المصوره السعوديه <span className="text-amber-400 font-bold">زُبيده عبدالعزيز</span> تخصصها في مجال تصوير الاعراس لتكون جزءاً مهماً في ليلة عمر العروسين وتوثيق التفاصيل بكل مافيها من مشاعر بإحترافيه بخدمة التصوير الفوتوغرافي والفيديو
          </p>
        </div>

        <div className="flex justify-center order-1 md:order-2">
          <div className="relative w-full max-w-[320px] aspect-square group">
            <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
            <img 
              src={zLogo} 
              alt="Lumière Studio Logo" 
              className="relative w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* قسم الباقات الحصرية */}
      <section className="mb-20">
        <div className="flex justify-between items-center mb-8 px-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-amber-400">باقات الاستوديو الحصرية</h3>
            <p className="text-slate-500 text-sm mt-1">اسحب أفقياً لاستكشاف باقاتنا السبع الفاخرة</p>
          </div>
        </div>
        
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl border-dashed mx-4">
             <span className="text-4xl mb-4">📦</span>
             <h3 className="text-lg font-bold text-slate-300">لا توجد باقات حالياً</h3>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-4 snap-x scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex-none w-80 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden snap-start hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="h-48 w-full bg-slate-800 relative overflow-hidden">
                    <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-slate-100 mb-2 truncate">{pkg.name}</h4>
                    <p className="text-2xl font-black text-amber-400 mb-4">{Number(pkg.price).toLocaleString()} ر.س</p>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">{pkg.description}</p>
                    <ul className="space-y-2 border-t border-slate-800/60 pt-4">
                      {pkg.features?.map((feature, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-center gap-2"><span className="text-amber-500 text-sm">✦</span> {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <button onClick={() => navigate('/booking', { state: { selectedPackage: pkg } })} className="w-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-sm font-bold py-2.5 rounded-xl transition-all duration-300">
                    اختيار هذه الباقة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* المقارنة */}
      <section className="mb-24 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 max-w-5xl mx-auto shadow-xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-amber-400">مساعد القرار: قارن بين الباقات</h3>
          <p className="text-slate-400 text-sm mt-1">اختر باقتين لتقارن بين الخصائص والمميزات فوراً واحجز مباشرة</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div><select value={comparePkg1} onChange={(e) => setComparePkg1(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl text-sm focus:border-amber-500 focus:outline-none"><option value="">-- اختر الباقة الأولى --</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><select value={comparePkg2} onChange={(e) => setComparePkg2(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl text-sm focus:border-amber-500 focus:outline-none"><option value="">-- اختر الباقة الثانية --</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        {selectedPkg1 || selectedPkg2 ? (
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
              {selectedPkg1 ? (
                <div>
                  <h5 className="font-bold text-amber-400 text-base mb-1">{selectedPkg1.name}</h5><p className="text-xl font-black text-white mb-3">{Number(selectedPkg1.price).toLocaleString()} ر.س</p><p className="text-xs text-slate-400 mb-4">{selectedPkg1.description}</p>
                  <div className="space-y-1.5 mb-6">{selectedPkg1.features?.map((f, i) => <div key={i} className="text-xs text-slate-300 bg-slate-900/40 p-1.5 rounded">✓ {f}</div>)}</div>
                  <button onClick={() => navigate('/booking', { state: { selectedPackage: selectedPkg1 } })} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">حجز الباقة الفورية</button>
                </div>
              ) : <p className="text-slate-600 text-xs text-center py-10 my-auto">الرجاء اختيار باقة أولى</p>}
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
              {selectedPkg2 ? (
                <div>
                  <h5 className="font-bold text-amber-400 text-base mb-1">{selectedPkg2.name}</h5><p className="text-xl font-black text-white mb-3">{Number(selectedPkg2.price).toLocaleString()} ر.س</p><p className="text-xs text-slate-400 mb-4">{selectedPkg2.description}</p>
                  <div className="space-y-1.5 mb-6">{selectedPkg2.features?.map((f, i) => <div key={i} className="text-xs text-slate-300 bg-slate-900/40 p-1.5 rounded">✓ {f}</div>)}</div>
                  <button onClick={() => navigate('/booking', { state: { selectedPackage: selectedPkg2 } })} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">حجز الباقة الفورية</button>
                </div>
              ) : <p className="text-slate-600 text-xs text-center py-10 my-auto">الرجاء اختيار باقة ثانية</p>}
            </div>
          </div>
        ) : null}
      </section>

      {/* عرض الأعمال: مهيأ للصور الكثيرة جداً */}
      <section className="mb-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-amber-400">من روائع أعمالنا </h3>
          <p className="text-slate-500 text-sm mt-1">انقر على أي صورة لتراها بوضوح كامل</p>
        </div>

        {portfolioPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl border-dashed">
             <span className="text-4xl mb-4">📸</span>
             <h3 className="text-lg font-bold text-slate-300">لا توجد صور في الألبوم حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {portfolioPhotos.map((photo) => (
              <div 
                key={photo.id} 
                onClick={() => setFullScreenImage(photo.photo_url)} 
                className="relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl group cursor-pointer hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-1"
              >
                <img src={photo.photo_url} alt="Studio Masterpiece" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-70"></div>
                
                {/* أيقونة التكبير تظهر عند التمرير */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/50 text-white w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm text-xl border border-white/20">🔍</span>
                </div>

                <div className="absolute bottom-4 right-4 left-4 text-right">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    ✦ zobaidhphoto
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMorePhotos && portfolioPhotos.length > 0 && (
          <div className="text-center mt-12">
            <button onClick={loadMorePhotos} disabled={loadingMore} className="bg-slate-900 border border-slate-800 text-amber-400 hover:text-slate-950 hover:bg-amber-500 font-bold px-8 py-3 rounded-xl transition-all text-sm shadow-xl disabled:opacity-50">
              {loadingMore ? 'جاري جلب الفن الفاخر...' : 'مشاهدة المزيد من الأعمال'}
            </button>
          </div>
        )}
      </section>

      {/* نموذج التواصل المطور */}
      <section id="contact-section" className="mb-24 max-w-2xl mx-auto px-4">
        <div className="bg-slate-900/70 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-amber-400">اترك لنا رسالة</h3>
            <p className="text-slate-400 text-sm mt-1">هل لديك سؤال أو طلب خاص؟ فريق العمل يجيبك خلال دقائق</p>
          </div>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-slate-400 text-xs mb-1.5 font-medium">الاسم الكريم</label><input type="text" required placeholder="مثال: نوره محمد" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm"/></div>
              <div><label className="block text-slate-400 text-xs mb-1.5 font-medium">رقم الهاتف</label><input type="tel" required placeholder="مثال: 05XXXXXXXX" value={contactForm.phone} onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left" dir="ltr"/></div>
            </div>
            <div><label className="block text-slate-400 text-xs mb-1.5 font-medium">البريد الإلكتروني</label><input type="email" required placeholder="name@example.com" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left" dir="ltr"/></div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">نوع التواصل</label>
              <select value={contactForm.type} onChange={(e) => setContactForm({...contactForm, type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl text-sm">
                <option value="استفسار">استفسار عام عن الخدمات</option>
                <option value="مشكلة">الإبلاغ عن مشكلة فنية</option>
                <option value="طلب خاص">طلب تعديل أو باقة مخصصة</option>
                <option value="أخرى">موضوع آخر</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">مضمون الرسالة</label>
              <textarea rows="4" required placeholder="اكتب تفاصيل استفسارك أو طلبك الفني هنا..." value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none"></textarea>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold p-3.5 rounded-xl text-sm transition-all shadow-md">
              إرسال رسالة التواصل
            </button>
          </form>
        </div>
      </section>

      {/* مربع طلب البكجات النهائي */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-xl mb-12">
        <h3 className="text-2xl md:text-3xl font-black text-slate-100 mb-4">قم بطلب أحد البكجات لتوثيق جزء من ليلة عمرك وثق بنا</h3>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8">نحن هنا لنحول كل مشهد وكل ابتسامة وعاطفة إلى لوحة فنية خالدة لا تنطفئ بمرور الأعوام.</p>
        <button onClick={() => navigate('/booking')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-base font-bold px-8 py-3.5 rounded-xl hover:scale-105 shadow-lg transition-all">احجز باقتك</button>
      </div>
    </Layout>
  );
}