import React from 'react';

export default function AlbumList({ photos, onAddPhoto, onDeletePhoto, onMovePhoto }) {
  return (
    <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-brand-main">🖼️ إدارة معرض الصور وترتيبها</h3>
        <button onClick={onAddPhoto} className="bg-brand-btn text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">➕ إضافة صورة</button>
      </div>
      
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-brand rounded-2xl bg-brand-main shadow-sm">
          <span className="text-4xl mb-4">📸</span>
          <h3 className="text-lg font-bold text-brand-main">لا توجد صور في الألبوم</h3>
          <p className="text-brand-muted text-sm mt-1">ابدأ بإضافة صور جديدة لتظهر في معرض الصور الخاص بك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative aspect-[9/16] bg-brand-main rounded-xl overflow-hidden border border-brand group shadow-lg">
              <img src={photo.photo_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              
              {/* أزرار التحكم بالترتيب والحذف */}
              <div className="absolute inset-0 bg-brand-card/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => onMovePhoto(index, 'prev')} 
                    disabled={index === 0}
                    className="bg-brand-card border border-brand text-brand-text w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-brand-card-hover shadow-sm"
                  >➡️</button>
                  <button 
                    onClick={() => onMovePhoto(index, 'next')} 
                    disabled={index === photos.length - 1}
                    className="bg-brand-card border border-brand text-brand-text w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-brand-card-hover shadow-sm"
                  >⬅️</button>
                </div>
                <button onClick={() => onDeletePhoto(photo.id)} className="bg-brand-card border border-brand hover:bg-brand-card-hover text-red-700 text-xs font-bold px-4 py-1.5 rounded-full mt-2 shadow-sm transition-all">🗑️ حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}