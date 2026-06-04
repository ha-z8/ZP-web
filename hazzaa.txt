import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import { supabase } from '../supabase';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]); 
  const [photos, setPhotos] = useState([]); 
  const [packagesCount, setPackagesCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [copiedFieldId, setCopiedFieldId] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', price: 1000, description: '', image_url: '', features_string: '' });
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submittingUserEdit, setSubmittingUserEdit] = useState(false);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { navigate('/login'); return; }

        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

        if (profileError || !profile || profile.role !== 'admin') {
          showError('🚫 عذراً! هذه المنطقة مخصصة لمشرفي وإدارة استوديو لوميير فقط.');
          navigate('/'); return;
        }

        setIsAuthorized(true);
        fetchDashboardData();
      } catch (err) {
        console.error('Security Check Error:', err); navigate('/');
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAdminAccess();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const { data: textMessages } = await supabase.from('expenses').select('*').like('category', 'رسالة تواصل%').order('created_at', { ascending: false });
      if (textMessages) setMessages(textMessages);

      const { data: pkgsData } = await supabase.from('packages').select('*').order('price', { ascending: true });
      if (pkgsData) setPackages(pkgsData);
        
      const { count } = await supabase.from('packages').select('*', { count: 'exact', head: true });
      setPackagesCount(count || 0);

      const { data: bookingsData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (bookingsData) setBookings(bookingsData);

      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (usersData) setUsers(usersData);

      // 👈 جلب صور الألبوم مرتبة بناءً على sort_order
      const { data: photosData } = await supabase.from('album_photos').select('*').order('sort_order', { ascending: true });
      if (photosData) setPhotos(photosData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

    // ==========================================
  // دوال عرض حاله رسائل التواصل
  // ==========================================

  // ==========================================
  // دوال إدارة صور معرض الأعمال والتغيير بالترتيب 🖼️
  // ==========================================
  
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setSubmittingPhoto(true);
    try {
      // إدراج الصورة الجديدة مع تعيينها كآخر صورة في الترتيب
      const { error } = await supabase.from('album_photos').insert([{ photo_url: newPhotoUrl, sort_order: photos.length }]);
      if (error) throw error;
      showSuccess('تمت إضافة الصورة لمعرض الأعمال بنجاح 📸');
      setIsAddPhotoModalOpen(false);
      setNewPhotoUrl('');
      fetchDashboardData();
    } catch (err) {
      showError('حدث خطأ أثناء إضافة الصورة.');
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const isConfirmed = await confirmAction('حذف صورة', 'هل أنتِ متأكدة من إزالة هذه الصورة من المعرض العام للموقع؟', 'حذف الصورة', true);
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.from('album_photos').delete().eq('id', photoId);
      if (error) throw error;
      setPhotos(photos.filter(p => p.id !== photoId));
      showSuccess('تم حذف الصورة من المعرض بنجاح.');
    } catch (err) {
      showError('حدث خطأ أثناء محاولة حذف الصورة.');
    }
  };

  // 👈 دالة النقل والترتيب الذكية
  const handleMovePhoto = async (index, direction) => {
    const newIndex = direction === 'next' ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= photos.length) return; // منع الخروج عن النطاق

    // نسخة جديدة لترتيب واجهة المستخدم فوراً (تجربة سريعة)
    const updatedPhotos = [...photos];
    const temp = updatedPhotos[index];
    updatedPhotos[index] = updatedPhotos[newIndex];
    updatedPhotos[newIndex] = temp;
    setPhotos(updatedPhotos);

    try {
      // إرسال التحديثات للسيرفر لتغيير رقم الـ sort_order لكلتا الصورتين
      await Promise.all(
        updatedPhotos.map((p, i) => supabase.from('album_photos').update({ sort_order: i }).eq('id', p.id))
      );
    } catch (err) {
      showError('حدث خطأ أثناء حفظ الترتيب الجديد.');
      fetchDashboardData(); // إعادة الوضع القديم عند الخطأ
    }
  };

  // ==========================================
  // دوال إدارة العملاء (عبر RPC)
  // ==========================================

  const handleUpdateUserRole = async (user, newRole) => {
    try {
      const { error } = await supabase.rpc('admin_update_user', { target_user_id: user.id, new_full_name: user.full_name, new_username: user.username, new_phone: user.phone, new_email: user.email, new_role: newRole });
      if (error) throw error;
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showSuccess(`تم تغيير صلاحية ${user.full_name} بنجاح.`);
    } catch (err) { showError('حدث خطأ أثناء تغيير الصلاحيات.'); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmittingUserEdit(true);
    try {
      const { error } = await supabase.rpc('admin_update_user', { target_user_id: editingUser.id, new_full_name: editingUser.full_name, new_username: editingUser.username.toLowerCase(), new_phone: editingUser.phone, new_email: editingUser.email, new_role: editingUser.role });
      if (error) throw error;
      showSuccess('تم تحديث بيانات العميل والإيميل بنجاح!');
      setIsEditUserModalOpen(false);
      fetchDashboardData(); 
    } catch (err) { showError('حدث خطأ أثناء حفظ التعديلات.'); } finally { setSubmittingUserEdit(false); }
  };

  const handleDeleteUser = async (userId, userName) => {
    const isConfirmed = await confirmAction('حذف حساب العميل', `هل أنت متأكد من حذف العميل "${userName}" نهائياً من قاعدة البيانات؟`, 'حذف جذري', true);
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      showSuccess('تم مسح العميل من قاعدة البيانات بشكل جذري.');
    } catch (err) { showError('حدث خطأ أثناء محاولة الحذف.'); }
  };

  const handleForceChangePassword = async (userId, userName) => {
    const { value: newPassword } = await Swal.fire({
      title: `تغيير كلمة مرور "${userName}"`, input: 'text', inputLabel: 'أدخل كلمة المرور الجديدة (6 أحرف أو أرقام كحد أدنى)', inputPlaceholder: '••••••••', showCancelButton: true, confirmButtonText: 'حفظ واعتماد', cancelButtonText: 'إلغاء',
      inputValidator: (value) => { if (!value) return 'يجب إدخال كلمة مرور!'; if (value.length < 6) return 'كلمة المرور قصيرة جداً!'; },
      customClass: { popup: 'bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl', title: 'text-emerald-400 font-black text-xl mb-4', input: 'bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-emerald-500', inputLabel: 'text-slate-400 text-xs mb-2 text-right w-full block', confirmButton: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl mx-2 transition-all', cancelButton: 'bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-2.5 rounded-xl mx-2 transition-all' }, background: '#0f172a', color: '#cbd5e1'
    });
    if (!newPassword) return;
    try {
      const { error } = await supabase.rpc('admin_change_user_password', { target_user_id: userId, new_password: newPassword });
      if (error) throw error;
      showSuccess(`تم تغيير كلمة مرور "${userName}" بنجاح!`);
    } catch (err) { showError('حدث خطأ أثناء محاولة تغيير كلمة المرور.'); }
  };

  const handleSendPasswordReset = async (email) => {
    const isConfirmed = await confirmAction('إرسال رابط التغيير', `هل ترغب في إرسال رابط تغيير كلمة المرور إلى البريد: ${email}؟`, 'إرسال الرابط');
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      showSuccess('تم إرسال رابط استعادة كلمة المرور بنجاح للمستخدم.');
    } catch (err) { showError('حدث خطأ أثناء إرسال الرابط.'); }
  };

  const openEditUserModal = (user) => {
    setEditingUser({ ...user });
    setIsEditUserModalOpen(true);
  };

  // ==========================================
  // دوال الحجوزات والرسائل والباقات
  // ==========================================

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
      if (error) throw error;
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      showSuccess('تم تحديث حالة الطلب بنجاح.');
    } catch (err) { showError('حدث خطأ أثناء تحديث حالة الطلب.'); }
  };

  const handleDeleteBooking = async (bookingId) => {
    const isConfirmed = await confirmAction('حذف حجز', 'هل أنتِ متأكدة من حذف هذا الحجز نهائياً من النظام؟', 'تأكيد الحذف', true);
    if (!isConfirmed) return;
    try {
      await supabase.from('bookings').delete().eq('id', bookingId);
      setBookings(bookings.filter(b => b.id !== bookingId));
      showSuccess('تم إتلاف الحجز بنجاح.');
    } catch (err) { showError('حدث خطأ أثناء حذف الطلب.'); }
  };

  const handleDeleteMessage = async (messageId) => {
    if (await confirmAction('حذف رسالة', 'هل أنت متأكد من حذف هذه الرسالة؟', 'حذف', true)) {
      try {
        await supabase.from('expenses').delete().eq('id', messageId);
        setMessages(messages.filter(m => m.id !== messageId));
        showSuccess('تم الحذف.');
      } catch (err) { showError('حدث خطأ.'); }
    }
  };

  const handleDeletePackage = async (packageId) => {
    const isConfirmed = await confirmAction('حذف باقة تصوير', 'هل أنتِ متأكدة من حذف هذه الباقة تماماً؟', 'تأكيد الحذف', true);
    if (!isConfirmed) return;
    try {
      await supabase.from('packages').delete().eq('id', packageId);
      setPackages(packages.filter(p => p.id !== packageId));
      showSuccess('تم حذف الباقة بنجاح.');
    } catch (err) { showError('حدث خطأ أثناء محاولة حذف الباقة.'); }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    setSubmittingAdd(true);
    const featuresArray = newPackage.features_string.split('\n').map(item => item.trim()).filter(item => item !== '');
    try {
      await supabase.from('packages').insert([{ ...newPackage, price: Number(newPackage.price), features: featuresArray }]);
      setIsAddModalOpen(false);
      setNewPackage({ name: '', price: 1000, description: '', image_url: '', features_string: '' });
      fetchDashboardData(); 
      showSuccess('تم إضافة الباقة الجديدة بنجاح!');
    } catch (err) { showError('حدث خطأ أثناء الإضافة.'); } finally { setSubmittingAdd(false); }
  };

  const openEditModal = (pkg) => {
    setEditingPackage({ ...pkg, features_string: pkg.features ? pkg.features.join('\n') : '' });
    setIsEditModalOpen(true);
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    const featuresArray = editingPackage.features_string.split('\n').map(item => item.trim()).filter(item => item !== '');
    try {
      await supabase.from('packages').update({ ...editingPackage, price: Number(editingPackage.price), features: featuresArray }).eq('id', editingPackage.id);
      setIsEditModalOpen(false);
      fetchDashboardData(); 
      showSuccess('تم حفظ التعديلات بنجاح.');
    } catch (err) { showError('حدث خطأ أثناء حفظ التعديلات.'); } finally { setSubmittingEdit(false); }
  };

  const handleCopyToClipboard = (text, uniqueId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFieldId(uniqueId);
    setTimeout(() => setCopiedFieldId(''), 2000);
  };

  if (loadingAuth) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-medium">جاري التحقق من الصلاحيات الأمنية للمشرفين...</p>
    </div>
  );

  if (!isAuthorized) return null;

  return (
    <AdminLayout>
      <div className="text-right">
        
        {/* رأس محتوى لوحة التحكم */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-6 mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-amber-400">لوحة التحكم الإدارية الفاخرة</h2>
            <p className="text-slate-400 text-xs mt-1">مركز الإدارة الشامل لطلبات الحجز، المستخدمين، الألبوم، والرسائل والباقات.</p>
          </div>
          <button onClick={fetchDashboardData} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2">
            {loadingData ? 'جاري التحديث...' : 'تحديث البيانات الحية 🔄'}
          </button>
        </div>

        {/* كروت الإحصائيات (تتضمن الألبوم) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div><span className="text-xl mb-1 block">🗓️</span><h4 className="text-slate-400 text-[10px] font-semibold">طلبات الحجز</h4><p className="text-xl font-black text-white mt-1">{bookings.length}</p></div>
          <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div><span className="text-xl mb-1 block">👥</span><h4 className="text-slate-400 text-[10px] font-semibold">العملاء</h4><p className="text-xl font-black text-white mt-1">{users.length}</p></div>
          <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div><span className="text-xl mb-1 block">🖼️</span><h4 className="text-slate-400 text-[10px] font-semibold">صور الألبوم</h4><p className="text-xl font-black text-white mt-1">{photos.length}</p></div>
          <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div><span className="text-xl mb-1 block">📩</span><h4 className="text-slate-400 text-[10px] font-semibold">رسائل التواصل</h4><p className="text-xl font-black text-white mt-1">{messages.length}</p></div>
          <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div><span className="text-xl mb-1 block">📦</span><h4 className="text-slate-400 text-[10px] font-semibold">باقات التصوير</h4><p className="text-xl font-black text-amber-400 mt-1">{packagesCount}</p></div>
          <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div><span className="text-xl mb-1 block">🛡️</span><h4 className="text-slate-400 text-[10px] font-semibold">النظام</h4><p className="text-[10px] font-bold text-emerald-400 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded inline-block">مؤمن</p></div>
        </div>

        {/* =========================================================
            إدارة معرض الأعمال (الألبوم) 🖼️ - المحدث بأسهم الترتيب
            ========================================================= */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              <span>🖼️</span> إدارة معرض الصور وترتيبها
            </h3>
            <button onClick={() => setIsAddPhotoModalOpen(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2">
              <span>➕</span> إضافة صورة للمعرض
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-950/50 rounded-xl border border-slate-850">
              لا توجد صور في المعرض حالياً. 📸
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative aspect-[9/16] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                  <img src={photo.photo_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  
                  {/* 👈 أزرار التحكم بالترتيب والحذف (تظهر عند التمرير) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-3">
                    
                    {/* أزرار الترتيب (يمين/يسار) */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleMovePhoto(index, 'prev')} 
                        disabled={index === 0} 
                        className="bg-slate-800 hover:bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" title="تحريك للأمام"
                      >
                        ➡️
                      </button>
                      <button 
                        onClick={() => handleMovePhoto(index, 'next')} 
                        disabled={index === photos.length - 1} 
                        className="bg-slate-800 hover:bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" title="تحريك للخلف"
                      >
                        ⬅️
                      </button>
                    </div>

                    {/* زر الحذف */}
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center justify-center transition-all shadow-lg"
                      title="إزالة نهائية"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================
            إدارة المستخدمين
            ========================================================= */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
          <h3 className="text-lg font-bold text-purple-400 mb-6 flex items-center gap-2"><span>👥</span> إدارة حسابات العملاء والصلاحيات</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="w-full text-right text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-850"><tr><th className="p-4">تاريخ الانضمام</th><th className="p-4">بيانات العميل</th><th className="p-4">البريد الإلكتروني</th><th className="p-4 text-center">الصلاحية</th><th className="p-4 text-center">الإجراءات والتحكم</th></tr></thead>
              <tbody className="divide-y divide-slate-850/60 bg-slate-900/20">
                {users.length === 0 ? (<tr><td colSpan="5" className="text-center p-8 text-slate-500 text-sm">لا يوجد عملاء.</td></tr>) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-all">
                      <td className="p-4 text-xs font-mono text-slate-400" dir="ltr">{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="p-4"><p className="font-bold text-slate-100 text-sm mb-0.5">{u.full_name}</p><p className="text-[11px] text-amber-400 font-mono">@{u.username}</p><p className="text-[10px] text-slate-500 font-mono mt-1" dir="ltr">{u.phone}</p></td>
                      <td className="p-4 text-xs text-slate-300" dir="ltr">{u.email}</td>
                      <td className="p-4 align-middle text-center w-36"><select value={u.role || 'user'} onChange={(e) => handleUpdateUserRole(u, e.target.value)} className={`w-full text-[11px] font-bold px-2 py-1.5 rounded border outline-none cursor-pointer transition-colors ${ u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-300 border-slate-700' }`}><option value="user" className="bg-slate-900 text-slate-300">👤 عميل</option><option value="admin" className="bg-slate-900 text-purple-400">🛡️ مشرف</option></select></td>
                      <td className="p-4 align-middle text-center"><div className="flex items-center justify-center gap-1.5 flex-wrap w-32 mx-auto"><button onClick={() => openEditUserModal(u)} title="تعديل بيانات العميل والإيميل" className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-transparent text-amber-400 hover:text-slate-950 w-8 h-8 rounded flex items-center justify-center transition-all text-xs">📝</button><button onClick={() => handleForceChangePassword(u.id, u.full_name)} title="تغيير الباسوورد فورياً يدوياً" className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-transparent text-emerald-400 hover:text-slate-950 w-8 h-8 rounded flex items-center justify-center transition-all text-xs">🔐</button><button onClick={() => handleSendPasswordReset(u.email)} title="إرسال رابط استعادة الباسوورد عبر الإيميل" className="bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 hover:border-transparent text-blue-400 hover:text-white w-8 h-8 rounded flex items-center justify-center transition-all text-xs">📧</button><button onClick={() => handleDeleteUser(u.id, u.full_name)} title="حذف العميل نهائياً" className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-400 hover:text-white w-8 h-8 rounded flex items-center justify-center transition-all text-xs">🗑️</button></div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================
            إدارة طلبات الحجز 
            ========================================================= */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
          <h3 className="text-lg font-bold text-amber-400 mb-6 flex items-center gap-2"><span>🗓️</span> سجل طلبات الحجوزات السينمائية</h3>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-950/50 rounded-xl border border-slate-850">لا توجد طلبات حجز حالياً في النظام. 📅</div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-slate-950/80 p-5 md:p-6 rounded-2xl border border-slate-900 hover:border-amber-500/30 transition-all shadow-md relative">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-slate-850 pb-4 gap-4">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">🗓️</div><div><span className="text-[10px] text-slate-500 block font-bold mb-0.5">تاريخ الطلب</span><span className="text-xs font-medium text-slate-300" dir="ltr">{new Date(booking.created_at).toLocaleString('ar-SA')}</span></div></div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <select value={booking.status || 'معلق'} onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)} className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer transition-colors shadow-sm flex-1 md:flex-none text-center ${ booking.status === 'مؤكد' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : booking.status === 'ملغي' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30' }`}><option value="معلق" className="bg-slate-900 text-amber-400">⏳ معلق للاعتماد</option><option value="مؤكد" className="bg-slate-900 text-emerald-400">✅ تم التأكيد</option><option value="ملغي" className="bg-slate-900 text-red-400">❌ ملغي / معتذر</option></select>
                      <button onClick={() => handleDeleteBooking(booking.id)} className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-400 hover:text-slate-950 w-9 h-9 rounded-xl flex items-center justify-center transition-all">🗑️</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850"><h4 className="text-[10px] text-slate-500 font-bold mb-3 border-b border-slate-800 pb-2">بيانات العميل</h4><p className="font-bold text-slate-200 text-sm mb-3 flex items-center gap-2"><span>👤</span> {booking.customer_name}</p><div className="space-y-2"><button onClick={() => handleCopyToClipboard(booking.customer_phone, `${booking.id}-phone`)} className="w-full flex justify-between items-center text-xs text-slate-400 hover:text-amber-400 transition-colors group" dir="ltr"><span className="font-mono">{booking.customer_phone} 📞</span><span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{copiedFieldId === `${booking.id}-phone` ? 'تم النسخ' : 'نسخ'}</span></button><button onClick={() => handleCopyToClipboard(booking.customer_email, `${booking.id}-email`)} className="w-full flex justify-between items-center text-xs text-slate-400 hover:text-amber-400 transition-colors group" dir="ltr"><span className="truncate">{booking.customer_email} ✉️</span><span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{copiedFieldId === `${booking.id}-email` ? 'تم النسخ' : 'نسخ'}</span></button></div></div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 flex flex-col justify-between"><div><h4 className="text-[10px] text-slate-500 font-bold mb-3 border-b border-slate-800 pb-2">الباقة المحجوزة</h4><p className="font-bold text-slate-200 text-sm mb-2 flex items-center gap-2"><span>🎬</span> {booking.package_name}</p></div><div className="mt-2"><span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 block text-center">{Number(booking.package_price).toLocaleString()} ر.س</span></div></div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850"><h4 className="text-[10px] text-slate-500 font-bold mb-3 border-b border-slate-800 pb-2">معلومات المناسبة</h4><p className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2"><span>📅</span> {booking.event_date || 'غير محدد'}</p><p className="text-xs text-slate-300 flex items-center gap-2"><span>📍</span> المدينة: <span className="font-bold">{booking.event_city}</span></p></div>
                  </div>
                  {booking.notes && (<div className="mt-4 bg-slate-900/30 border border-slate-850 p-4 rounded-xl"><span className="text-[10px] text-slate-500 font-bold mb-1.5 flex items-center gap-1">📝 الملاحظات والطلبات الخاصة</span><p className="text-xs text-slate-300 leading-relaxed text-justify">{booking.notes}</p></div>)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================
            إدارة الباقات
            ========================================================= */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><span>📦</span> التحكم وتعديل باقات الاستوديو</h3>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2"><span>➕</span> إضافة باقة جديدة</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="w-full text-right text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-850"><tr><th className="p-4">اسم الباقة</th><th className="p-4">السعر الحالي</th><th className="p-4 hidden md:table-cell">الوصف</th><th className="p-4 text-center">الإجراءات</th></tr></thead>
              <tbody className="divide-y divide-slate-850/60 bg-slate-900/20">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-900/50 transition-all">
                    <td className="p-4 font-bold text-slate-100">{pkg.name}</td><td className="p-4 text-amber-400 font-mono font-bold">{Number(pkg.price).toLocaleString()} ر.س</td><td className="p-4 hidden md:table-cell text-xs text-slate-400 max-w-xs truncate">{pkg.description}</td>
                    <td className="p-4 text-center flex justify-center gap-2"><button onClick={() => openEditModal(pkg)} className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 text-amber-400 hover:text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">📝 تعديل الباقة</button><button onClick={() => handleDeletePackage(pkg.id)} className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">🗑️ حذف</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================
            صندوق الوارد (رسائل)
            ========================================================= */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2"><span>📥</span> صندوق الوارد لرسائل الاستفسارات</h3>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">لا توجد أي رسائل تواصل معلقة حالياً. 🎉</div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg) => {
                const name = msg.client_name || "غير محدد"; const email = msg.client_email || "غير مسجل"; const phone = msg.client_phone || "غير مسجل"; const content = msg.description || "";
                return (
                  <div key={msg.id} className="bg-slate-950/80 p-6 rounded-2xl border border-slate-900 hover:border-slate-800/60 transition-all shadow-md relative">
                    <div className="flex justify-between items-center mb-5 border-b border-slate-900 pb-3"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span><span className="text-[11px] text-slate-500 font-medium" dir="ltr">{msg.created_at ? new Date(msg.created_at).toLocaleString('ar-SA') : 'تاريخ غير معروف'}</span></div><button onClick={() => handleDeleteMessage(msg.id)} className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-400 hover:text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">🗑️ حذف الرسالة</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl flex justify-between items-center gap-2 group/box hover:border-slate-700 transition-all"><div className="overflow-hidden"><span className="block text-[10px] text-slate-500 font-bold mb-0.5">اسم العميل</span><span className="text-xs text-slate-200 font-semibold block truncate">{name}</span></div><button onClick={() => handleCopyToClipboard(name, `${msg.id}-name`)} className="bg-slate-950 group-hover/box:bg-amber-500/10 text-slate-400 group-hover/box:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md transition-all">{copiedFieldId === `${msg.id}-name` ? '📋 تم!' : 'نسخ'}</button></div><div className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl flex justify-between items-center gap-2 group/box hover:border-slate-700 transition-all"><div className="overflow-hidden w-full text-right"><span className="block text-[10px] text-slate-500 font-bold mb-0.5">البريد الإلكتروني</span><span className="text-xs text-slate-200 font-mono block truncate text-left" dir="ltr">{email}</span></div><button onClick={() => handleCopyToClipboard(email, `${msg.id}-email`)} disabled={email === 'غير مسجل'} className="bg-slate-950 group-hover/box:bg-amber-500/10 text-slate-400 group-hover/box:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md transition-all">{copiedFieldId === `${msg.id}-email` ? '📋 تم!' : 'نسخ'}</button></div><div className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl flex justify-between items-center gap-2 group/box hover:border-slate-700 transition-all"><div className="overflow-hidden w-full text-right"><span className="block text-[10px] text-slate-500 font-bold mb-0.5">رقم الجوال</span><span className="text-xs text-slate-200 font-mono block truncate text-left" dir="ltr">{phone}</span></div><button onClick={() => handleCopyToClipboard(phone, `${msg.id}-phone`)} disabled={phone === 'غير مسجل'} className="bg-slate-950 group-hover/box:bg-amber-500/10 text-slate-400 group-hover/box:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md transition-all">{copiedFieldId === `${msg.id}-phone` ? '📋 تم!' : 'نسخ'}</button></div></div>
                    <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl group/msgbox hover:border-slate-800 transition-all relative"><div className="flex justify-between items-center mb-2 border-b border-slate-950 pb-1.5"><span className="text-[10px] text-slate-500 font-bold">مضمون الرسالة</span><button onClick={() => handleCopyToClipboard(content, `${msg.id}-content`)} className="text-slate-500 group-hover/msgbox:text-amber-400 text-[10px] font-bold transition-all flex items-center gap-1">{copiedFieldId === `${msg.id}-content` ? '📋 تم النسخ!' : 'نسخ الرسالة 📑'}</button></div><p className="text-slate-300 text-xs leading-6 whitespace-pre-line text-justify">{content}</p></div>
                  </div>
                  
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* =========================================================
          النوافذ المنبثقة (Modals)
          ========================================================= */}

      {/* نافذة إضافة صورة للألبوم */}
      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 text-right shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 rounded-t-3xl"></div>
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-xl font-black text-white flex items-center gap-2"><span className="text-indigo-400">🖼️</span> إضافة صورة للألبوم</h3></div>
              <button onClick={() => setIsAddPhotoModalOpen(false)} className="bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 w-8 h-8 rounded-full flex items-center justify-center transition-all">✕</button>
            </div>
            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div><label className="block text-slate-400 text-xs font-bold mb-2">رابط الصورة (URL)</label><input type="url" required placeholder="https://example.com/image.jpg" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm text-left font-mono" dir="ltr"/></div>
              <div className="mt-6 pt-4 border-t border-slate-850"><button type="submit" disabled={submittingPhoto} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black p-3.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">{submittingPhoto ? 'جاري الرفع...' : 'نشر الصورة في المعرض 🚀'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* النافذة المنبثقة لتعديل بيانات العميل */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 text-right shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-t-3xl"></div>
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-xl font-black text-white flex items-center gap-2"><span className="text-purple-400">📝</span> تعديل بيانات العميل</h3></div>
              <button onClick={() => setIsEditUserModalOpen(false)} className="bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 w-8 h-8 rounded-full flex items-center justify-center transition-all">✕</button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div><label className="block text-slate-400 text-xs font-bold mb-2">الاسم الكامل</label><input type="text" required value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-slate-400 text-xs font-bold mb-2">اسم المستخدم</label><input type="text" required dir="ltr" value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm text-left font-mono"/></div>
                <div><label className="block text-slate-400 text-xs font-bold mb-2">رقم الهاتف</label><input type="tel" required dir="ltr" value={editingUser.phone} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm text-left"/></div>
              </div>
              <div><label className="block text-slate-400 text-xs font-bold mb-2">البريد الإلكتروني الأساسي للمصادقة</label><input type="email" required dir="ltr" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm text-left font-mono"/></div>
              <div className="mt-6 pt-4 border-t border-slate-850"><button type="submit" disabled={submittingUserEdit} className="w-full bg-purple-500 hover:bg-purple-400 text-white font-black p-3.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">{submittingUserEdit ? 'جاري الحفظ والتوثيق...' : 'حفظ بيانات العميل 💾'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* نوافذ الباقات */}
      {isEditModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-t-3xl"></div>
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-xl font-black text-white flex items-center gap-2"><span className="text-amber-400">⚙️</span> تعديل بيانات الباقة</h3></div>
              <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 w-8 h-8 rounded-full flex items-center justify-center transition-all">✕</button>
            </div>
            <form onSubmit={handleUpdatePackage} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-slate-400 text-xs font-bold mb-2">اسم الباقة</label><input type="text" required value={editingPackage.name} onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm"/></div>
                <div><label className="block text-slate-400 text-xs font-bold mb-2">سعر الباقة (ريال)</label><div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-xl focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all"><input type="range" min="100" max="15000" step="50" value={editingPackage.price} onChange={(e) => setEditingPackage({...editingPackage, price: e.target.value})} className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mx-2"/><input type="number" required value={editingPackage.price} onChange={(e) => setEditingPackage({...editingPackage, price: e.target.value})} className="w-20 bg-transparent text-amber-400 focus:outline-none text-sm text-center font-mono font-black" dir="ltr"/></div></div>
              </div>
              <div><label className="block text-slate-400 text-xs font-bold mb-2">رابط الصورة</label><input type="url" required value={editingPackage.image_url} onChange={(e) => setEditingPackage({...editingPackage, image_url: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-xs text-left font-mono" dir="ltr"/></div>
              <div><label className="block text-slate-400 text-xs font-bold mb-2">الوصف القصير</label><textarea rows="2" required value={editingPackage.description} onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm resize-none"/></div>
              <div><label className="block text-amber-400 text-xs font-bold mb-1">الميزات</label><textarea rows="5" required value={editingPackage.features_string} onChange={(e) => setEditingPackage({...editingPackage, features_string: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-xs leading-7 resize-none"/></div>
              <div className="flex gap-3 pt-4"><button type="submit" disabled={submittingEdit} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black p-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all disabled:opacity-50">{submittingEdit ? 'جاري...' : 'حفظ التحديثات ✨'}</button></div>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 rounded-t-3xl"></div>
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-xl font-black text-white flex items-center gap-2"><span className="text-emerald-400">➕</span> إضافة باقة</h3></div>
              <button onClick={() => setIsAddModalOpen(false)} className="bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 w-8 h-8 rounded-full flex items-center justify-center transition-all">✕</button>
            </div>
            <form onSubmit={handleAddPackage} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-slate-400 text-xs font-bold mb-2">اسم الباقة الجديدة</label><input type="text" required placeholder="مثال: الباقة الألماسية" value={newPackage.name} onChange={(e) => setNewPackage({...newPackage, name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"/></div>
                <div><label className="block text-slate-400 text-xs font-bold mb-2">السعر المبدئي (ريال)</label><div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all"><input type="range" min="100" max="15000" step="50" value={newPackage.price} onChange={(e) => setNewPackage({...newPackage, price: e.target.value})} className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mx-2"/><input type="number" required value={newPackage.price} onChange={(e) => setNewPackage({...newPackage, price: e.target.value})} className="w-20 bg-transparent text-emerald-400 focus:outline-none text-sm text-center font-mono font-black" dir="ltr"/></div></div>
              </div>
              <div><label className="block text-slate-400 text-xs font-bold mb-2">رابط الصورة التعبيرية</label><input type="url" required placeholder="https://example.com/image.jpg" value={newPackage.image_url} onChange={(e) => setNewPackage({...newPackage, image_url: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-xs text-left font-mono" dir="ltr"/></div>
              <div><label className="block text-slate-400 text-xs font-bold mb-2">وصف مختصر للباقة</label><textarea rows="2" required placeholder="باقة متكاملة لتغطية حفلات الزفاف الفاخرة..." value={newPackage.description} onChange={(e) => setNewPackage({...newPackage, description: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm resize-none"/></div>
              <div><label className="block text-emerald-400 text-xs font-bold mb-1">الميزات المتضمنة بالباقة</label><textarea rows="5" required placeholder="تصوير 8 ساعات متواصلة..." value={newPackage.features_string} onChange={(e) => setNewPackage({...newPackage, features_string: e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-xs leading-7 resize-none"/></div>
              <div className="flex gap-3 pt-4"><button type="submit" disabled={submittingAdd} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black p-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50">{submittingAdd ? 'جاري الإضافة...' : 'نشر الباقة 🚀'}</button></div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

__________________________________________________

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedFieldId, setCopiedFieldId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: msgsData } = await supabase
      .from('expenses')
      .select('*')
      .like('category', 'رسالة تواصل%')
      .order('created_at', { ascending: false });
    
    if (msgsData) setMessages(msgsData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCopyToClipboard = (text, uniqueId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFieldId(uniqueId);
    setTimeout(() => setCopiedFieldId(''), 2000);
  };

  const handleDeleteMessage = async (messageId) => {
    if (await confirmAction('حذف رسالة', 'هل أنت متأكد من حذف هذه الرسالة؟', 'حذف', true)) {
      try {
        await supabase.from('expenses').delete().eq('id', messageId);
        setMessages(messages.filter(m => m.id !== messageId));
        showSuccess('تم الحذف.');
      } catch (err) { showError('حدث خطأ.'); }
    }
  };

  return (
    <AdminLayout>
      <div className="text-right">
        <div className="flex justify-between items-center border-b border-slate-900 pb-6 mb-8">
          <h2 className="text-2xl font-black text-amber-400">صندوق الوارد لرسائل الاستفسارات</h2>
          <button onClick={fetchData} className="bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold px-4 py-2.5 rounded-xl">تحديث 🔄</button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">لا توجد رسائل حالياً.</div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-slate-950/80 p-6 rounded-2xl border border-slate-900 hover:border-slate-800 transition-all shadow-md relative">
                  <div className="flex justify-between items-center mb-5 border-b border-slate-900 pb-3">
                    <span className="text-[11px] text-slate-500 font-medium" dir="ltr">{new Date(msg.created_at).toLocaleString('ar-SA')}</span>
                    <button onClick={() => handleDeleteMessage(msg.id)} className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-lg">🗑️ حذف الرسالة</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                      <div><span className="block text-[10px] text-slate-500 font-bold mb-0.5">اسم العميل</span><span className="text-xs text-slate-200">{msg.client_name || "غير محدد"}</span></div>
                      <button onClick={() => handleCopyToClipboard(msg.client_name, `${msg.id}-name`)} className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400">{copiedFieldId === `${msg.id}-name` ? 'تم!' : 'نسخ'}</button>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                      <div><span className="block text-[10px] text-slate-500 font-bold mb-0.5">البريد</span><span className="text-xs text-slate-200" dir="ltr">{msg.client_email || "غير مسجل"}</span></div>
                      <button onClick={() => handleCopyToClipboard(msg.client_email, `${msg.id}-email`)} className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400">{copiedFieldId === `${msg.id}-email` ? 'تم!' : 'نسخ'}</button>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                      <div><span className="block text-[10px] text-slate-500 font-bold mb-0.5">رقم الجوال</span><span className="text-xs text-slate-200" dir="ltr">{msg.client_phone || "غير متوفر"}</span></div>
                      <button onClick={() => handleCopyToClipboard(msg.client_phone, `${msg.id}-phone`)} className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400">{copiedFieldId === `${msg.id}-phone` ? 'تم!' : 'نسخ'}</button>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                      <span className="block text-[10px] text-slate-500 font-bold mb-0.5">نوع التواصل</span>
                      <span className="text-xs text-amber-400">{msg.category || "غير محدد"}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl relative">
                    <div className="flex justify-between items-center mb-2"><span className="text-[10px] text-slate-500 font-bold">مضمون الرسالة</span><button onClick={() => handleCopyToClipboard(msg.description, `${msg.id}-content`)} className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400">{copiedFieldId === `${msg.id}-content` ? 'تم النسخ!' : 'نسخ الرسالة 📑'}</button></div>
                    <p className="text-slate-300 text-xs leading-6 text-justify">{msg.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}