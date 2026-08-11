import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import OneSignal from 'react-onesignal'

// دالة تهيئة OneSignal
async function runOneSignal() {
  try {
    await OneSignal.init({
      appId: "63ea57dd-4d4a-4a12-acbb-fa0fa5d4c575",
      safari_web_id: "", 
      allowLocalhostAsSecureOrigin: true, // مهم للاختبار محلياً
    });
    
    OneSignal.Slidedown.promptPush();
  } catch (error) {
    console.error("OneSignal Init Error:", error);
  }
}

// تشغيل الخدمة
runOneSignal();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)