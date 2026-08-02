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
      // 1. تسجيل المستخدم في نظام Auth الخاص بـ Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. إذا تم التسجيل بنجاح، نقوم بإضافة البيانات لجدول profiles يدوياً
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

      showSuccess('تهانينا! تم إنشاء حسابك بنجاح ✨');
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
      <div className="max-w-md mx-auto my-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm text-right">
        <div className="text-center mb-6">
          <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">✨</span>
          <h2 className="text-2xl font-black text-amber-400 mt-2">انضم إلى zobaidhphoto</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">الاسم بالكامل</label>
            <input 
              type="text" required placeholder="مثال: سارة محمد"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">اسم المستخدم (Username)</label>
            <input 
              type="text" required placeholder="sara_md26" dir="ltr"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">البريد الإلكتروني</label>
            <input 
              type="email" required placeholder="example@mail.com" dir="ltr"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">رقم الهاتف</label>
            <input 
              type="tel" required placeholder="05xxxxxxxx" dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 pl-12 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">تأكيد كلمة المرور</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 pl-12 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-left"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {showConfirmPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold p-3.5 rounded-xl text-sm transition-all shadow-lg mt-2 disabled:opacity-50">
            {loading ? 'جاري تهيئة حسابكِ الفاخر...' : 'إنشاء حساب جديد'}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
          <span>لديك حساب بالفعل؟ </span>
          <button onClick={() => navigate('/login')} className="text-amber-400 font-bold hover:underline">تسجيل الدخول</button>
        </div>
      </div>
    </Layout>
  );
}