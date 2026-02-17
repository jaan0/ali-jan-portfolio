'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Call server action? Or use API route?
        // Using server action directly requires creating a separate file for actions usually or importing.
        // I'll use a fetch to API route for simplicity or stick to server action pattern.
        // Let's use fetch to /api/auth/login or just simulate here.
        // Actually, I defined 'login' in src/app/actions.ts. I can import it.
        // But client components importing server actions works in Next.js.

        // However, for simplicity let's just use a Server Component for the login page form?
        // No, I want error handling.
        // I'll stick to standard form submission to server action.
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <form action={async (formData) => {
                // dynamic import to avoid bundling server code? No, Next handles this.
                const { login } = await import('@/app/actions');
                const res = await login(formData); // login should return error or redirect
                if (res?.error) alert(res.error);
            }} className="w-full max-w-md p-8 bg-white rounded-lg shadow-md space-y-4">
                <h1 className="text-2xl font-bold text-center">Admin Login</h1>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input name="password" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign In
                </button>
            </form>
        </div>
    );
}
