import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    let emailToAuth = identifier.trim();

    try {
      if (!emailToAuth.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailToAuth.toLowerCase())
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile || !profile.email) {
          showError('اسم المستخدم هذا غير مسجل لدينا، يرجى التحقق وإعادة المحاولة.');
          setLoading(false);
          return;
        }

        emailToAuth = profile.email;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: password,
      });

      if (authError) throw authError;

      showSuccess('تم تسجيل الدخول بنجاح! أهلاً بك في موقعنا');
      navigate('/');
    } catch (err) {
      console.error(err);
      showError(err.message || 'خطأ في كلمة المرور أو معرّف الحساب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto my-16 bg-brand-card border border-brand rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm text-right">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-main border border-brand shadow-sm mb-4">
            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-brand-main mt-2">تسجيل دخول الأعضاء</h2>
          <p className="text-brand-muted text-xs mt-1">أدخل البريد الإلكتروني أو اسم المستخدم الخاص بك للوصول للنظام</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1.5">البريد الإلكتروني أو اسم المستخدم</label>
            <input 
              type="text" required placeholder="أدخل الإيميل أو اسم المستخدم" dir="ltr"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none text-sm text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-main border border-brand text-brand-text p-3 pr-4 pl-12 rounded-xl focus:outline-none text-sm text-left font-mono"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-text transition-all"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  // أيقونة العين المشطوبة (للإخفاء) - رسم دقيق ومنفصل
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243l4.242 4.242z" />
                  </svg>
                ) : (
                  // أيقونة العين العادية (للإظهار)
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-brand-btn text-brand-main font-bold p-3.5 rounded-xl text-sm transition-all shadow-lg mt-2 disabled:opacity-50 hover:bg-brand-accent-hover">
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول الآمن'}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-brand text-xs text-brand-muted">
          <span>ليس لديك حساب معنا حتى الآن؟ </span>
          <button onClick={() => navigate('/register')} className="text-brand-main font-bold hover:underline">انضم إلينا الآن</button>
        </div>
      </div>
    </Layout>
  );
}