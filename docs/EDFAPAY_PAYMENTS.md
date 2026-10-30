# دليل تشغيل EdfaPay في ZP-web

## الإعداد المطلوب منك

### أولا: لوحة EdfaPay
1. افتح https://app.edfapay.com وسجل الدخول بحساب التاجر.
2. استخرج مفتاح API الخاص ببيئة التجربة أولا، ثم مفتاح الإنتاج لاحقا. الوثائق: https://docs.edfapay.com/reference/initiate
3. في EdfaPay افتح **Configuration → Webhook → Add New**. اختر أحداث Transaction Approved وTransaction Completed (حسب ما توفره لوحة حسابك).
4. اجعل رابط Webhook: `https://YOUR-PUBLIC-DOMAIN/.netlify/functions/edfapay-webhook`.
5. أنشئ **Webhook Secret** سريا طويلا، واحفظ **نفس القيمة** في Netlify. لا تنشره في GitHub. راجع https://docs.edfapay.com/docs/webhook-validation

### ثانيا: Netlify
1. افتح https://app.netlify.com ثم اختر الموقع المرتبط بمستودع ZP-web.
2. افتح **Site configuration / Project configuration → Environment variables → Add a variable** (قد تختلف المسميات قليلا).
3. أضف القيم التالية، واجعل نطاق المتغيرات يشمل Functions:
   - `EDFAPAY_API_KEY`: مفتاح API من EdfaPay، **سرّي**.
   - `EDFAPAY_WEBHOOK_SECRET`: النص السري الذي حددته في إعداد Webhook على EdfaPay، **سرّي**.
   - `EDFAPAY_BASE_URL`: `https://app-api.edfapay.com` للإنتاج حسب توثيق Hosted Checkout، أو عنوان التجربة المؤكد في حسابك.
   - `SUPABASE_URL`: عنوان مشروع Supabase (Project Settings → API).
   - `SUPABASE_SERVICE_ROLE_KEY`: مفتاح server-side service_role أو secret key بصلاحيات متوافقة من Supabase؛ **سرّي للغاية**.
   - `SITE_URL`: عنوان موقعك المنشور بنطاق https، مثل `https://example.com`؛ لا تضع الشرطة المائلة الأخيرة.
4. يجب أن يظل `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` موجودين بالفعل لأجزاء الموقع الأمامية؛ لا تضع أسرار EdfaPay أو service_role في أي متغير يبدأ بـ `VITE_`.
5. بعد حفظ المتغيرات، نفّذ Deploy من جديد؛ تغيير متغيرات الخادم يتطلب إعادة نشر حتى تؤخذ بعين الاعتبار.

### ثالثا: Supabase
1. افتح https://supabase.com/dashboard واختر مشروع ZP-web.
2. انتقل إلى SQL Editor → New query.
3. نفذ محتوى `supabase/migrations/20261031_booking_payment_requests.sql` أولا ثم `supabase/migrations/20261031_payment_webhook.sql`.
4. **تحقق من نوع bookings.id قبل التنفيذ**: SQL الموجود يفترض UUID؛ إذا كان مختلفا يلزم تكييف نوع booking_id في migration. لا تنفذ على الإنتاج دون نسخة احتياطية.
5. اعتمد سياسات RLS لجدولي bookings وprofiles، ولا تسمح بتعديل status أو الدفع من قبل المستخدمين العاديين.
6. تحذير: FK الحالي يستعمل ON DELETE CASCADE للحجز؛ ينبغي الانتقال للأرشفة (soft-delete) للحفاظ على تاريخ المدفوعات قبل الإنتاج.

### رابعا: نشر الفرع
1. راجع Pull Request: https://github.com/ha-z8/ZP-web/pull/1
2. ادمج بعد مراجعة SQL والأمن، ثم أعد نشر Netlify.
3. جرّب بحساب مشرف من صفحة إدارة الحجوزات إصدار مطالبة بقيمة اختبارية، وتحقق من ظهور الرابط في «حجوزاتي».
4. اختبر في Sandbox نجاح العملية وفشلها وتكرار Webhook؛ راقب Netlify Function logs وEdfaPay Webhook logs؛ تحقق من تطابق المبلغ والعملة.
5. لا تنتقل إلى Production حتى تتأكد من بيانات الاعتماد والتوقيع وردود EdfaPay الحقيقية وعمليات التسوية.

## سلوك النسخة الحالية
- إنشاء روابط Hosted Checkout والتأكد من صلاحية المشرف.
- يعاد استخدام رابط مطالبة نشطة عند محاولة إصدار مطالبة ثانية.
- Webhook يتحقق من توقيع `X-EdfaPay-Signature` باستخدام HMAC-SHA256 على الطلب الخام.
- عند وصول `Purchase` ناجح موثق وبالمبلغ والعملة المطابقين، تُسجل العملية مدفوعة ويمكن تأكيد الحجز إذا كان ينتظر الدفع.
- لا يعتمد رجوع المتصفح من EdfaPay دليلا على الدفع.
- لم تُجرَ معاملة EdfaPay حقيقية من خلال هذه التعديلات، ولا يوجد اختبار End-to-End موثق بعد.
- لا يتضمن المشروع بعد معالجة الاسترجاعات، أو إلغاء الروابط من مزود الدفع، أو دعم العربون المتعدد؛ لا تقبل دفعات متعددة للحجز نفسه دون تعديل المنطق.

## مراجع رسمية
- https://docs.edfapay.com/reference/initiate
- https://docs.edfapay.com/docs/webhook-information
- https://docs.edfapay.com/docs/webhook-validation
- https://docs.edfapay.com/docs/webhook-operation-types
