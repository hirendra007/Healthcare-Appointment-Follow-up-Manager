"use client";

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('hashedpassword'); // Pre-fill with seeded password for easy testing
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    });

    if (res?.error) {
      setError('Invalid credentials');
    } else {
      // Check for callbackUrl in query params
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');

      if (callbackUrl) {
        window.location.href = callbackUrl;
        return;
      }

      // Fallback: Fetch session to determine role for proper redirect
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      const role = sessionData?.user?.role;
      if (role === 'PATIENT') {
        window.location.href = '/patient';
      } else if (role === 'DOCTOR') {
        window.location.href = '/doctor';
      } else if (role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/'; 
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to Unthinkable</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
            Sign In
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500 flex justify-between">
          <button onClick={() => setEmail('patient@example.com')} className="hover:text-blue-600">Test Patient</button>
          <button onClick={() => setEmail('doctor@example.com')} className="hover:text-blue-600">Test Doctor</button>
          <button onClick={() => setEmail('admin@example.com')} className="hover:text-blue-600">Test Admin</button>
        </div>
      </div>
    </div>
  );
}
