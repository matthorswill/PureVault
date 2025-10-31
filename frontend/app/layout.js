// frontend/app/layout.js
export const metadata = { title: "PureVault", description: "Back-office or & diamants" };
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin:0, fontFamily:"system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
