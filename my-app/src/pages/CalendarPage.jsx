import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfDay, isBefore } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { supabase } from '../supabase';
import AdminLayout from '../components/AdminLayout';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    // جلب جميع الحجوزات المؤكدة دون تقيد بشهر معين لتظهر في أي شهر نتنقل إليه
    const fetchConfirmedBookings = async () => {
      const { data } = await supabase.from('bookings').select('*').eq('status', 'مؤكد');
      if (data) setBookings(data);
    };
    fetchConfirmedBookings();
  }, []);

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const today = startOfDay(new Date());

  const getDayBookings = (day) => bookings.filter(b => isSameDay(new Date(b.event_date), day));

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDayStyles = (day, hasBooking) => {
    if (isSameDay(day, selectedDay)) return 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500';
    if (isSameDay(day, today)) return 'bg-slate-800 border-amber-400/50';
    if (isBefore(day, today)) return 'bg-slate-950 border-transparent opacity-50';
    if (hasBooking) return 'bg-emerald-900/30 border-emerald-500/30';
    return 'bg-slate-900 border-slate-800';
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 text-white">
        {/* التاريخ المزدوج في رأس الصفحة */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-amber-400">{format(currentDate, 'MMMM yyyy', { locale: arSA })}</h2>
          <p className="text-sm text-slate-500 font-bold">
            {new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { month: 'long', year: 'numeric' }).format(currentDate)}
          </p>
        </div>

        {/* أزرار التنقل */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="bg-slate-800 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700">السابق</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="bg-slate-800 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700">التالي</button>
        </div>

        {/* شبكة التقويم */}
        <div className="grid grid-cols-7 gap-2 bg-slate-900 p-3 rounded-3xl border border-slate-800">
          {daysInMonth.map(day => {
            const hasBooking = getDayBookings(day).length > 0;
            return (
              <div key={day} onClick={() => setSelectedDay(day)}
                className={`h-24 p-2 rounded-2xl cursor-pointer flex flex-col items-center justify-center border transition-all ${getDayStyles(day, hasBooking)}`}>
                <span className="text-xs font-bold">{format(day, 'd')}</span>
                <span className="text-[9px] text-slate-500">{new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric' }).format(day)}</span>
                {hasBooking && <div className="mt-2 w-full h-1 bg-emerald-500 rounded-full"></div>}
              </div>
            );
          })}
        </div>

        {/* تفاصيل الحجز */}
        <div className="mt-8">
          <h3 className="text-lg font-black mb-4 text-slate-300">
            حجوزات {format(selectedDay, 'd MMMM', { locale: arSA })}
          </h3>
          {getDayBookings(selectedDay).length > 0 ? (
            getDayBookings(selectedDay).map(b => (
              <div key={b.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 mb-4">
                <div className="flex justify-between items-start mb-6">
                  <div onClick={() => handleCopy(b.booking_code, `${b.id}-code`)} className="cursor-pointer group">
                    <h4 className="text-5xl font-black text-white group-hover:text-amber-400 transition-colors">
                      {copiedId === `${b.id}-code` ? 'تم النسخ!' : b.booking_code}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">اضغط للكود</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold">{b.package_name}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'الاسم', val: b.customer_name, id: `${b.id}-name` },
                    { label: 'الهاتف', val: b.customer_phone, id: `${b.id}-phone` },
                    { label: 'المدينة', val: b.event_city, id: `${b.id}-city` }
                  ].map(i => (
                    <div key={i.label} onClick={() => handleCopy(i.val, i.id)} 
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 active:scale-95 transition-all">
                      <p className="text-[9px] text-slate-500 uppercase font-bold">{i.label}</p>
                      <p className="text-sm font-bold text-emerald-400 truncate">
                        {copiedId === i.id ? 'تم النسخ!' : i.val}
                      </p>
                    </div>
                  ))}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">الحالة</p>
                    <p className="text-sm font-bold text-slate-400">{b.status}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-600 font-bold bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
              لا توجد حجوزات في هذا اليوم
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}