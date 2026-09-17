import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 – Page Not Found | DataBounty',
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#011438',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '5rem', fontWeight: 900, color: '#025BE5', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>Page Not Found</p>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.875rem' }}>
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        style={{
          marginTop: '1.5rem',
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: 'linear-gradient(to right, #025BE5, #029FFC)',
          color: '#fff',
          borderRadius: '0.75rem',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.875rem',
        }}
      >
        Back to Home
      </a>
    </main>
  );
}
