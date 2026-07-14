export const metadata = {
  title: "CAITO360 Mail Test",
  description: "Test Microsoft Graph email sending",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
