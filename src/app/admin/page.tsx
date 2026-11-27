import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import { getAdminDashboardData } from '@/lib/adminData';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  const userWithRole = session?.user as
    | { email?: string; randomKey?: string; role?: string }
    | undefined;
  const role = userWithRole?.randomKey ?? userWithRole?.role;

  if (!session?.user?.email || role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const { restrooms, reviews, requests, users } = await getAdminDashboardData();

  return (
    <AdminDashboardClient
      initialRestrooms={restrooms}
      initialReviews={reviews}
      initialRequests={requests}
      initialUsers={users}
      currentAdminEmail={session.user.email}
    />
  );
}