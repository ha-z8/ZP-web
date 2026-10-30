import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import zLogo from '../assets/z-logo.png';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        navigate('/'); 
      }
    }
    checkAdmin();
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <main dir="rtl" role="status" aria-live="polite" className="min-h-screen bg-brand-main text-brand-text flex items-center justify-center px-5 py-12">
        <div className="relative w-full max-w-sm">
          <div className="absolute -inset-4 rounded-[2rem] bg-brand-card opacity-40 blur-2xl pointer-events-none" />
          <div className="relative bg-brand-card border border-brand rounded-[1.75rem] shadow-2xl px-7 py-10 text-center overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-brand-btn" />
            <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-brand animate-pulse" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[var(--brand-accent)] border-r-[var(--brand-accent)] animate-spin motion-reduce:animate-none" />
              <div className="w-16 h-16 rounded-2xl bg-brand-main border border-brand flex items-center justify-center shadow-md">
                <img src={zLogo} alt="شعار zobaidhphoto" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <div className="text-[11px] tracking-[0.24em] font-semibold text-brand-muted mb-2" dir="ltr">ZOBAIDHPHOTO</div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-main mb-2">جاري التحقق من الصلاحيات</h1>
            <p className="text-sm text-brand-muted leading-7">نتأكد من صلاحية حسابك للوصول إلى لوحة الإدارة بشكل آمن.</p>
            <div className="flex gap-1.5 justify-center mt-7" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-bounce motion-reduce:animate-none" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-bounce motion-reduce:animate-none [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-bounce motion-reduce:animate-none [animation-delay:300ms]" />
            </div>
            <p className="mt-5 text-xs text-brand-muted">يرجى عدم إغلاق الصفحة أثناء التحقق</p>
          </div>
        </div>
      </main>
    );
  }

  return children;
}