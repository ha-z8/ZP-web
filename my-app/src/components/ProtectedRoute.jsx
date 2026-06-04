import { useEffect, useState } from 'react';
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
        navigate('/'); // طرده إلى الصفحة الرئيسية إذا لم يكن أدمن
      }
    }
    checkAdmin();
  }, [navigate]);

  if (isAdmin === null) return <div>جاري التحقق...</div>;
  return children;
}