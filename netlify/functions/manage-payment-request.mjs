import { createClient } from '@supabase/supabase-js';
const respond=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(body)});
export async function handler(event){
 if(event.httpMethod!=='POST')return respond(405,{error:'الطريقة غير مسموحة'});
 const token=/^Bearer (.+)$/i.exec(event.headers.authorization||event.headers.Authorization||'')?.[1];
 if(!token)return respond(401,{error:'يرجى تسجيل الدخول'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return respond(503,{error:'إعدادات الخادم غير مكتملة'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:auth,error:authError}=await db.auth.getUser(token);
  if(authError||!auth?.user)return respond(401,{error:'جلسة غير صالحة'});
  const {data:profile,error:profileError}=await db.from('profiles').select('role').eq('id',auth.user.id).single();
  if(profileError||profile?.role!=='admin')return respond(403,{error:'الصلاحية للمشرف فقط'});
  const body=JSON.parse(event.body||'{}');
  if(!['hide_link','restore_link'].includes(body.action)||typeof body.paymentId!=='string')return respond(400,{error:'طلب غير صالح'});
  const {data:payment,error:readError}=await db.from('booking_payment_requests').select('id,booking_id,status,hidden_at').eq('id',body.paymentId).single();
  if(readError||!payment)return respond(404,{error:'طلب الدفع غير موجود'});
  if(payment.status==='paid')return respond(409,{error:'لا يمكن إخفاء أو حذف معاملة مدفوعة؛ يجب الاحتفاظ بالسجل المحاسبي'});
  if(body.action==='hide_link'&&payment.hidden_at)return respond(409,{error:'الرابط مخفي مسبقًا'});
  if(body.action==='restore_link'&&!payment.hidden_at)return respond(409,{error:'الرابط ظاهر مسبقًا'});
  const patch=body.action==='hide_link'?{hidden_at:new Date().toISOString(),hidden_by:auth.user.id}:{hidden_at:null,hidden_by:null};
  const {error:updateError}=await db.from('booking_payment_requests').update(patch).eq('id',payment.id);
  if(updateError)throw updateError;
  const {error:auditError}=await db.from('payment_admin_audit').insert({payment_request_id:payment.id,actor_id:auth.user.id,action:body.action,reason:String(body.reason||'').slice(0,500)});
  if(auditError){console.error('payment audit failed',auditError.message);return respond(500,{error:'تم تغيير الظهور لكن تعذر حفظ سجل التدقيق. راجع الإدارة فورًا'});}
  return respond(200,{ok:true,message:body.action==='hide_link'?'أُخفي الرابط عن العميل. تنبيه: الرابط قد يبقى صالحًا لدى EdfaPay؛ هذا لا يُلغي التحصيل.':'أُعيد إظهار الرابط للعميل'});
 }catch(error){console.error('payment-admin-action',error?.message);return respond(500,{error:'تعذرت العملية؛ راجع سجل الخادم'});}
}