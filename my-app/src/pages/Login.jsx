import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts'; // 👈 استيراد الإشعارات الفاخرة

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
      // المنطق الذكي: إذا كان المدخل لا يحتوي على @، نقوم بالبحث عنه كـ اسم مستخدم (Username)
      if (!emailToAuth.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailToAuth.toLowerCase())
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile || !profile.email) {
          showError('اسم المستخدم هذا غير مسجل لدينا، يرجى التحقق وإعادة المحاولة.'); // 👈 إشعار خطأ ذكي
          setLoading(false);
          return;
        }

        emailToAuth = profile.email;
      }

      // تسجيل الدخول الفعلي بكلمة المرور والإيميل المستخرج
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: password,
      });

      if (authError) throw authError;

      showSuccess('تم تسجيل الدخول بنجاح! أهلاً بك في موقعنا ✨'); // 👈 إشعار ترحيبي
      navigate('/');
    } catch (err) {
      console.error(err);
      showError(err.message || 'خطأ في كلمة المرور أو معرّف الحساب.'); // 👈 إشعار خطأ أنيق
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto my-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm text-right">
        <div className="text-center mb-8">
          <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">🔒</span>
          <h2 className="text-2xl font-black text-amber-400 mt-2">تسجيل دخول الأعضاء</h2>
          <p className="text-slate-400 text-xs mt-1">أدخل البريد الإلكتروني أو اسم المستخدم الخاص بك للوصول للنظام</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1.5">البريد الإلكتروني أو اسم المستخدم (Username)</label>
            <input 
              type="text" required placeholder="أدخل الإيميل أو اسم المستخدم" dir="ltr"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 pl-12 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold p-3.5 rounded-xl text-sm transition-all shadow-lg mt-2 disabled:opacity-50">
            {loading ? 'جاري التحقق والمطابقة...' : 'تسجيل الدخول الآمن'}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
          <span>ليس لديك حساب معنا حتى الآن؟ </span>
          <button onClick={() => navigate('/register')} className="text-amber-400 font-bold hover:underline">انضم إلينا الآن</button>
        </div>
      </div>
    </Layout>
  );
}