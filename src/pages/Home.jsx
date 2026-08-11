import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts';
import zLogo from '../assets/z-logo.png';

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

  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        // جلب الباقات المفعلة فقط مرتبة حسب display_order
        const { data: pkgs } = await supabase
          .from('packages')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (pkgs) setPackages(pkgs);

        const { data: photos } = await supabase
          .from('album_photos')
          .select('*')
          .eq('is_active', true) // جلب الصور المفعلة فقط
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
        client_email: contactForm.email, 
        client_phone: contactForm.phone,
        user_id: user.id
      }]);
      
      if (error) throw error;
      showSuccess('تم إرسال رسالتك بنجاح! سيتواصل معك فريق الاستوديو قريباً.');
      setContactForm({ name: '', email: '', phone: '', type: 'استفسار', message: '' });
    } catch (err) {
      showError('حدث خطأ أثناء محاولة إرسال الرسالة، يرجى إعادة المحاولة.');
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const selectedPkg1 = packages.find(p => p.id === comparePkg1);
  const selectedPkg2 = packages.find(p => p.id === comparePkg2);

  return (
    <Layout>
      {/* نافذة العرض السينمائي بملء الشاشة */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-pointer" 
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-brand-main bg-brand-card hover:bg-brand-btn rounded-full w-10 h-10 flex items-center justify-center transition-all text-xl z-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen Masterpiece" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl animate-fadeIn" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* المربع الترحيبي (Hero) */}
      <div className="text-center py-20 brand-gradient rounded-3xl p-8 mb-16 border border-brand shadow-2xl">
        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-brand-main">
          نـــوثّـق لـيلـــة عـمركـم الساحــرة بجودة عــاليـــة
        </h2>
        <p className="text-brand-muted text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            في zobaidhphoto، نلتقط أجمل اللحظات من يوم زفافكم بأسلوب عالــي الجودة وفريد. دعونا نروي قصتكم بحرفية وإبداع لا مثيل لهما.
        </p>
        <button onClick={() => navigate('/booking')} className="bg-brand-btn hover:bg-brand-btn text-brand-main text-lg font-bold px-8 py-4 rounded-xl hover:scale-105 shadow-xl transition-all">
          احـجـز باقتـك الآن
        </button>
      </div>

      {/* قسم التعريف */}
      <section className="mb-24 max-w-5xl mx-auto px-4 grid md:grid-cols-2 items-center gap-12">
        <div className="text-right order-2 md:order-1">
          <h3 className="text-2xl md:text-3xl font-bold text-brand-main mb-4">مـن انـا ومـاذا اقـدم؟</h3>
          <p className="text-brand-muted text-base md:text-lg leading-8">
          المصوره السعوديـه <span className="text-brand-main font-bold">زبـيـده عبدالعـزيـز</span> تخصصها في مجال تصوير الاعراس لتكون جزءاً مهماً في لـيلــة عمر العروسين وتوثيق التفاصيل بكل مافيها من مشاعر بإحترافيه بخدمة التصوير الفوتوغرافـي والفيديو
          </p>
        </div>

        <div className="flex justify-center order-1 md:order-2">
          <div className="relative w-full max-w-[320px] aspect-square group">
            <div className="absolute inset-0 bg-brand-accent/20 blur-3xl rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
            <img 
              src={zLogo} 
              alt="Studio Logo" 
              className="relative w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* قسم الباقات الحصرية */}
      <section className="mb-20">
        <div className="flex justify-between items-center mb-8 px-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-brand-main">باقـات الـتـصويـــر الـحـصـريـــــة</h3>
            <p className="text-brand-muted text-sm mt-1">اسحب أفقياً لاستكشاف باقـاتـنـا الفاخــرة</p>
          </div>
        </div>
        
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-brand-card border border-brand rounded-3xl border-dashed mx-4">
             <svg className="w-12 h-12 text-brand-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
             </svg>
             <h3 className="text-lg font-bold text-brand-main">لا توجد باقات حالياً</h3>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-4 snap-x">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex-none w-80 bg-brand-card border border-brand rounded-2xl overflow-hidden snap-start hover:border-brand-accent transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="h-48 w-full bg-brand-main relative overflow-hidden">
                    <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" />
                    <div 
                      className="absolute inset-x-0 bottom-0 h-28" 
                      style={{ 
                        background: 'linear-gradient(to top, var(--brand-card), color-mix(in srgb, var(--brand-card) 60%, transparent), transparent)' 
                      }}
                    ></div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-brand-main mb-2 truncate">{pkg.name}</h4>
                    <p className="text-2xl font-black text-brand-main mb-4">{Number(pkg.price).toLocaleString()} ر.س</p>
                    <p className="text-brand-muted text-sm mb-4 line-clamp-3">{pkg.description}</p>
                    <ul className="space-y-2 border-t border-brand pt-4">
                      {pkg.features?.map((feature, i) => (
                        <li key={i} className="text-xs text-brand-muted flex items-center gap-2"><span className="text-brand-main text-sm">✦</span> {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <button onClick={() => navigate('/booking', { state: { selectedPackage: pkg } })} className="w-full bg-brand-main hover:bg-brand-btn text-brand-main text-sm font-bold py-2.5 rounded-xl transition-all duration-300 border border-brand">
                    اخـتـيـار هذه الباقــــة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* المقارنة */}
      <section className="mb-24 bg-brand-card border border-brand rounded-3xl p-6 md:p-8 max-w-5xl mx-auto shadow-xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-brand-main">مــســاعـد القـرار: قارن بين الباقات</h3>
          <p className="text-brand-muted text-sm mt-1">اختر باقتين لتقارن بين الخصائص والمميزات فوراً واحجز مباشرة</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div><select value={comparePkg1} onChange={(e) => setComparePkg1(e.target.value)} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl text-sm focus:outline-none"><option value="">-- اخـتـر الباقـة الأولـــى --</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><select value={comparePkg2} onChange={(e) => setComparePkg2(e.target.value)} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl text-sm focus:outline-none"><option value="">-- اخـتـر الباقـة الثانيـــة --</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        {selectedPkg1 || selectedPkg2 ? (
          <div className="grid grid-cols-2 gap-4 border-t border-brand pt-6">
            <div className="bg-brand-main p-4 rounded-xl border border-brand flex flex-col justify-between">
              {selectedPkg1 ? (
                <div>
                  <h5 className="font-bold text-brand-main text-base mb-1">{selectedPkg1.name}</h5><p className="text-xl font-black text-brand-main mb-3">{Number(selectedPkg1.price).toLocaleString()} ر.س</p><p className="text-xs text-brand-muted mb-4">{selectedPkg1.description}</p>
                  <div className="space-y-1.5 mb-6">{selectedPkg1.features?.map((f, i) => <div key={i} className="text-xs text-brand-muted bg-brand-card p-1.5 rounded">✓ {f}</div>)}</div>
                  <button onClick={() => navigate('/booking', { state: { selectedPackage: selectedPkg1 } })} className="w-full bg-brand-btn text-brand-main text-xs font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">حـجـز الـبـاقـة الـفـوريــــة</button>
                </div>
              ) : <p className="text-brand-muted text-xs text-center py-10 my-auto">الرجــــاء اخـتـيـار بـاقـة أولـــى</p>}
            </div>
            <div className="bg-brand-main p-4 rounded-xl border border-brand flex flex-col justify-between">
              {selectedPkg2 ? (
                <div>
                  <h5 className="font-bold text-brand-main text-base mb-1">{selectedPkg2.name}</h5><p className="text-xl font-black text-brand-main mb-3">{Number(selectedPkg2.price).toLocaleString()} ر.س</p><p className="text-xs text-brand-muted mb-4">{selectedPkg2.description}</p>
                  <div className="space-y-1.5 mb-6">{selectedPkg2.features?.map((f, i) => <div key={i} className="text-xs text-brand-muted bg-brand-card p-1.5 rounded">✓ {f}</div>)}</div>
                  <button onClick={() => navigate('/booking', { state: { selectedPackage: selectedPkg2 } })} className="w-full bg-brand-btn text-brand-main text-xs font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">حـجـز الـبـاقـة الـفـوريــــة</button>
                </div>
              ) : <p className="text-brand-muted text-xs text-center py-10 my-auto">الرجــــاء اخـتـيـار بـاقـة الثانيـــة</p>}
            </div>
          </div>
        ) : null}
      </section>

      {/* عرض الأعمال */}
      <section className="mb-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-brand-main">من روائـع أعـمـالـنـا </h3>
          <p className="text-brand-muted text-sm mt-1">انقر على أي صورة لتراها بوضوح كامل</p>
        </div>

        {portfolioPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-brand-card border border-brand rounded-3xl border-dashed">
             <svg className="w-12 h-12 text-brand-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <h3 className="text-lg font-bold text-brand-main">لا توجد صور في الألبوم حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {portfolioPhotos.map((photo) => (
              <div 
                key={photo.id} 
                onClick={() => setFullScreenImage(photo.photo_url)} 
                className="relative aspect-[9/16] bg-brand-card rounded-2xl overflow-hidden border border-brand shadow-2xl group cursor-pointer hover:border-brand-accent transition-all duration-500 hover:-translate-y-1"
              >
                <img src={photo.photo_url} alt="Studio Masterpiece" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                
                <div 
                  className="absolute inset-x-0 bottom-0 h-32"
                  style={{
                    background: 'linear-gradient(to top, var(--brand-card), color-mix(in srgb, var(--brand-card) 70%, transparent), transparent)'
                  }}
                ></div>        
               
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-brand-card text-brand-main w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm text-xl border border-brand shadow-lg">
                    <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 left-4 text-right z-10">
                  <span className="text-[10px] font-bold text-brand-main bg-brand-card border border-brand px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
                    ✦ zobaidhphoto
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMorePhotos && portfolioPhotos.length > 0 && (
          <div className="text-center mt-12">
            <button onClick={loadMorePhotos} disabled={loadingMore} className="bg-brand-card border border-brand text-brand-main hover:bg-brand-btn font-bold px-8 py-3 rounded-xl transition-all text-sm shadow-xl disabled:opacity-50">
              {loadingMore ? 'جاري جلب الـفـن الفاخــــر...' : 'مـشاهـدة الـمـزيـد من الأعـمـال'}
            </button>
          </div>
        )}
      </section>

      {/* نموذج التواصل */}
      <section id="contact-section" className="mb-24 max-w-2xl mx-auto px-4">
        <div className="bg-brand-card border border-brand p-8 rounded-3xl shadow-xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-brand-main">اتـرك لــنــا رسالــة</h3>
            <p className="text-brand-muted text-sm mt-1">هل لديك سؤال أو طلب خاص؟ فريق العمل يجيبك خلال دقائق</p>
          </div>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-brand-muted text-xs mb-1.5 font-medium">الاسم الكريم</label><input type="text" required placeholder="مثال: نوره محمد" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm"/></div>
              <div><label className="block text-brand-muted text-xs mb-1.5 font-medium">رقم الهاتف</label><input type="tel" required placeholder="مثال: 05XXXXXXXX" value={contactForm.phone} onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm text-left" dir="ltr"/></div>
            </div>
            <div><label className="block text-brand-muted text-xs mb-1.5 font-medium">البريد الإلكتروني</label><input type="email" required placeholder="name@example.com" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm text-left" dir="ltr"/></div>
            <div>
              <label className="block text-brand-muted text-xs mb-1.5 font-medium">نوع التواصل</label>
              <select value={contactForm.type} onChange={(e) => setContactForm({...contactForm, type: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl text-sm">
                <option value="استفسار">استفسار عام عن الخدمات</option>
                <option value="مشكلة">الإبلاغ عن مشكلة فنية</option>
                <option value="طلب خاص">طلب تعديل أو باقة مخصصة</option>
                <option value="أخرى">موضوع آخر</option>
              </select>
            </div>
            <div>
              <label className="block text-brand-muted text-xs mb-1.5 font-medium">مضمون الرسالة</label>
              <textarea rows="4" required placeholder="اكتب تفاصيل استفسارك أو طلبك الفني هنا..." value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none text-sm resize-none"></textarea>
            </div>
            <button type="submit" className="w-full bg-brand-btn text-brand-main font-bold p-3.5 rounded-xl text-sm transition-all shadow-md">
              إرسـال رسالـــة التواصـل
            </button>
          </form>
        </div>
      </section>

      {/* مربع طلب البكجات النهائي */}
      <div className="brand-gradient border border-brand rounded-3xl p-8 md:p-12 text-center shadow-xl mb-12">
        <h3 className="text-2xl md:text-3xl font-black text-brand-main mb-4">قـم بطلب أحـد البكجات لتوثيق جـزء من لـيلـــة عمرك وثـق بنـا</h3>
        <p className="text-brand-muted text-sm md:text-base max-w-xl mx-auto mb-8">نحن هنا لنحول كل مشهد وكل ابتسامة وعاطفة إلى لوحة فنيـــة خالدة لا تنطفئ بمرور الأعوام.</p>
        <button onClick={() => navigate('/booking')} className="bg-brand-btn text-brand-main text-base font-bold px-8 py-3.5 rounded-xl hover:scale-105 shadow-lg transition-all">احـجـز بـاقـتـك</button>
      </div>

       {/* قسم الحسابات البنكية المعتمدة في الصفحة الرئيسية */}
      <section id="bank-accounts" className="mb-24 max-w-4xl mx-auto px-4">
        <div className="bg-brand-card border border-brand rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-black text-brand-main mb-2">الحسابات البنكية المعتمدة للتحويل</h3>
            <p className="text-brand-muted text-xs">يرجى التحويل لإحدى الحسابات أدناه وإرفاق إيصال التحويل لتأكيد حجزك باسم: <strong className="text-brand-text">زبيدة عبدالعزيز</strong></p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* مصرف الراجحي */}
            <div className="bg-brand-main border border-brand p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-brand-main">مصرف الراجحي</span>
                <svg className="w-5 h-5 text-brand-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-brand-muted">رقم الحساب: <span className="font-mono font-bold text-brand-text">219608010151238</span></p>
                <div className="flex items-center justify-between bg-brand-card p-2.5 rounded-xl border border-brand">
                  <span className="font-mono text-[11px] text-brand-text truncate select-all">SA8980000219608010151238</span>
                  <button 
                    onClick={() => handleCopy('SA8980000219608010151238', 'rajhi')}
                    className="bg-brand-main hover:bg-brand-card-hover border border-brand px-3 py-1.5 rounded-lg text-xs font-bold text-brand-text transition-all shrink-0"
                  >
                    {copiedText === 'rajhi' ? 'تم النسخ ✓' : 'نسخ الآيبان'}
                  </button>
                </div>
              </div>
            </div>

            {/* البنك السعودي للاستثمار */}
            <div className="bg-brand-main border border-brand p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-brand-main">البنك السعودي للاستثمار</span>
                <svg className="w-5 h-5 text-brand-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-brand-muted">رقم الحساب: <span className="font-mono font-bold text-brand-text">0129A77443001</span></p>
                <div className="flex items-center justify-between bg-brand-card p-2.5 rounded-xl border border-brand">
                  <span className="font-mono text-[11px] text-brand-text truncate select-all">SA3565000000129A77443001</span>
                  <button 
                    onClick={() => handleCopy('SA3565000000129A77443001', 'saudi')}
                    className="bg-brand-main hover:bg-brand-card-hover border border-brand px-3 py-1.5 rounded-lg text-xs font-bold text-brand-text transition-all shrink-0"
                  >
                    {copiedText === 'saudi' ? 'تم النسخ ✓' : 'نسخ الآيبان'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      
    </Layout>
  );
}