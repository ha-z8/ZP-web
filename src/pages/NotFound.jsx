import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-main flex flex-col items-center justify-center p-6 text-center">
      
      {/* رقم 404 متناسق مع لون الهوية */}
      <h1 className="!text-[180px] md:!text-[280px] font-black !text-brand-main leading-none mb-6 select-none opacity-90">
        404
      </h1>
      
      <div className="z-10">
        <h2 className="text-3xl font-bold text-brand-main mb-4">
          عذراً، الصفحة غير موجودة
        </h2>
        <p className="text-brand-muted max-w-sm mx-auto mb-10">
          يبدو أن الرابط الذي تبحث عنه غير متاح حالياً.
        </p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="bg-brand-btn text-brand-text font-bold py-4 rounded-xl transition-all shadow-lg hover:opacity-90"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}