import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function CloudStoragePage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const CLOUD_MANAGER_URL = 'https://bcrpvhpayyjowsnwmmmu.supabase.co/functions/v1/cloud-manager';
  const CLOUDINARY_CLOUD_NAME = 'dnlqwwi89'; 
  const CLOUDINARY_UPLOAD_PRESET = 'my_album_preset';

  const fetchFiles = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(CLOUD_MANAGER_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({ action: 'list' })
      });
      const data = await response.json();
      setFiles(data.resources || []);
    } catch (err) {
      showError('فشل جلب الملفات');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'assets');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        showSuccess('تم رفع الملف بنجاح!');
        fetchFiles();
      } else {
        throw new Error(data.error?.message || 'فشل الرفع');
      }
    } catch (err) {
      showError('حدث خطأ أثناء رفع الملف.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (target) => {
    const isBatch = Array.isArray(target);
    const count = isBatch ? target.length : 1;

    if (await confirmAction('حذف نهائي', `هل أنت متأكد من حذف ${count} ملف نهائياً من السحابة؟`, 'حذف', true)) {
      try {
        const bodyData = isBatch 
          ? { action: 'delete', publicIds: target } 
          : { action: 'delete', publicId: target };

        const response = await fetch(CLOUD_MANAGER_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          body: JSON.stringify(bodyData)
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || 'فشل الحذف');

        showSuccess('تم حذف الملف بنجاح.');
        if (isBatch) setSelectedFiles([]);
        fetchFiles();
      } catch (err) {
        showError(err.message || 'حدث خطأ أثناء عملية الحذف.');
      }
    }
  };

  const handleBackgroundClick = (e) => {
    if (e.target.closest('table') || e.target.closest('button') || e.target.closest('label') || e.target.closest('input')) {
      return;
    }
    setSelectedFiles([]);
  };

  return (
    <AdminLayout>
      <div onClick={handleBackgroundClick} className="min-h-full">
        {previewImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-pointer" 
            onClick={() => setPreviewImage(null)}
          >
            <button className="absolute top-6 right-6 text-brand-main bg-brand-card hover:bg-brand-btn rounded-full w-10 h-10 flex items-center justify-center transition-all text-xl z-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={previewImage} 
              alt="Full Preview" 
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-brand-main flex items-center gap-2 whitespace-nowrap">
              <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h10a4 4 0 004-4M17 9l-5-5-5 5M12 4v12" />
              </svg>
              إدارة التخزين السحابي
            </h3>
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto max-w-full pb-1 md:pb-0">
              {selectedFiles.length > 0 && (
                <button 
                  onClick={() => handleDelete(selectedFiles)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap"
                >
                  حذف المختار ({selectedFiles.length})
                </button>
              )}
              
              {/* زر العودة للألبوم */}
              <button 
                onClick={() => navigate('/dashboard/album')}
                className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-card-hover transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للألبوم
              </button>

              <button 
                onClick={fetchFiles} 
                disabled={isRefreshing}
                className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-card-hover transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-70 whitespace-nowrap"
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

              <label className="bg-brand-btn text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {uploading ? 'جاري الرفع...' : 'إضافة ملف'}
                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
          </div>

          {isRefreshing && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mb-3"></div>
              <p className="text-xs">جاري جلب الملفات...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-brand rounded-2xl bg-brand-main shadow-sm">
              <h3 className="text-lg font-bold text-brand-main">لا توجد ملفات في السحابة</h3>
              <p className="text-brand-muted text-sm mt-1">ابدأ برفع ملفات جديدة لتظهر هنا.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-brand text-brand-muted text-[11px] uppercase">
                    <th className="p-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={files.length > 0 && selectedFiles.length === files.length}
                        onChange={(e) => setSelectedFiles(e.target.checked ? files.map(f => f.public_id) : [])}
                        className="w-4 h-4 rounded border-brand bg-brand-main cursor-pointer accent-brand-accent"
                      />
                    </th>
                    <th className="p-3">الملف</th>
                    <th className="p-3">الحجم</th>
                    <th className="p-3">تاريخ الرفع</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const isSelected = selectedFiles.includes(file.public_id);
                    const isCopied = copiedId === file.public_id;
                    return (
                      <tr 
                        key={file.public_id} 
                        className={`border-b border-brand transition-colors ${isSelected ? 'bg-brand-accent/15' : 'hover:bg-brand-main/40'}`}
                      >
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => setSelectedFiles(prev => isSelected ? prev.filter(id => id !== file.public_id) : [...prev, file.public_id])}
                            className="w-4 h-4 rounded border-brand bg-brand-main cursor-pointer accent-brand-accent"
                          />
                        </td>
                        <td className="p-3 flex items-center gap-3">
                          <img src={file.secure_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-brand shrink-0" />
                          <span className="text-xs font-bold text-brand-text truncate max-w-xs">{file.public_id.split('/').pop()}</span>
                        </td>
                        <td className="p-3 text-xs text-brand-muted whitespace-nowrap">{(file.bytes / 1024).toFixed(1)} KB</td>
                        <td className="p-3 text-xs text-brand-muted whitespace-nowrap">{new Date(file.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap">
                            <button onClick={() => setPreviewImage(file.secure_url)} className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-brand-card-hover transition-all shadow-sm whitespace-nowrap">معاينة</button>
                            
                            <button 
                              type="button"
                              onClick={() => handleCopy(file.secure_url, file.public_id)} 
                              className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap ${isCopied ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-brand-main border-brand text-brand-text hover:bg-brand-card-hover'}`}
                            >
                              {isCopied ? (
                                <>
                                  <svg className="w-3.5 h-3.5 animate-bounce shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  تم النسخ
                                </>
                              ) : (
                                'نسخ الرابط'
                              )}
                            </button>

                            <button onClick={() => handleDelete(file.public_id)} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm whitespace-nowrap">حذف</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}