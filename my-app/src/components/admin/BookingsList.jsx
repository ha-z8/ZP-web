import React from 'react';

export default function BookingsList({ bookings, onUpdateStatus, onDelete, handleCopyToClipboard, copiedFieldId }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
      <h3 className="text-lg font-bold text-amber-400 mb-6">🗓️ سجل طلبات الحجوزات</h3>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">{booking.customer_name}</p>
              <p className="text-xs text-slate-400">{booking.package_name} - {booking.event_date}</p>
            </div>
            <div className="flex gap-2">
              <select value={booking.status} onChange={(e) => onUpdateStatus(booking.id, e.target.value)} className="bg-slate-900 text-xs p-1 rounded">
                <option value="معلق">معلق</option>
                <option value="مؤكد">مؤكد</option>
                <option value="ملغي">ملغي</option>
              </select>
              <button onClick={() => onDelete(booking.id)} className="text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}