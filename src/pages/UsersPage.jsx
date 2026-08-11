import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // حالات مودل تعديل البيانات
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [submittingUserEdit, setSubmittingUserEdit] = useState(false);

  // حالات مودل تغيير كلمة المرور المخصص
  const [passwordUser, setPasswordUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const fetchUsers = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*');
    if (usersData) {
      const sortedUsers = usersData.sort((a, b) => {
        const isAAdmin = a.role === 'admin';
        const isBAdmin = b.role === 'admin';
        
        if (isAAdmin && !isBAdmin) return -1;
        if (!isAAdmin && isBAdmin) return 1;
        
        return new Date(a.created_at) - new Date(b.created_at);
      });
      setUsers(sortedUsers);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateUserRole = async (user, newRole) => {
    try {
      const { error } = await supabase.rpc('admin_update_user', { target_user_id: user.id, new_full_name: user.full_name, new_username: user.username, new_phone: user.phone, new_email: user.email, new_role: newRole });
      if (error) throw error;
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showSuccess(`تم تغيير صلاحية ${user.full_name} بنجاح.`);
      fetchUsers();
    } catch (err) { showError('حدث خطأ أثناء تغيير الصلاحيات.'); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmittingUserEdit(true);
    try {
      const { error } = await supabase.rpc('admin_update_user', { target_user_id: editingUser.id, new_full_name: editingUser.full_name, new_username: editingUser.username.toLowerCase(), new_phone: editingUser.phone, new_email: editingUser.email, new_role: editingUser.role });
      if (error) throw error;
      showSuccess('تم تحديث بيانات العميل بنجاح!');
      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (err) { showError('حدث خطأ أثناء حفظ التعديلات.'); } finally { setSubmittingUserEdit(false); }
  };

  // تنفيذ حفظ كلمة المرور الجديدة عبر المودل المخصص
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      showError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }
    setSubmittingPassword(true);
    try {
      const { error } = await supabase.rpc('admin_change_user_password', { target_user_id: passwordUser.id, new_password: newPasswordInput });
      if (error) throw error;
      showSuccess(`تم تغيير كلمة مرور "${passwordUser.full_name}" بنجاح!`);
      setIsPasswordModalOpen(false);
      setNewPasswordInput('');
      setPasswordUser(null);
    } catch (err) { 
      showError('حدث خطأ أثناء محاولة تغيير كلمة المرور.'); 
    } finally { 
      setSubmittingPassword(false); 
    }
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

  // دالة موحدة ومتوافقة مع الثيم لتأكيد إرسال رابط الاستعادة
  const handleSendPasswordReset = async (email) => {
    const isConfirmed = await confirmAction('إرسال رابط التغيير', `هل ترغب في إرسال رابط تغيير كلمة المرور إلى البريد: ${email}؟`, 'إرسال الرابط');
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      showSuccess('تم إرسال رابط استعادة كلمة المرور بنجاح للمستخدم.');
    } catch (err) { showError('حدث خطأ أثناء إرسال الرابط.'); }
  };

  return (
    <AdminLayout>
      <div className="bg-brand-card border border-brand rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-brand-main">إدارة حسابات المستخدمين</h3>
          <input 
            type="text" 
            placeholder="بحث بالاسم، اسم المستخدم، أو البريد..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-brand-main border border-brand text-brand-text px-4 py-2 rounded-xl text-sm focus:outline-none shadow-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-brand-text min-w-[600px]">
            <thead className="bg-brand-main text-brand-muted text-xs font-bold border-b border-brand">
              <tr>
                <th className="p-4">العميل / المشرف</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4 text-center">الصلاحية</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-brand-main transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={() => copyToClipboard(u.full_name, `${u.id}-name`)}
                        className="text-right font-bold text-brand-main hover:text-brand-accent transition-colors"
                        title="انقر للنسخ"
                      >
                        {u.full_name} {copiedId === `${u.id}-name` && <span className="text-[10px] text-emerald-500 font-normal">(تم النسخ)</span>}
                      </button>
                      <button 
                        onClick={() => copyToClipboard(u.username, `${u.id}-username`)}
                        className="text-right text-brand-muted text-[11px] hover:text-brand-text transition-colors font-mono"
                        title="انقر للنسخ"
                      >
                        @{u.username} {copiedId === `${u.id}-username` && <span className="text-[10px] text-emerald-500 font-normal">(تم النسخ)</span>}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-[11px] md:text-sm">
                    <button 
                      onClick={() => copyToClipboard(u.email, `${u.id}-email`)}
                      className="text-right hover:text-brand-accent transition-colors truncate max-w-[200px] block font-mono"
                      title="انقر للنسخ"
                    >
                      {u.email} {copiedId === `${u.id}-email` && <span className="text-[10px] text-emerald-500 font-normal">(تم النسخ)</span>}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <select value={u.role || 'user'} onChange={(e) => handleUpdateUserRole(u, e.target.value)} className="bg-brand-main border border-brand p-1.5 rounded-lg text-xs text-brand-text cursor-pointer">
                      <option value="user">عميل</option>
                      <option value="admin">مشرف</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => { setEditingUser(u); setIsEditUserModalOpen(true); }} className="bg-brand-main hover:bg-brand-card-hover p-2 rounded-lg border border-brand shadow-sm transition-all" title="تعديل">
                        <svg className="w-4 h-4 text-brand-text" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => { setPasswordUser(u); setNewPasswordInput(''); setIsPasswordModalOpen(true); }} className="bg-brand-main hover:bg-brand-card-hover p-2 rounded-lg border border-brand shadow-sm transition-all" title="تغيير كلمة المرور">
                        <svg className="w-4 h-4 text-brand-text" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </button>
                      <button onClick={() => handleSendPasswordReset(u.email)} className="bg-brand-main hover:bg-brand-card-hover p-2 rounded-lg border border-brand shadow-sm transition-all" title="إرسال رابط الاستعادة">
                        <svg className="w-4 h-4 text-brand-text" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.full_name)} className="bg-brand-main hover:bg-brand-card-hover p-2 rounded-lg border border-brand shadow-sm transition-all text-red-700" title="حذف">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودل تعديل بيانات المستخدم */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6">تعديل بيانات المستخدم</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">الاسم الكامل</label>
                <input type="text" value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="الاسم الكامل" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">اسم المستخدم</label>
                <input type="text" value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="اسم المستخدم" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">البريد الإلكتروني</label>
                <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="البريد الإلكتروني" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all">{submittingUserEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
                <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="flex-1 bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودل تغيير كلمة المرور المصمم بنظام ثيمات الموقع */}
      {isPasswordModalOpen && passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-2">تغيير كلمة المرور</h3>
            <p className="text-brand-muted text-xs mb-6">المستخدم: <strong className="text-brand-text">{passwordUser.full_name}</strong></p>
            
            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">كلمة المرور الجديدة</label>
                <input 
                  type="text" 
                  required 
                  placeholder="أدخل كلمة المرور الجديدة..." 
                  value={newPasswordInput} 
                  onChange={(e) => setNewPasswordInput(e.target.value)} 
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={submittingPassword} 
                  className="flex-1 bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all"
                >
                  {submittingPassword ? 'جاري الحفظ...' : 'حفظ واعتماد'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="flex-1 bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}