import prisma from "@/lib/prisma";
import Dashboard from "@/components/admin/Dashboard";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const user = await prisma.user.findFirst({
        where: { email: 'admin@example.com' },
        include: { experiences: true, educations: true, skills: true, projects: true }
    });

    if (!user) {
        return <div>User not found. Please run seed.</div>;
    }

    return (
        <Dashboard user={user} />
    );
}
