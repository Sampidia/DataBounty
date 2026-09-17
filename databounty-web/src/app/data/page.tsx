import { Metadata } from 'next';
import AdminDashboardClient from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'DataBounty Data Suite',
  description: 'Internal platform administration suite.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DataAdminPage() {
  return <AdminDashboardClient />;
}
