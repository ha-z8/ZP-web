import Swal from 'sweetalert2';

// تجهيز قالب الإشعارات الجانبية السريعة (Toasts) متوافقة مع الهوية
const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: '#EFECE3', // لون الكارد الكريمي الهادئ
  color: '#4F5443',      // الأخضر الترابي للنصوص
  customClass: {
    popup: 'border border-[#DED7CB] rounded-xl shadow-lg',
    title: 'text-sm font-bold font-sans text-[#4F5443]'
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
    iconColor: '#C8B1A0', // لون ترابي متناسق مع الشعار
  });
};

// إشعار الخطأ السريع
export const showError = (msg) => {
  Toast.fire({
    icon: 'error',
    title: msg,
    iconColor: '#B59C8B', 
  });
};

// نافذة التأكيد الفاخرة للقرارات الهامة بتصميم متناسق مع الشعار
export const confirmAction = async (title, text, confirmBtnText = 'نعم، تأكيد', isDanger = false) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: isDanger ? 'error' : 'warning',
    iconColor: isDanger ? '#B59C8B' : '#C8B1A0',
    showCancelButton: true,
    confirmButtonText: confirmBtnText,
    cancelButtonText: 'إلغاء الأمر',
    customClass: {
      popup: 'bg-[#EFECE3] border border-[#DED7CB] rounded-3xl shadow-2xl',
      title: 'text-[#4F5443] font-black text-xl',
      htmlContainer: 'text-[#7A806E] text-sm',
      confirmButton: `${isDanger ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-[#C8B1A0] hover:bg-[#B59C8B] text-[#3B3F32]'} font-bold px-6 py-2.5 rounded-xl mx-2 transition-all shadow-sm`,
      cancelButton: 'bg-[#F5F2EB] hover:bg-[#E7E3D8] border border-[#DED7CB] text-[#4F5443] font-bold px-6 py-2.5 rounded-xl mx-2 transition-all shadow-sm'
    },
    buttonsStyling: false,
    background: '#EFECE3',
    color: '#4F5443'
  });
  return result.isConfirmed;
};