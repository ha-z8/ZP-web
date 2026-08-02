import Swal from 'sweetalert2';

// تجهيز قالب الإشعارات الجانبية السريعة (Toasts)
const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: '#020617', // لون كحلي داكن جداً
  color: '#cbd5e1',
  customClass: {
    popup: 'border border-slate-800 rounded-xl',
    title: 'text-sm font-bold font-sans'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

// إشعار النجاح السريع
export const showSuccess = (msg) => {
  Toast.fire({
    icon: 'success',
    title: msg,
    iconColor: '#fbbf24', // لون عنبري ليتماشى مع الهوية
  });
};

// إشعار الخطأ السريع
export const showError = (msg) => {
  Toast.fire({
    icon: 'error',
    title: msg,
    iconColor: '#f87171', 
  });
};

// نافذة التأكيد الفاخرة للقرارات الهامة
export const confirmAction = async (title, text, confirmBtnText = 'نعم، تأكيد', isDanger = false) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: isDanger ? 'error' : 'warning',
    iconColor: isDanger ? '#ef4444' : '#f59e0b',
    showCancelButton: true,
    confirmButtonText: confirmBtnText,
    cancelButtonText: 'إلغاء الأمر',
    customClass: {
      popup: 'bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl',
      title: 'text-amber-400 font-black text-xl',
      htmlContainer: 'text-slate-300 text-sm',
      confirmButton: `${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-400'} text-slate-950 font-bold px-6 py-2.5 rounded-xl mx-2 transition-all`,
      cancelButton: 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-6 py-2.5 rounded-xl mx-2 transition-all'
    },
    buttonsStyling: false,
    background: '#0f172a',
    color: '#cbd5e1'
  });
  return result.isConfirmed;
};