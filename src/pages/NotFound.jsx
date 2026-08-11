import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-brand-main flex flex-col items-center justify-center p-6 text-center select-none">
      
      {!isOnline ? (
        // الحالة الأولى: انقطاع الاتصال بالإنترنت
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-card border border-brand shadow-xl mb-6">
            <svg className="w-12 h-12 text-brand-accent animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3l18 18" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-brand-main mb-3">
            لا يوجد اتصال بالإنترنت
          </h1>
          <p className="text-brand-muted text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            يبدو أنك فقدت الاتصال بالشبكة. يرجى التحقق من إعدادات الإنترنت لديك ثم محاولة إعادة الاتصال.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={handleRefresh}
              className="bg-brand-btn hover:bg-brand-accent-hover text-brand-text font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        // الحالة الثانية: الصفحة غير موجودة (404)
        <>
          <h1 className="!text-[160px] md:!text-[240px] font-black text-brand-accent leading-none mb-2 opacity-20 font-mono">
            404
          </h1>
          
          <div className="z-10 -mt-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-card border border-brand shadow-md mb-6">
              <svg className="w-10 h-10 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-brand-main mb-3">
              عذراً، الصفحة غير موجودة
            </h2>
            <p className="text-brand-muted text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              يبدو أن الرابط الذي تبحث عنه غير متاح حالياً أو تم نقلة إلى عنوان آخر.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-xs sm:max-w-md mx-auto justify-center">
              <button 
                onClick={() => navigate('/')}
                className="bg-brand-btn hover:bg-brand-accent-hover text-brand-text font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                العودة للرئيسية
              </button>
              
              <button 
                onClick={() => window.history.back()}
                className="bg-brand-card hover:bg-brand-card-hover border border-brand text-brand-text font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-sm"
              >
                الصفحة السابقة
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}