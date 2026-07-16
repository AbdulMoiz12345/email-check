export const metadata = { title: 'CAITO360 Auth & Email Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, Segoe UI, Arial, sans-serif', background: '#f4f6f8', color: '#061F4A' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontWeight: 700, fontSize: 20 }}>CAITO<span style={{ color: '#14B8C8' }}>360</span></span>
            <span style={{ color: '#5B677A', fontSize: 13, marginLeft: 8 }}>auth & email demo — same code as the real app</span>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
