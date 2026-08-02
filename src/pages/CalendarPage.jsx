import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfDay, isBefore } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { supabase } from '../supabase';
import AdminLayout from '../components/AdminLayout';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [copiedStates, setCopiedStates] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase.from('bookings').select('*').eq('status', 'مؤكد');
      if (data) setBookings(data);
    };
    fetchBookings();
  }, []);

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const today = startOfDay(new Date());

  const getDayBookings = (day) => bookings.filter(b => isSameDay(new Date(b.event_date), day));
  
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
  };

  const getDayStyles = (day, hasBooking) => {
    if (isSameDay(day, selectedDay)) return 'bg-brand-card border-brand-accent shadow-md';
    if (isSameDay(day, today)) return 'bg-brand-card border-brand';
    if (hasBooking) return 'bg-brand-card border-brand';
    return 'bg-brand-main border-brand';
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 text-brand-text">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-black text-brand-main">{format(currentDate, 'MMMM yyyy', { locale: arSA })}</h2>
          <p className="text-xs md:text-sm text-brand-muted font-bold mt-1">{new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { month: 'long', year: 'numeric' }).format(currentDate)}</p>
        </div>

        {/* أزرار التنقل */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="bg-brand-card border border-brand text-brand-text px-5 py-2 rounded-xl text-sm font-bold hover:bg-brand-card-hover shadow-sm transition-all">السابق</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="bg-brand-card border border-brand text-brand-text px-5 py-2 rounded-xl text-sm font-bold hover:bg-brand-card-hover shadow-sm transition-all">التالي</button>
        </div>

        {/* جدول الأيام */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysInMonth.map(day => {
            const hasBooking = getDayBookings(day).length > 0;
            return (
              <div key={day} onClick={() => setSelectedDay(day)}
                className={`h-16 md:h-20 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all ${getDayStyles(day, hasBooking)} ${isBefore(day, today) && !hasBooking && !isSameDay(day, selectedDay) ? 'opacity-40' : ''}`}>
                <span className="text-xs md:text-sm font-bold text-brand-text">{format(day, 'd')}</span>
                <span className="text-[9px] md:text-[10px] text-brand-muted font-bold mt-0.5">{new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric' }).format(day)}</span>
              </div>
            );
          })}
        </div>

        {/* تفاصيل الحجز */}
        <div className="mt-8">
          <h3 className="text-md font-black mb-4 text-brand-main">حجوزات {format(selectedDay, 'd MMMM', { locale: arSA })}</h3>
          {getDayBookings(selectedDay).length > 0 ? (
            getDayBookings(selectedDay).map(b => (
              <div key={b.id} className="bg-brand-card p-4 md:p-6 rounded-2xl border border-brand mb-4 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                  <div onClick={() => handleCopy(b.booking_code, `${b.id}-code`)} className="cursor-pointer w-full md:w-auto">
                    <p className="text-[9px] text-brand-muted font-bold uppercase mb-1">كود الحجز</p>
                    <div className="text-2xl md:text-3xl font-mono font-black text-brand-main hover:text-brand-accent break-all">
                      {copiedStates[`${b.id}-code`] ? 'تم النسخ!' : b.booking_code}
                    </div>
                  </div>
                  {/* ألوان الحالة الأصلية تماماً */}
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20 self-start">{b.package_name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'الاسم', val: b.customer_name, id: `${b.id}-name` },
                    { label: 'الهاتف', val: b.customer_phone, id: `${b.id}-phone` },
                    { label: 'المدينة', val: b.event_city, id: `${b.id}-city` },
                    { label: 'الحالة', val: b.status, id: null }
                  ].map(i => (
                    <div key={i.label} onClick={() => i.id && handleCopy(i.val, i.id)} 
                      className={`p-3 rounded-xl border ${i.id ? 'bg-brand-main border-brand cursor-pointer hover:border-brand-accent shadow-sm' : 'bg-brand-main/50 border-brand'}`}>
                      <p className="text-[9px] text-brand-muted uppercase font-bold mb-1">{i.label}</p>
                      <p className="text-xs font-bold text-brand-text truncate">
                        {i.id && copiedStates[i.id] ? 'تم النسخ!' : i.val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-brand-card rounded-2xl border border-dashed border-brand text-brand-muted font-bold shadow-sm">لا توجد حجوزات في هذا اليوم</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}