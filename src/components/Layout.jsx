import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import ThemeToggle from './ThemeToggle';
import zLogo from '../assets/z-logo.png'; 

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const scrollToContact = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
      setTimeout(() => {
        const element = document.getElementById('contact-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const element = document.getElementById('contact-section');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-brand-main text-brand-text font-sans selection:bg-brand-accent selection:text-brand-text flex flex-col justify-between overflow-x-hidden">
      
      {/* الهيدر */}
      <header className="sticky top-0 z-50 w-full border-b border-brand bg-brand-main/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group">
            <img src={zLogo} alt="Logo" className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(200,177,160,0.3)]" />
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button className="p-2 text-brand-muted" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <span className="text-2xl">✕</span> : <span className="text-2xl">☰</span>}
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/')} className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-brand-text font-bold underline' : 'text-brand-muted hover:text-brand-text'}`}>الرئـيـسـيـــة</button>
            <button onClick={scrollToContact} className="text-sm text-brand-muted hover:text-brand-text transition-colors">تواصـل معنـــا</button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => navigate('/booking')} className="bg-brand-card hover:bg-brand-btn border border-brand text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm">احـجـز موعــدك الآن</button>
            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 bg-brand-card border border-brand px-4 py-2 rounded-xl text-xs font-semibold text-brand-text transition-all hover:border-brand-accent shadow-sm"><span>حسابي</span></button>
                {isProfileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-brand-card border border-brand rounded-xl shadow-2xl py-1.5 z-50 text-right">
                    <div className="px-4 py-2 border-b border-brand mb-1">
                      <p className="text-[10px] text-brand-muted">مسجـل كــ</p>
                      <p className="text-xs font-medium text-brand-text truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/my-account'); }} className="w-full text-right px-4 py-2 text-xs text-brand-text hover:bg-brand-main">📦 متابعـة طلباتي ورسائلي</button>
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }} className="w-full text-right px-4 py-2 text-xs text-brand-text hover:bg-brand-main">⚙️ إعدادات حسابي</button>
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/dashboard'); }} className="w-full text-right px-4 py-2 text-xs text-brand-text hover:bg-brand-main border-t border-brand mt-1">🛡️ لوحــة التحكم الإداريــة</button>
                    <button onClick={handleLogout} className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-brand-main border-t border-brand mt-1">تسجيـل الـخـروج</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="bg-brand-card hover:bg-brand-card-hover border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">تـسـجـيـل الـدخــول</button>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand-card border-t border-brand p-4 space-y-3 shadow-xl">
            <button onClick={() => {navigate('/'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text">الرئيسيــة</button>
            <button onClick={scrollToContact} className="w-full text-right py-2 text-brand-text">تواصل معنــا</button>
            <button onClick={() => {navigate('/booking'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text font-bold">احـجـز موعــدك الآن</button>
            {user ? (
              <div className="border-t border-brand pt-3 mt-3 space-y-2">
                <button onClick={() => {navigate('/my-account'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text">📦 متابعـة طلباتي ورسائلي</button>
                <button onClick={() => {navigate('/profile'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text">⚙️ إعدادات حسابي</button>
                <button onClick={() => {navigate('/dashboard'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text">🛡️ لوحــة التحكم الإداريــة</button>
                <button onClick={handleLogout} className="w-full text-right py-2 text-red-600">تسجيل الخروج</button>
              </div>
            ) : (
              <button onClick={() => {navigate('/login'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text font-bold">تسـجـيـل الـدخـول</button>
            )}
          </div>
        )}
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* الفوتر */}
      <footer className="w-full border-t border-brand bg-brand-card pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 border-b border-brand pb-12 text-right">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img src={zLogo} alt="Logo" className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(200,177,160,0.3)]" />
                <span className="text-xl font-black tracking-wider text-brand-text font-serif">zobaidhphoto</span>
              </div>
              <p className="text-brand-muted text-sm leading-6 max-w-sm">نصيغ حكاياتكم العاطفية والجميلة بعدسات سينمائية فاخرة لتظل ذكريات ليلة العمر حية، نابضة بالتفاصيل والمشاعر مدى الحياة.</p>
            </div>
            <div>
              <h4 className="text-brand-text font-bold text-sm mb-4">روابـط النـظـام</h4>
              <ul className="space-y-2.5 text-xs text-brand-muted">
                <li><button onClick={() => navigate('/')} className="hover:text-brand-text transition-colors">الصفحـة الرئيسيـة</button></li>
                <li><button onClick={() => navigate('/booking')} className="hover:text-brand-text transition-colors">طلب حجز فوري</button></li>
                <li><button onClick={scrollToContact} className="hover:text-brand-text transition-colors">تقديم استفسار للإدارة</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-brand-text font-bold text-sm mb-4">حسابـات التواصـل الاجتماعـي</h4>
              <div className="flex gap-4 justify-start">
                <a href="https://www.instagram.com/zobaidh_photographer/" className="w-10 h-10 rounded-lg bg-brand-main border border-brand flex items-center justify-center hover:border-brand-accent transition-all"><img src="https://static.xx.fbcdn.net/assets/?set=help_center_about_page_illustrations&name=desktop-instagram-shield&density=1" className="w-6 h-6" alt="Instagram" /></a>
                <a href="https://www.snapchat.com/@zobaidh_photo" className="w-10 h-10 rounded-lg bg-brand-main border border-brand flex items-center justify-center hover:border-brand-accent transition-all"><img src="https://cdn.creazilla.com/icons/7912114/snapchat-logo-icon-size_512.png" className="w-6 h-6" alt="Snapchat" /></a>
                <a href="https://api.whatsapp.com/send?phone=966554491860" className="w-10 h-10 rounded-lg bg-brand-main border border-brand flex items-center justify-center hover:border-brand-accent transition-all"><img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/WhatsApp_Logo.svg" className="w-6 h-6" alt="WhatsApp" /></a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right text-xs text-brand-muted">
            <p>جميع الحقوق محفوظـة لــــــدى <samp dir='ltr'> Zobaidhphoto © 2026</samp></p>
            <p className="text-[10px] tracking-wider text-brand-muted">MADE WITH PERFECTION BY hazzaa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}