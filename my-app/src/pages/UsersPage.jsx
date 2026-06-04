import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [submittingUserEdit, setSubmittingUserEdit] = useState(false);

  const fetchUsers = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);
  };

  useEffect(() => { fetchUsers(); }, []);

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
      title: `تغيير كلمة مرور "${userName}"`, input: 'text', inputPlaceholder: '••••••••', showCancelButton: true, confirmButtonText: 'حفظ واعتماد', cancelButtonText: 'إلغاء',
      inputValidator: (value) => { if (!value) return 'يجب إدخال كلمة مرور!'; if (value.length < 6) return 'كلمة المرور قصيرة جداً!'; },
      customClass: { popup: 'bg-slate-900 border border-slate-800 rounded-3xl', title: 'text-emerald-400', input: 'bg-slate-950 border border-slate-800 text-white', confirmButton: 'bg-emerald-500', cancelButton: 'bg-slate-800' }, background: '#0f172a', color: '#cbd5e1'
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

  return (
    <AdminLayout>
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-purple-400">👥 إدارة حسابات العملاء</h3>
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded-xl text-sm focus:border-purple-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300 min-w-[600px]">
            <thead className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">العميل</th>
                <th className="p-4">البريد</th>
                <th className="p-4 text-center">الصلاحية</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-white">{u.full_name}</p>
                    <p className="text-amber-400 text-[10px]">@{u.username}</p>
                  </td>
                  <td className="p-3 text-[11px] md:text-sm truncate">{u.email}</td>
                  <td className="p-3 text-center">
                    <select value={u.role || 'user'} onChange={(e) => handleUpdateUserRole(u, e.target.value)} className="bg-slate-950 border border-slate-700 p-1 rounded text-[10px] md:text-xs">
                      <option value="user">👤 عميل</option>
                      <option value="admin">🛡️ مشرف</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => { setEditingUser(u); setIsEditUserModalOpen(true); }} className="bg-slate-800 hover:bg-amber-500 p-2 rounded-lg border border-slate-700">📝</button>
                      <button onClick={() => handleForceChangePassword(u.id, u.full_name)} className="bg-slate-800 hover:bg-emerald-500 p-2 rounded-lg border border-slate-700">🔐</button>
                      <button onClick={() => handleSendPasswordReset(u.email)} className="bg-slate-800 hover:bg-blue-500 p-2 rounded-lg border border-slate-700">📧</button>
                      <button onClick={() => handleDeleteUser(u.id, u.full_name)} className="bg-slate-800 hover:bg-red-500 p-2 rounded-lg border border-slate-700">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6">📝 تعديل بيانات العميل</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input type="text" value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" placeholder="الاسم الكامل" />
              <input type="text" value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" placeholder="اسم المستخدم" />
              <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" placeholder="البريد الإلكتروني" />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-purple-500 p-3 rounded-xl font-bold text-white">{submittingUserEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
                <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="flex-1 bg-slate-800 p-3 rounded-xl font-bold text-slate-300">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}