import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Healthcare Appointment Manager",
  description: "Enterprise-grade clinical appointment and follow-up management system.",
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <a href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">Clinic Care</a>
                <nav className="flex items-center space-x-6 text-sm font-medium text-gray-600">
                  <a href="/patient" className="hover:text-blue-600 transition-colors">Patient Portal</a>
                  <a href="/doctor" className="hover:text-blue-600 transition-colors">Doctor Portal</a>
                  <a href="/admin" className="hover:text-blue-600 transition-colors">Admin Portal</a>
                  
                  {session && (
                    <a href="/api/auth/signout" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-semibold">
                      Sign Out
                    </a>
                  )}
                </nav>
              </div>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto p-6">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 py-6 mt-12">
              <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Clinic Care. All rights reserved.
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
