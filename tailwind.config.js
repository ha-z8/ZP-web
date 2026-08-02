/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 👈 تفعيل الوضع الداكن عبر الكلاس
  theme: {
    extend: {
      fontFamily: {
        sans: ['Thmanyah', 'system-ui', '-apple-system', 'sans-serif'], // 👈 هنا السر: ربط خط ثمانية بالخط الافتراضي للموقع
        thmanyah: ['Thmanyah', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: "var(--brand-bg)",          // خلفية الموقع
          card: "var(--brand-card)",      // الكاردات
          main: "var(--brand-main)",      // الخلفيات البديلة
          text: "var(--brand-text)",      // النصوص الرئيسية
          muted: "var(--brand-muted)",    // النصوص الثانوية
          accent: "var(--brand-accent)",  // الأزرار والعناصر البارزة
          hover: "var(--brand-hover)",    // لون الزر عند المرور
          border: "var(--brand-border)",  // الحدود الناعمة
        }
      }
    },
  },
  plugins: [],
}