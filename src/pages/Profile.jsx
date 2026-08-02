import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import { showSuccess, showError } from '../utils/alerts';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userAuth, setUserAuth] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          navigate('/login');
          return;
        }
        setUserAuth(user);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setFormData({
          full_name: profile.full_name || '',
          username: profile.username || '',
          phone: profile.phone || '',
          email: profile.email || user.email
        });
      } catch (err) {
        showError('تعذر جلب بيانات الحساب. يرجى تسجيل الدخول مجدداً.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [navigate]);

  // تحديث البيانات الشخصية
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.email !== userAuth.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: formData.email });
        if (emailError) throw emailError;
        showSuccess('تم تحديث البريد! (قد تصلك رسالة تأكيد على بريدك القديم والجديد).');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username.toLowerCase(),
          phone: formData.phone,
          email: formData.email
        })
        .eq('id', userAuth.id);

      if (profileError) throw profileError;
      
      showSuccess('تم حفظ بياناتك الشخصية بنجاح ✨');
    } catch (err) {
      showError(err.message || 'حدث خطأ أثناء حفظ البيانات.');
    } finally {
      setSaving(false);
    }
  };

  // تغيير كلمة المرور
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('كلمات المرور غير متطابقة!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showError('كلمة المرور يجب أن تتكون من 6 خانات على الأقل.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      showSuccess('تم تغيير الدرع الأمني (كلمة المرور) بنجاح 🔐');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError('حدث خطأ أثناء تغيير كلمة المرور.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(200,177,160,0.4)]">🛡️</span>
          <h2 className="text-3xl font-black text-brand-main mt-3">الملف الشخصي للعميل</h2>
          <p className="text-brand-muted text-sm mt-2">إدارة بياناتك الشخصية وحماية حسابك</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* قسم البيانات الشخصية */}
          <div className="bg-brand-card border border-brand rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 brand-gradient"></div>
            <h3 className="text-lg font-bold text-brand-main mb-6 flex items-center gap-2">
              <span className="text-brand-main">📝</span> المعلومات الأساسية
            </h3>
            
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-1.5">الاسم بالكامل</label>
                <input type="text" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none transition-all text-sm"/>
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-1.5">اسم المستخدم (@)</label>
                <input type="text" required dir="ltr" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-main p-3 rounded-xl focus:outline-none transition-all text-sm text-left font-mono"/>
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-1.5">رقم الهاتف</label>
                <input type="tel" required dir="ltr" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none transition-all text-sm text-left"/>
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-1.5">البريد الإلكتروني</label>
                <input type="email" required dir="ltr" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none transition-all text-sm text-left font-mono"/>
              </div>
              
              <button type="submit" disabled={saving} className="w-full mt-4 bg-brand-btn hover:bg-brand-accent-hover text-brand-text font-bold p-3.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm">
                {saving ? 'جاري الحفظ...' : 'تحديث البيانات'}
              </button>
            </form>
          </div>

          {/* قسم الأمان وتغيير المرور */}
          <div className="bg-brand-card border border-brand rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-full h-1 brand-gradient"></div>
            <h3 className="text-lg font-bold text-brand-main mb-6 flex items-center gap-2">
              <span className="text-brand-main">🔐</span> حماية الحساب (تغيير كلمة المرور)
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-1.5">كلمة المرور الجديدة</label>
                <input type="password" required placeholder="••••••••" dir="ltr" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none transition-all text-sm text-left"/>
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-bold mb-1.5">تأكيد كلمة المرور</label>
                <input type="password" required placeholder="••••••••" dir="ltr" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full bg-brand-main border border-brand text-brand-text p-3 rounded-xl focus:outline-none transition-all text-sm text-left"/>
              </div>
              
              <button type="submit" disabled={saving} className="w-full mt-4 bg-brand-main hover:bg-brand-btn border border-brand text-brand-text font-bold p-3.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm">
                {saving ? 'جاري التوثيق...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}