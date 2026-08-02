import React from 'react';

export default function BookingsList({ bookings, onUpdateStatus, onDelete, handleCopyToClipboard, copiedFieldId }) {
  return (
    <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
      <h3 className="text-lg font-bold text-brand-main mb-6">🗓️ سجل طلبات الحجوزات</h3>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-brand-main p-4 rounded-xl border border-brand flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-brand-main">{booking.customer_name}</p>
              <p className="text-xs text-brand-muted">{booking.package_name} - {booking.event_date}</p>
            </div>
            <div className="flex gap-2 items-center">
              <select value={booking.status} onChange={(e) => onUpdateStatus(booking.id, e.target.value)} className="bg-brand-card border border-brand text-brand-text text-xs p-2 rounded-xl focus:outline-none cursor-pointer">
                <option value="معلق">معلق</option>
                <option value="مؤكد">مؤكد</option>
                <option value="ملغي">ملغي</option>
              </select>
              <button onClick={() => onDelete(booking.id)} className="bg-brand-card hover:bg-brand-card-hover border border-brand text-red-700 hover:text-red-800 p-2 rounded-xl text-xs transition-all shadow-sm" title="حذف">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}