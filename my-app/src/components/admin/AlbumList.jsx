import React from 'react';

export default function AlbumList({ photos, onAddPhoto, onDeletePhoto, onMovePhoto }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-indigo-400">🖼️ إدارة معرض الصور وترتيبها</h3>
        <button onClick={onAddPhoto} className="bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl">➕ إضافة صورة</button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative aspect-[9/16] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
            <img src={photo.photo_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            
            {/* أزرار التحكم بالترتيب والحذف */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => onMovePhoto(index, 'prev')} 
                  disabled={index === 0}
                  className="bg-slate-800 hover:bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                >➡️</button>
                <button 
                  onClick={() => onMovePhoto(index, 'next')} 
                  disabled={index === photos.length - 1}
                  className="bg-slate-800 hover:bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                >⬅️</button>
              </div>
              <button onClick={() => onDeletePhoto(photo.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full mt-2">🗑️ حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}