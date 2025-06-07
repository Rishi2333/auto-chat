import "./globals.css";
import { Inter } from 'next/font/google'; // Accha font

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Auto-Chat | Real Conversations",
  description: "A guided chat application to make conversations flow naturally.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}