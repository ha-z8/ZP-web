import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
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
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between overflow-x-hidden">
      
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group">
            <img src={zLogo} alt="Logo" className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/')} className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}>الرئيسية</button>
            <button onClick={scrollToContact} className="text-sm text-slate-400 hover:text-white transition-colors">تواصل معنا</button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate('/booking')} className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500 hover:to-orange-500 border border-amber-500/30 hover:border-transparent text-amber-400 hover:text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all duration-300">احجز موعدك الآن</button>
            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 transition-all hover:border-amber-500/40"><span>حسابي</span></button>
                {isProfileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-right animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-800/60 mb-1">
                      <p className="text-[10px] text-slate-500">مسجل كـ</p>
                      <p className="text-xs font-medium text-slate-300 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/my-account'); }} className="w-full text-right px-4 py-2 text-xs text-slate-300 hover:bg-slate-950 hover:text-amber-400 transition-colors">📦 متابعة طلباتي ورسائلي</button>
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }} className="w-full text-right px-4 py-2 text-xs text-slate-300 hover:bg-slate-950 hover:text-amber-400 transition-colors">⚙️ إعدادات حسابي</button>
                    <button onClick={() => { setIsProfileMenuOpen(false); navigate('/dashboard'); }} className="w-full text-right px-4 py-2 text-xs text-purple-400 hover:bg-slate-950 border-t border-slate-800 mt-1 transition-colors">🛡️ لوحة التحكم الإدارية</button>
                    <button onClick={handleLogout} className="w-full text-right px-4 py-2 text-xs text-red-400 hover:bg-slate-950 border-t border-slate-800 mt-1 transition-colors">تسجيل الخروج</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all">تسجيل الدخول</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="w-full border-t border-slate-900/60 bg-slate-950 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 border-b border-slate-900 pb-12 text-right">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img src={zLogo} alt="Logo" className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                <span className="text-xl font-black tracking-wider text-amber-400 font-serif">zobaidhphoto</span>
              </div>
              <p className="text-slate-400 text-sm leading-6 max-w-sm">نصيغ حكاياتكم العاطفية والجميلة بعدسات سينمائية فاخرة لتظل ذكريات ليلة العمر حية، نابضة بالتفاصيل والمشاعر مدى الحياة.</p>
            </div>
            <div>
              <h4 className="text-slate-200 font-bold text-sm mb-4">روابط النظام</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><button onClick={() => navigate('/')} className="hover:text-amber-400 transition-colors">الصفحة الرئيسية</button></li>
                <li><button onClick={() => navigate('/booking')} className="hover:text-amber-400 transition-colors">طلب حجز فوري</button></li>
                <li><button onClick={scrollToContact} className="hover:text-amber-400 transition-colors">تقديم استفسار للإدارة</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-200 font-bold text-sm mb-4">حسابات التواصل الاجتماعي</h4>
              <div className="flex gap-4 justify-start">
                <a href="https://www.instagram.com/zobaidh_photographer/" className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-purple-500 transition-all"><img src="https://static.xx.fbcdn.net/assets/?set=help_center_about_page_illustrations&name=desktop-instagram-shield&density=1" className="w-6 h-6" /></a>
                <a href="https://www.snapchat.com/@zobaidh_photo" className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-yellow-400 transition-all"><img src="https://cdn.creazilla.com/icons/7912114/snapchat-logo-icon-size_512.png" className="w-6 h-6" /></a>
                <a href="https://api.whatsapp.com/send?phone=966554491860" className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-emerald-400 transition-all"><img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/WhatsApp_Logo.svg" className="w-6 h-6" /></a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right text-xs text-slate-500">
            <p>جميع الحقوق محفوظة لدى <samp dir='ltr'> Zobaidhphoto © 2026</samp></p>
            <p className="text-[10px] tracking-wider text-slate-600">MADE WITH PERFECTION BY hazzaa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}