import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '../actions';
import { LayoutDashboard, LogOut } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session) {
        redirect('/daddy');
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                        <span className="font-bold text-xl text-gray-800">Admin Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/" target="_blank" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">
                            View Site
                        </Link>
                        <form action={logout}>
                            <button type="submit" className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
