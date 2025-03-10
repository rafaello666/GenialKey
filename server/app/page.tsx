import React, { useState } from 'react';
import Link from 'next/link';

export default function Page() {
  const [message, setMessage] = useState('Welcome to KeyGenius – Master your typing skills!');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-500 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 animate-pulse">
            {message}
          </h1>
          <p className="text-xl mb-8">
            Type faster, smarter, and accurately with adaptive AI-powered training.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/training">
              <button className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-50 transition-colors">
                🚀 Start Training
              </button>
            </Link>

            <Link href="/dashboard">
              <button className="bg-transparent border border-white py-3 px-8 rounded-lg hover:bg-white hover:text-indigo-600 transition-colors">
                📊 View Dashboard
              </button>
            </Link>
          </div>
        </div>

        <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm opacity-70">
          KeyGenius © {new Date().getFullYear()} | Created with ❤️ by KeyGenius Team
        </footer>
      </div>
    </main>
  );
}
