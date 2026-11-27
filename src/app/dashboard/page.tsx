// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserDashboardData } from '@/lib/dashboardData';
import UserDashboardClient from '@/components/dashboard/UserDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const data = await getUserDashboardData(session.user.email);

  return (
    <Suspense fallback={<div className="container py-5 text-muted">Loading dashboard...</div>}>
      <UserDashboardClient data={data} />
    </Suspense>
  );
}