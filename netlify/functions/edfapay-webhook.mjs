import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const reply = (statusCode, message) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
const equalHex = (a, b) => {
  if (!/^[a-f0-9]{64}$/i.test(a || '') || !/^[a-f0-9]{64}$/i.test(b || '')) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') return reply(405, 'Method not allowed');
  const { EDFAPAY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!EDFAPAY_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return reply(503, 'Webhook not configured');
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '', 'utf8');
  if (raw.length > 64000) return reply(413, 'Payload too large');
  const signature = event.headers['x-edfapay-signature'] || event.headers['X-EdfaPay-Signature'];
  const expected = createHmac('sha256', EDFAPAY_WEBHOOK_SECRET).update(raw).digest('hex');
  if (!equalHex(signature, expected)) return reply(401, 'Invalid signature');
  try {
    const data = JSON.parse(raw.toString('utf8'));
    const orderId = data.orderId;
    if (typeof orderId !== 'string' || !orderId.startsWith('ZP-')) return reply(200, 'Ignored unrelated payment');
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: payment, error: readError } = await db.from('booking_payment_requests').select('id,booking_id,amount,currency,status,transaction_id').eq('order_id', orderId).maybeSingle();
    if (readError) throw readError;
    if (!payment) return reply(200, 'Unknown order');
    if (payment.status === 'paid') return reply(200, 'Already processed');
    const amount = Number(data.amount);
    const currency = String(data.currencyCode ?? data.currency ?? '').toUpperCase();
    if (!Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(Number(payment.amount) * 100) || !['SAR','682'].includes(currency)) {
      return reply(422, 'Amount or currency mismatch');
    }
    const tx = data.transactionId;
    if (typeof tx !== 'string' || !tx || (payment.transaction_id && payment.transaction_id !== tx)) return reply(422, 'Invalid transaction');
    const status = String(data.status || '').toLowerCase();
    const type = String(data.type || '').toLowerCase();
    // Only a completed Purchase represents a captured sale.
    if (type !== 'purchase') return reply(200, 'Ignored non-purchase');
    if (!['approved', 'success'].includes(status)) {
      // Pending/redirect and failures must not overwrite a completed payment.
      return reply(200, 'No successful payment');
    }
    // Independently confirm the transaction with EdfaPay before altering financial records.
    if (!process.env.EDFAPAY_API_KEY) return reply(503, 'Verification key not configured');
    const gateway = (process.env.EDFAPAY_BASE_URL || 'https://app-api.edfapay.com').replace(/\\/$/, '');
    const verificationUrl = gateway + '/api/v1/transactions/filterTransaction?id=' + encodeURIComponent(tx);
    const verification = await fetch(verificationUrl, {
      headers: { 'X-API-KEY': process.env.EDFAPAY_API_KEY, Accept: 'application/json' }
    });
    if (!verification.ok) return reply(503, 'Gateway verification unavailable');
    const verificationBody = await verification.json();
    const transactions = verificationBody?.data?.content;
    const confirmed = Array.isArray(transactions) && transactions.find(item =>
      item.transactionId === tx &&
      item.orderId === orderId &&
      Math.round(Number(item.amount) * 100) === Math.round(Number(payment.amount) * 100) &&
      ['682','SAR'].includes(String(item.currencyCode || item.currency).toUpperCase()) &&
      String(item.transactionType).toUpperCase() === 'PURCHASE' &&
      ['APPROVED','SUCCESS'].includes(String(item.paymentStatus).toUpperCase()) &&
      ['SUCCESS','APPROVED','COMPLETED'].includes(String(item.transactionStatus).toUpperCase())
    );
    if (!confirmed) return reply(422, 'Transaction not independently confirmed');
    const { data: matched, error: updateError } = await db.from('booking_payment_requests')
      .update({ status: 'paid', transaction_id: tx, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', payment.id).neq('status', 'paid').select('id,booking_id');
    if (updateError) throw updateError;
    if (matched?.length) {
      const { error: bookingError } = await db.from('bookings').update({ status: 'مؤكد' }).eq('id', payment.booking_id).eq('status','انتظار الدفع');
      if (bookingError) throw bookingError;
    }
    return reply(200, 'Processed');
  } catch (error) {
    console.error('edfapay webhook:', error?.message);
    return reply(500, 'Processing failure');
  }
}
