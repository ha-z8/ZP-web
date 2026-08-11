import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Layout from '../components/Layout';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    supabase.from('policies').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setPolicies(data);
    });
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-black text-brand-main mb-8 text-center">السياسات والشروط والأحكام</h2>
        {policies.length === 0 ? (
          <div className="bg-brand-card border border-brand border-dashed rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-brand-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-brand-main font-bold text-lg">لا توجد سياسات حالياً</p>
            <p className="text-brand-muted text-sm mt-1">ستظهر سياسات وشروط الاستخدام هنا فور إضافتها وتفعيلها من الإدارة.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((p) => (
              <div key={p.id} className="bg-brand-card border border-brand rounded-2xl overflow-hidden shadow-sm transition-all">
                <button 
                  onClick={() => setOpenId(openId === p.id ? null : p.id)} 
                  className="w-full p-6 text-right font-bold text-brand-main flex justify-between items-center hover:bg-brand-main/50 transition-colors"
                >
                  <span className="text-base">{p.title}</span> 
                  <span className="text-brand-accent">
                    {openId === p.id ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </span>
                </button>
                {openId === p.id && (
                  <div className="p-6 pt-0 text-brand-text text-sm leading-relaxed border-t border-brand mt-2 pt-4 bg-brand-main/30 whitespace-pre-line">
                    {p.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}