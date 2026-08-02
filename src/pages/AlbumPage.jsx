import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function AlbumPage() {
  const [photos, setPhotos] = useState([]);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('album_photos').select('*').order('sort_order', { ascending: true });
    if (data) setPhotos(data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleMovePhoto = async (photoId, direction) => {
    const index = photos.findIndex(p => p.id === photoId);
    if ((direction === 'left' && index === 0) || (direction === 'right' && index === photos.length - 1)) return;

    const newPhotos = [...photos];
    const swapIndex = direction === 'left' ? index - 1 : index + 1;
    [newPhotos[index], newPhotos[swapIndex]] = [newPhotos[swapIndex], newPhotos[index]];
    
    newPhotos[index].sort_order = index;
    newPhotos[swapIndex].sort_order = swapIndex;
    setPhotos(newPhotos);

    supabase.from('album_photos').update({ sort_order: newPhotos[index].sort_order }).eq('id', newPhotos[index].id);
    supabase.from('album_photos').update({ sort_order: newPhotos[swapIndex].sort_order }).eq('id', newPhotos[swapIndex].id);
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setSubmittingPhoto(true);
    try {
      await supabase.from('album_photos').insert([{ photo_url: newPhotoUrl, sort_order: photos.length }]);
      showSuccess('تمت الإضافة بنجاح');
      setIsAddPhotoModalOpen(false);
      setNewPhotoUrl('');
      fetchData();
    } catch (err) { showError('حدث خطأ'); } finally { setSubmittingPhoto(false); }
  };

  const handleDeletePhoto = async (photoId) => {
    if (await confirmAction('حذف', 'هل أنت متأكد من حذف هذه الصورة؟', 'حذف', true)) {
      setPhotos(photos.filter(p => p.id !== photoId));
      await supabase.from('album_photos').delete().eq('id', photoId);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-brand-main">🖼️ إدارة الألبوم</h3>
          <div className="flex gap-2">
            <button onClick={fetchData} className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-card-hover transition-all shadow-sm">تحديث 🔄</button>
            <button onClick={() => setIsAddPhotoModalOpen(true)} className="bg-brand-btn text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">➕ إضافة صورة</button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-brand rounded-2xl bg-brand-main shadow-sm">
            <span className="text-4xl mb-4">📸</span>
            <h3 className="text-lg font-bold text-brand-main">لا توجد صور في الألبوم</h3>
            <p className="text-brand-muted text-sm mt-1">ابدأ بإضافة صور جديدة لتظهر في معرض الصور الخاص بك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[9/16] bg-brand-main rounded-xl overflow-hidden border border-brand group shadow-lg">
                <img src={photo.photo_url} alt="Album" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-brand-card/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleMovePhoto(photo.id, 'left')} className="bg-brand-card border border-brand p-2 rounded-full hover:bg-brand-card-hover text-xs shadow-sm">➡️</button>
                    <button onClick={() => handleMovePhoto(photo.id, 'right')} className="bg-brand-card border border-brand p-2 rounded-full hover:bg-brand-card-hover text-xs shadow-sm">⬅️</button>
                  </div>
                  <button onClick={() => handleDeletePhoto(photo.id)} className="bg-brand-card border border-brand text-xs font-bold px-4 py-1 rounded-full hover:bg-brand-card-hover text-red-700 shadow-sm">🗑️ حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6">➕ إضافة صورة</h3>
            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">رابط الصورة</label>
                <input type="url" required placeholder="رابط الصورة" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all">{submittingPhoto ? 'جاري...' : 'حفظ'}</button>
                <button type="button" onClick={() => setIsAddPhotoModalOpen(false)} className="flex-1 bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}