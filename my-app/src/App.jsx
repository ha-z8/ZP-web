import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile'; 
import MyAccount from './pages/MyAccount';
import NotFound from './pages/NotFound'; // تأكد من إنشاء هذه الصفحة
import ProtectedRoute from './components/ProtectedRoute'; // استيراد الحارس

// صفحات الداش بورد
import Dashboard from './pages/Dashboard';
import MessagesPage from './pages/MessagesPage';
import PackagesPage from './pages/PackagesPage';
import BookingsPage from './pages/BookingsPage';
import UsersPage from './pages/UsersPage';
import AlbumPage from './pages/AlbumPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-account" element={<MyAccount />} />

        {/* حماية مسارات الداش بورد */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/dashboard/packages" element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
        <Route path="/dashboard/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/dashboard/album" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />

        {/* مسار للخطأ 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}