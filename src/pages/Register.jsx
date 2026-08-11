import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '', 
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError('عذراً، كلمات المرور غير متطابقة!');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(formData.username)) {
      showError('اسم المستخدم يجب أن يكون بالإنجليزية، من 3 لـ 15 حرفاً، وبدون مسافات.');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: formData.username.toLowerCase(),
              full_name: formData.fullName,
              email: formData.email,
              phone: formData.phone
            }
          ]);

        if (profileError) {
          console.error("Profile Error:", profileError);
          throw new Error("تم إنشاء الحساب ولكن فشل حفظ بيانات الملف الشخصي.");
        }
      }

      showSuccess('تهانينا! تم إنشاء حسابك بنجاح');
      navigate('/');
      
    } catch (err) {
      console.error(err);
      showError(err.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto my-8 bg-brand-card border border-brand rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm text-right">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-main border border-brand shadow-sm mb-4">
            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-brand-main mt-2">انضم إلى zobaidhphoto</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">الاسم بالكامل</label>
            <input 
              type="text" required placeholder="مثال: سارة محمد الدوسري"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">اسم المستخدم (Username)</label>
            <input 
              type="text" required placeholder="sara_md26" dir="ltr"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none text-sm text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">البريد الإلكتروني</label>
            <input 
              type="email" required placeholder="example@mail.com" dir="ltr"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none text-sm text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">رقم الهاتف</label>
            <input 
              type="tel" required placeholder="05xxxxxxxx" dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none text-sm text-left"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-brand-main border border-brand text-brand-text p-3 pr-4 pl-12 rounded-xl focus:outline-none text-sm text-left font-mono"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-text transition-all"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243l4.242 4.242z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">تأكيد كلمة المرور</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-brand-main border border-brand text-brand-text p-3 pr-4 pl-12 rounded-xl focus:outline-none text-sm text-left font-mono"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-text transition-all"
                title={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243l4.242 4.242z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-brand-btn text-brand-main font-bold p-3.5 rounded-xl text-sm transition-all shadow-lg mt-2 disabled:opacity-50 hover:bg-brand-accent-hover">
            {loading ? 'جاري تهيئة حسابكِ الفاخر...' : 'إنشاء حساب جديد'}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-brand text-xs text-brand-muted">
          <span>لديك حساب بالفعل؟ </span>
          <button onClick={() => navigate('/login')} className="text-brand-main font-bold hover:underline">تسجيل الدخول</button>
        </div>
      </div>
    </Layout>
  );
}