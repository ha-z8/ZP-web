import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

export default function AlbumPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const CLOUDINARY_CLOUD_NAME = 'dnlqwwi89'; 
  const CLOUDINARY_UPLOAD_PRESET = 'my_album_preset';
  const EDGE_FUNCTION_DELETE_URL = 'https://bcrpvhpayyjowsnwmmmu.supabase.co/functions/v1/cloudinary-manager'; 

  const fetchData = async () => {
    setIsRefreshing(true);
    const { data } = await supabase.from('album_photos').select('*').order('sort_order', { ascending: true });
    if (data) setPhotos(data);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.secure_url) {
        setNewPhotoUrl(data.secure_url);
        showSuccess('تم رفع الصورة بنجاح!');
      } else {
        throw new Error(data.error?.message || 'فشل الرفع');
      }
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
    }
  };

  const handleMovePhoto = async (photoId, direction) => {
    const index = photos.findIndex(p => p.id === photoId);
    
    if ((direction === 'right' && index === 0) || (direction === 'left' && index === photos.length - 1)) return;

    const swapIndex = direction === 'right' ? index - 1 : index + 1;
    const newPhotos = [...photos];

    const item1 = { ...newPhotos[index] };
    const item2 = { ...newPhotos[swapIndex] };
    
    const tempOrder = item1.sort_order;
    item1.sort_order = item2.sort_order;
    item2.sort_order = tempOrder;

    newPhotos[index] = item2;
    newPhotos[swapIndex] = item1;
    setPhotos(newPhotos);

    try {
      await Promise.all([
        supabase.from('album_photos').update({ sort_order: item1.sort_order }).eq('id', item1.id),
        supabase.from('album_photos').update({ sort_order: item2.sort_order }).eq('id', item2.id)
      ]);
    } catch (err) {
      showError('حدث خطأ أثناء حفظ الترتيب');
      fetchData();
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhotoUrl) {
      showError('الرجاء رفع صورة أو إدخال رابط صحيح.');
      return;
    }
    setSubmittingPhoto(true);
    try {
      const maxSortOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sort_order || 0)) : -1;
      
      await supabase.from('album_photos').insert([{ 
        photo_url: newPhotoUrl, 
        sort_order: maxSortOrder + 1,
        is_active: true 
      }]);
      showSuccess('تمت إضافة الصورة بنجاح');
      setIsAddPhotoModalOpen(false);
      setNewPhotoUrl('');
      fetchData();
    } catch (err) { 
      showError('حدث خطأ أثناء الإضافة'); 
    } finally { 
      setSubmittingPhoto(false); 
    }
  };

  const handleTogglePhotoStatus = async (photo) => {
    const newStatus = !photo.is_active;
    try {
      const { error } = await supabase
        .from('album_photos')
        .update({ is_active: newStatus })
        .eq('id', photo.id);

      if (error) throw error;

      setPhotos(photos.map(p => p.id === photo.id ? { ...p, is_active: newStatus } : p));
      showSuccess(newStatus ? 'تم تفعيل الصورة وإظهارها في المعرض.' : 'تم تعطيل الصورة وإخفاؤها من المعرض.');
    } catch (err) {
      showError('حدث خطأ أثناء تغيير حالة الصورة.');
    }
  };

  const handleDeletePhoto = async (photo) => {
    if (await confirmAction('حذف', 'هل أنت متأكد من حذف هذه الصورة نهائياً من الألبوم؟', 'حذف', true)) {
      try {
        if (photo.photo_url && photo.photo_url.includes('cloudinary.com')) {
          try {
            const urlObj = new URL(photo.photo_url);
            const pathSegments = urlObj.pathname.split('/'); 
            const uploadIndex = pathSegments.findIndex(segment => segment === 'upload');
            let publicId = '';

            if (uploadIndex !== -1 && pathSegments.length > uploadIndex + 2) {
              let startIndex = uploadIndex + 1;
              if (pathSegments[startIndex].startsWith('v')) startIndex += 1;
              const fullPathWithExt = pathSegments.slice(startIndex).join('/');
              const lastDotIndex = fullPathWithExt.lastIndexOf('.');
              publicId = lastDotIndex !== -1 ? fullPathWithExt.substring(0, lastDotIndex) : fullPathWithExt;
            }

            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabase.supabaseKey;
            await fetch(EDGE_FUNCTION_DELETE_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
              },
              body: JSON.stringify({ publicId })
            });
          } catch (cloudErr) {
            console.warn('تعذر الحذف من سحابة Cloudinary:', cloudErr);
          }
        }

        const { error: dbError } = await supabase.from('album_photos').delete().eq('id', photo.id);
        if (dbError) throw dbError;
        
        setPhotos(photos.filter(p => p.id !== photo.id));
        showSuccess('تم حذف الصورة بنجاح.');
      } catch (err) {
        console.error(err);
        showError('حدث خطأ أثناء عملية الحذف.');
      }
    }
  };

  return (
    <AdminLayout>
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-pointer" 
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-brand-main bg-brand-card hover:bg-brand-btn rounded-full w-10 h-10 flex items-center justify-center transition-all text-xl z-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen Masterpiece" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl animate-fadeIn" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-brand-main flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            إدارة ألبوم الصور
          </h3>
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => navigate('/dashboard/cloud-storage')}
              className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-card-hover transition-all shadow-sm flex items-center gap-2"
            >
              التخزين السحابي
            </button>
            <button 
              onClick={fetchData} 
              disabled={isRefreshing}
              className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-card-hover transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-70"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
            </button>
            <button 
              onClick={() => setIsAddPhotoModalOpen(true)} 
              className="bg-brand-btn text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              إضافة صورة
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-brand rounded-2xl bg-brand-main shadow-sm">
            <svg className="w-12 h-12 text-brand-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-bold text-brand-main">لا توجد صور في الألبوم</h3>
            <p className="text-brand-muted text-sm mt-1">ابدأ بإضافة صور جديدة لتظهر في معرض الصور الخاص بك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[9/16] bg-brand-main rounded-xl overflow-hidden border border-brand group shadow-lg flex flex-col justify-between">
                <div className="relative w-full h-full">
                  <img src={photo.photo_url} alt="Album" className="w-full h-full object-cover" />
                  
                  {/* شارة حالة التفعيل */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-md backdrop-blur-md flex items-center gap-1 ${photo.is_active !== false ? 'bg-green-500/20 text-green-700 border-green-500/40' : 'bg-red-500/20 text-red-700 border-red-500/40'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${photo.is_active !== false ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      {photo.is_active !== false ? 'مفعلة' : 'معطلة'}
                    </span>
                  </div>

                  {/* أزرار الأسهم في منتصف الصورة (يمين ويسار) */}
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between items-center z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleMovePhoto(photo.id, 'right')} 
                      className="pointer-events-auto bg-black/80 hover:bg-black text-white p-2 rounded-full border border-white/20 shadow-xl transition-all" 
                      title="تحريك لليمين"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <button 
                      onClick={() => handleMovePhoto(photo.id, 'left')} 
                      className="pointer-events-auto bg-black/80 hover:bg-black text-white p-2 rounded-full border border-white/20 shadow-xl transition-all" 
                      title="تحريك لليسار"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>

                  {/* لوحة الأزرار الاحترافية عند التحويم */}
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                    
                    <div className="flex flex-col gap-2 w-full">
                      {/* زر التكبير الكامل */}
                      <button 
                        onClick={() => setFullScreenImage(photo.photo_url)} 
                        className="w-full py-2 px-3 rounded-xl border bg-brand-card/20 hover:bg-brand-card/40 text-white border-white/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        تكبير الصورة
                      </button>

                      {/* زر التفعيل أو التعطيل */}
                      <button 
                        onClick={() => handleTogglePhotoStatus(photo)} 
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${photo.is_active !== false ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40' : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/40'}`}
                      >
                        {photo.is_active !== false ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            تعطيل الإظهار
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            تفعيل الإظهار
                          </>
                        )}
                      </button>

                      {/* زر الحذف النهائي */}
                      <button 
                        onClick={() => handleDeletePhoto(photo)} 
                        className="w-full py-2 px-3 rounded-xl border bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        حذف نهائي
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6 flex items-center gap-2">
              <span className="text-brand-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
              إضافة صورة جديدة
            </h3>
            
            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">رفع صورة من الجهاز:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm cursor-pointer file:ml-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-btn file:text-brand-text"
                />
                {uploading && <p className="text-xs text-brand-accent mt-1">جاري رفع الصورة...</p>}
              </div>

              <div className="text-center text-xs text-brand-muted">— أو أدخل الرابط يدوياً —</div>

              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">رابط الصورة (URL)</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={newPhotoUrl} 
                  onChange={(e) => setNewPhotoUrl(e.target.value)} 
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                />
              </div>

              {newPhotoUrl && (
                <div className="w-20 h-28 mx-auto rounded-xl overflow-hidden border border-brand shadow-inner">
                  <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={submittingPhoto || uploading} 
                  className="flex-1 bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all disabled:opacity-50 hover:bg-brand-accent-hover"
                >
                  {submittingPhoto ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsAddPhotoModalOpen(false); setNewPhotoUrl(''); }} 
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