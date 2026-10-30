import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        navigate('/'); 
      }
    }
    checkAdmin();
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <main dir="rtl" role="status" aria-live="polite" className="min-h-screen bg-brand-main text-brand-text flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-brand-muted text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-brand border-t-[var(--brand-accent)] animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span>جاري التحقق من الصلاحيات...</span>
        </div>
      </main>
    );
  }

  return children;
}