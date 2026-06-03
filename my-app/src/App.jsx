import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile'; 
import Dashboard from './pages/Dashboard';
import MessagesPage from './pages/MessagesPage';
import PackagesPage from './pages/PackagesPage';
import BookingsPage from './pages/BookingsPage';
import UsersPage from './pages/UsersPage';
import AlbumPage from './pages/AlbumPage';
import MyAccount from './pages/MyAccount';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* صفحات الموقع العامة */}
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-account" element={<MyAccount />} />

        {/* صفحات لوحة التحكم (تم إضافة بادئة dashboard لضمان عملها وعدم التداخل) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/messages" element={<MessagesPage />} />
        <Route path="/dashboard/packages" element={<PackagesPage />} />
        <Route path="/dashboard/bookings" element={<BookingsPage />} />
        <Route path="/dashboard/users" element={<UsersPage />} />
        <Route path="/dashboard/album" element={<AlbumPage />} />
      </Routes>
    </Router>
  );
}