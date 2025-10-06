import React from 'react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-blue-700">Welcome to Nexpo!</h1>
        <p className="text-lg text-gray-700 mb-8">
          Nexpo is your gateway to the most exciting events, exhibitions, and experiences. Discover, connect, and explore with us.
        </p>
        <a
          href="https://nexpo.vn/app"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-lg font-semibold"
        >
          Explore Nexpo Events
        </a>
      </div>
    </main>
  );
} 