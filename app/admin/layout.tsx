import { Suspense } from 'react';
import { AdminNav } from '@/components/admin/nav';
import { createClient } from '@/utils/supabase/client';
import { redirect } from 'next/navigation';

async function getUser() {
  'use server';
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-md">
          <div className="p-4">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>
          <AdminNav />
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
