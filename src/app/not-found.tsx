'use client'

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="max-w-md w-full text-center relative z-10">
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500 border border-indigo-50">
                        <Search className="w-12 h-12 text-indigo-600" />
                    </div>
                </div>

                <h1 className="text-9xl font-black text-slate-900 mb-4 tracking-tighter">
                    404
                </h1>

                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    Oops! Page Not Found
                </h2>

                <p className="text-slate-500 mb-10 leading-relaxed">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-200 font-medium whitespace-nowrap"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-slate-700 rounded-full hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all font-medium whitespace-nowrap"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                <div className="mt-16 text-slate-400 text-sm font-medium">
                    Lost? Try one of the links above.
                </div>
            </div>
        </div>
    );
}
