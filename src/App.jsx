import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile'; 
import MyAccount from './pages/MyAccount';
import PoliciesPage from './pages/PoliciesPage'; // صفحة السياسات للزوار
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

// صفحات الداش بورد
import Dashboard from './pages/Dashboard';
import MessagesPage from './pages/MessagesPage';
import PackagesPage from './pages/PackagesPage';
import BookingsPage from './pages/BookingsPage';
import CalendarPage from './pages/CalendarPage';
import UsersPage from './pages/UsersPage';
import AlbumPage from './pages/AlbumPage';
import AdminPoliciesPage from './pages/AdminPoliciesPage'; // صفحة إدارة السياسات

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
        <Route path="/policies" element={<PoliciesPage />} /> {/* مسار السياسات */}

        {/* حماية مسارات الداش بورد */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/dashboard/packages" element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
        <Route path="/dashboard/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/dashboard/album" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
        <Route path="/dashboard/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/dashboard/policies" element={<ProtectedRoute><AdminPoliciesPage /></ProtectedRoute>} /> {/* مسار إدارة السياسات */}

        {/* مسار للخطأ 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}