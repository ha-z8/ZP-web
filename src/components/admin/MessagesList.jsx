import React from 'react';

export default function MessagesList({ messages, onDelete, handleCopyToClipboard, copiedFieldId }) {
  return (
    <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
      <h3 className="text-lg font-bold text-brand-main mb-6 flex items-center gap-2">
        <span>📥</span> صندوق الوارد لرسائل الاستفسارات
      </h3>
      {messages.length === 0 ? (
        <div className="text-center py-12 text-brand-muted text-sm">لا توجد أي رسائل تواصل معلقة حالياً. 🎉</div>
      ) : (
        <div className="space-y-8">
          {messages.map((msg) => {
            const name = msg.client_name || "غير محدد"; 
            const email = msg.client_email || "غير مسجل"; 
            const phone = msg.client_phone || "غير مسجل"; 
            const content = msg.description || "";
            
            return (
              <div key={msg.id} className="bg-brand-main p-6 rounded-2xl border border-brand hover:border-brand-accent transition-all shadow-md relative">
                <div className="flex justify-between items-center mb-5 border-b border-brand pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-main animate-pulse"></span>
                    <span className="text-[11px] text-brand-muted font-medium" dir="ltr">
                      {msg.created_at ? new Date(msg.created_at).toLocaleString('ar-SA') : 'تاريخ غير معروف'}
                    </span>
                  </div>
                  <button 
                    onClick={() => onDelete(msg.id)} 
                    className="bg-brand-card hover:bg-brand-card-hover border border-brand text-red-700 hover:text-red-800 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                  >
                    🗑️ حذف الرسالة
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* اسم العميل */}
                  <div className="bg-brand-card border border-brand p-3 rounded-xl flex justify-between items-center gap-2 group/box hover:border-brand-accent transition-all shadow-sm">
                    <div className="overflow-hidden">
                      <span className="block text-[10px] text-brand-muted font-bold mb-0.5">اسم العميل</span>
                      <span className="text-xs text-brand-text font-semibold block truncate">{name}</span>
                    </div>
                    <button onClick={() => handleCopyToClipboard(name, `${msg.id}-name`)} className="bg-brand-main group-hover/box:bg-brand-card hover:bg-brand-card-hover text-brand-muted group-hover/box:text-brand-main text-[10px] font-bold px-2 py-1 rounded-md transition-all border border-brand shadow-sm">
                      {copiedFieldId === `${msg.id}-name` ? '📋 تم!' : 'نسخ'}
                    </button>
                  </div>
                  
                  {/* البريد */}
                  <div className="bg-brand-card border border-brand p-3 rounded-xl flex justify-between items-center gap-2 group/box hover:border-brand-accent transition-all shadow-sm">
                    <div className="overflow-hidden w-full text-right">
                      <span className="block text-[10px] text-brand-muted font-bold mb-0.5">البريد الإلكتروني</span>
                      <span className="text-xs text-brand-text font-mono block truncate text-left" dir="ltr">{email}</span>
                    </div>
                    <button onClick={() => handleCopyToClipboard(email, `${msg.id}-email`)} disabled={email === 'غير مسجل'} className="bg-brand-main group-hover/box:bg-brand-card hover:bg-brand-card-hover text-brand-muted group-hover/box:text-brand-main text-[10px] font-bold px-2 py-1 rounded-md transition-all border border-brand shadow-sm disabled:opacity-50">
                      {copiedFieldId === `${msg.id}-email` ? '📋 تم!' : 'نسخ'}
                    </button>
                  </div>
                  
                  {/* الهاتف */}
                  <div className="bg-brand-card border border-brand p-3 rounded-xl flex justify-between items-center gap-2 group/box hover:border-brand-accent transition-all shadow-sm">
                    <div className="overflow-hidden w-full text-right">
                      <span className="block text-[10px] text-brand-muted font-bold mb-0.5">رقم الجوال</span>
                      <span className="text-xs text-brand-text font-mono block truncate text-left" dir="ltr">{phone}</span>
                    </div>
                    <button onClick={() => handleCopyToClipboard(phone, `${msg.id}-phone`)} disabled={phone === 'غير مسجل'} className="bg-brand-main group-hover/box:bg-brand-card hover:bg-brand-card-hover text-brand-muted group-hover/box:text-brand-main text-[10px] font-bold px-2 py-1 rounded-md transition-all border border-brand shadow-sm disabled:opacity-50">
                      {copiedFieldId === `${msg.id}-phone` ? '📋 تم!' : 'نسخ'}
                    </button>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="bg-brand-card border border-brand p-4 rounded-xl group/msgbox hover:border-brand-accent transition-all relative shadow-sm">
                  <div className="flex justify-between items-center mb-2 border-b border-brand pb-1.5">
                    <span className="text-[10px] text-brand-muted font-bold">مضمون الرسالة</span>
                    <button onClick={() => handleCopyToClipboard(content, `${msg.id}-content`)} className="text-brand-muted group-hover/msgbox:text-brand-main text-[10px] font-bold transition-all flex items-center gap-1">
                      {copiedFieldId === `${msg.id}-content` ? '📋 تم النسخ!' : 'نسخ الرسالة 📑'}
                    </button>
                  </div>
                  <p className="text-brand-text text-xs leading-6 whitespace-pre-line text-justify">{content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}