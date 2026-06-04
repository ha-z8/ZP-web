import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      
      {/* تم فرض اللون الأبيض والحجم الكبير جداً باستخدام ! */}
      <h1 className="!text-[180px] md:!text-[280px] font-black !text-white leading-none mb-6 select-none">
        404
      </h1>
      
      <div className="z-10">
        <h2 className="text-3xl font-bold text-white mb-4">
          عذراً، الصفحة غير موجودة
        </h2>
        <p className="text-slate-400 max-w-sm mx-auto mb-10">
          يبدو أن الرابط الذي تبحث عنه غير متاح حالياً.
        </p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}