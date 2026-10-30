import { createClient } from '@supabase/supabase-js';

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
const validAmount = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 1000000 && Math.round(value * 100) === value * 100;

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const token = /^Bearer (.+)$/i.exec(event.headers.authorization || event.headers.Authorization || '')?.[1];
  if (!token) return json(401, { error: 'يجب تسجيل الدخول' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.EDFAPAY_API_KEY || !process.env.URL) {
    return json(503, { error: 'إعدادات الدفع غير مكتملة لدى الموقع' });
  }
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth?.user) return json(401, { error: 'الجلسة غير صالحة' });
    const { data: profile, error: roleError } = await db.from('profiles').select('role').eq('id', auth.user.id).single();
    if (roleError || profile?.role !== 'admin') return json(403, { error: 'هذه العملية للمشرف فقط' });
    const input = JSON.parse(event.body || '{}');
    if (typeof input.bookingId !== 'string' || !validAmount(input.amount)) return json(400, { error: 'يرجى إدخال مبلغ صحيح بالريال السعودي' });
    const { data: booking, error: bookingError } = await db.from('bookings').select('id,booking_code,customer_name,customer_phone,customer_email,status').eq('id', input.bookingId).single();
    if (bookingError || !booking) return json(404, { error: 'الحجز غير موجود' });
    if (booking.status === 'ملغي') return json(409, { error: 'لا يمكن إنشاء مطالبة لحجز ملغي' });
    if (!booking.customer_name || !booking.customer_phone || !booking.customer_email) return json(400, { error: 'يلزم اسم العميل ورقم الجوال والبريد لإنشاء رابط الدفع' });
    const { data: old } = await db.from('booking_payment_requests').select('id').eq('booking_id', booking.id).eq('status', 'paid').limit(1);
    if (old?.length) return json(409, { error: 'هناك دفعة مسددة لهذا الحجز؛ تحقق قبل إصدار مطالبة جديدة' });
    const { data: existing, error: existingError } = await db.from('booking_payment_requests').select('payment_url,amount,status').eq('booking_id', booking.id).in('status',['pending','link_created']).limit(1);
    if (existingError) throw existingError;
    if (existing?.length) {
      if (existing[0].status === 'link_created' && existing[0].payment_url) return json(200, { paymentUrl: existing[0].payment_url, amount: Number(existing[0].amount), reused: true });
      return json(409, { error: 'يوجد طلب دفع قيد الإنشاء. أعد المحاولة لاحقاً أو راجع سجل العمليات.' });
    }
    const orderId = 'ZP-' + crypto.randomUUID();
    const { data: record, error: insertError } = await db.from('booking_payment_requests').insert({ booking_id: booking.id, order_id: orderId, amount: input.amount, created_by: auth.user.id }).select('id').single();
    if (insertError?.code === '23505') return json(409, { error: 'توجد مطالبة نشطة مسبقاً لهذا الحجز' });
    if (insertError) throw insertError;
    const baseUrl = process.env.URL.replace(/\/$/, '');
    const gateway = process.env.EDFAPAY_BASE_URL || 'https://app-api.edfapay.com';
    const response = await fetch(gateway.replace(/\/$/, '') + '/api/v1/payment-gateway/initiate', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.EDFAPAY_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        orderId, currency: 'SAR', amount: input.amount,
        customerDetails: { name: booking.customer_name, email: booking.customer_email, phone: booking.customer_phone },
        auth: 'N', recurringInit: 'N',
        successUrl: baseUrl + '/my-account?payment=returned',
        failureUrl: baseUrl + '/my-account?payment=failed'
      })
    });
    const result = await response.json().catch(() => ({}));
    const paymentUrl = result?.data?.redirectUrl;
    if (!response.ok || result?.code !== 200 || typeof paymentUrl !== 'string' || !paymentUrl.startsWith('https://')) {
      await db.from('booking_payment_requests').update({ status: 'failed', provider_response: { code: result?.code, message: result?.message } }).eq('id', record.id);
      return json(502, { error: 'تعذر إنشاء رابط الدفع لدى EdfaPay؛ راجع الإعدادات وسجل العمليات' });
    }
    const { error: updateError } = await db.from('booking_payment_requests').update({ payment_url: paymentUrl, status: 'link_created' }).eq('id', record.id);
    if (updateError) throw updateError;
    await db.from('bookings').update({ status: 'انتظار الدفع' }).eq('id', booking.id);
    return json(200, { paymentUrl, amount: input.amount, orderId });
  } catch (error) {
    console.error('payment-link error', error?.message);
    return json(500, { error: 'تعذر إتمام العملية. تحقق من سجل الخادم وإعدادات قاعدة البيانات.' });
  }
}
