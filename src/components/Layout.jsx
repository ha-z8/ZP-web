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
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6 text-brand-text" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-brand-text" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
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
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 bg-brand-card border border-brand px-4 py-2 rounded-xl text-xs font-semibold text-brand-text transition-all hover:border-brand-accent shadow-sm">
                  <span>حسابي</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-brand-card border border-brand rounded-xl shadow-2xl py-1.5 z-50 text-right">
                    <div className="px-4 py-2 border-b border-brand mb-1">
                      <p className="text-[10px] text-brand-muted">مسجـل كــ</p>
                      <p className="text-xs font-medium text-brand-text truncate">{user.email}</p>
                    </div>
                    
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/my-account'); }} className="w-full text-right px-4 py-2 text-xs text-brand-text hover:bg-brand-main flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      متابعـة طلباتي ورسائلي
                    </button>

                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }} className="w-full text-right px-4 py-2 text-xs text-brand-text hover:bg-brand-main flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      إعدادات حسابي
                    </button>

                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/dashboard'); }} className="w-full text-right px-4 py-2 text-xs text-brand-text hover:bg-brand-main border-t border-brand mt-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      لوحــة التحكم الإداريــة
                    </button>

                    <button onClick={handleLogout} className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-brand-main border-t border-brand mt-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      تسجيـل الـخـروج
                    </button>
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
                <button onClick={() => {navigate('/my-account'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  متابعـة طلباتي ورسائلي
                </button>
                <button onClick={() => {navigate('/profile'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  إعدادات حسابي
                </button>
                <button onClick={() => {navigate('/dashboard'); setIsMobileMenuOpen(false)}} className="w-full text-right py-2 text-brand-text flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  لوحــة التحكم الإداريــة
                </button>
                <button onClick={handleLogout} className="w-full text-right py-2 text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  تسجيل الخروج
                </button>
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
              <h4 className="text-brand-text font-bold text-sm mb-4">روابـط تهمــك</h4>
              <ul className="space-y-2.5 text-xs text-brand-muted">
                <li><button onClick={() => navigate('/')} className="hover:text-brand-text transition-colors">الصفحـة الرئيسيـة</button></li>
                <li><button onClick={() => navigate('/policies')} className="hover:text-brand-text transition-colors">السياسات والشروط والأحكام</button></li>
                <li><button onClick={scrollToContact} className="hover:text-brand-text transition-colors">تقديم استفسار للإدارة</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-brand-text font-bold text-sm mb-4">حسابـات التواصـل الاجتماعـي</h4>
              <div className="flex gap-4 justify-start">
                <a href="https://www.instagram.com/zobaidh_photographer/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-brand-main border border-brand flex items-center justify-center hover:border-brand-accent transition-all">
                  <img src="https://api.iconify.design/mdi:instagram.svg?color=%238c7a6b" className="w-5 h-5 object-contain" alt="Instagram" />
                </a>
                <a href="https://www.snapchat.com/@zobaidh_photo" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-brand-main border border-brand flex items-center justify-center hover:border-brand-accent transition-all">
                  <img src="https://api.iconify.design/ri:snapchat-line.svg?color=%238c7a6b" className="w-5 h-5 object-contain" alt="Snapchat" />
                </a>
                <a href="https://api.whatsapp.com/send?phone=966554491860" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-brand-main border border-brand flex items-center justify-center hover:border-brand-accent transition-all">
                  <img src="https://api.iconify.design/mdi:whatsapp.svg?color=%238c7a6b" className="w-5 h-5 object-contain" alt="WhatsApp" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right text-xs text-brand-muted">
            <p>جميع الحقوق محفوظة لــــــــــدى © 2026 | zobaidhphoto</p>
            
            <div dir="ltr" className="text-xs tracking-wider text-brand-muted flex items-center gap-1.5">
              <span>MADE WITH PERFECTION BY</span>
              <a 
                href="https://diriyahstudios.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-extrabold text-brand-text/90 hover:text-brand-text transition-all no-underline"
              >
                Diriyah Studios
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}