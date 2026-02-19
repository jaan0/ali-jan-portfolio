'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Simple hardcoded check or DB check
    // For now, check against the seeded admin user
    const user = await prisma.user.findFirst({
        where: { email }
    });

    if (user && user.password === password) { // Plaintext for MVP 'simple'
        const cookieStore = await cookies(); // Next.js 15 requires await
        cookieStore.set('admin_session', 'true', { httpOnly: true, path: '/' });
        redirect('/admin');
    } else {
        return { error: 'Invalid credentials' };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    redirect('/');
}

export async function updateProfile(formData: FormData) {
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const subTitle = formData.get('subTitle') as string;
    const about = formData.get('about') as string;
    const avatarUrl = formData.get('avatarUrl') as string;
    const cvUrl = formData.get('cvUrl') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const githubUrl = formData.get('githubUrl') as string;
    const forgeCalApiKey = formData.get('forgeCalApiKey') as string;
    const forgeCalEventSlug = formData.get('forgeCalEventSlug') as string;
    const forgeCalWebhookSecret = formData.get('forgeCalWebhookSecret') as string;
    const forgeCalBaseUrl = formData.get('forgeCalBaseUrl') as string;

    await prisma.user.updateMany({
        where: { email: 'admin@example.com' }, // Target the admin user
        data: {
            name,
            title,
            subTitle,
            about,
            avatarUrl,
            cvUrl,
            linkedinUrl,
            githubUrl,
            forgeCalApiKey,
            forgeCalEventSlug,
            forgeCalWebhookSecret,
            forgeCalBaseUrl
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function addExperience(formData: FormData) {
    const user = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
    if (!user) return;

    const title = formData.get('title') as string;
    const company = formData.get('company') as string;
    const dateString = formData.get('dateString') as string;
    const description = formData.get('description') as string; // Expecting newline separated text

    const descArray = description.split('\n').filter(Boolean);

    await prisma.experience.create({
        data: {
            userId: user.id,
            title,
            company,
            dateString,
            description: JSON.stringify(descArray)
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function deleteExperience(id: string) {
    await prisma.experience.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/admin');
}

export async function addEducation(formData: FormData) {
    const user = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
    if (!user) return;

    const institution = formData.get('institution') as string;
    const degree = formData.get('degree') as string;
    const dateString = formData.get('dateString') as string;
    const description = formData.get('description') as string;
    const marksheetUrl = formData.get('marksheetUrl') as string;

    await prisma.education.create({
        data: {
            userId: user.id,
            institution,
            degree,
            dateString,
            description,
            marksheetUrl
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function deleteEducation(id: string) {
    await prisma.education.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/admin');
}

export async function addSkill(formData: FormData) {
    const user = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
    if (!user) return;

    const name = formData.get('name') as string;
    const issuer = formData.get('issuer') as string;
    const dateString = formData.get('dateString') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const link = formData.get('link') as string;

    await (prisma.skill as any).create({
        data: {
            userId: user.id,
            name,
            issuer,
            dateString,
            imageUrl,
            link,
            category: 'Certification', // Default for now
            tags: '[]'
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function deleteSkill(id: string) {
    await prisma.skill.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/admin');
}

export async function updateExperience(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    const company = formData.get('company') as string;
    const dateString = formData.get('dateString') as string;
    const description = formData.get('description') as string;

    const descArray = description.split('\n').filter(Boolean);

    await prisma.experience.update({
        where: { id },
        data: {
            title,
            company,
            dateString,
            description: JSON.stringify(descArray)
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function updateEducation(id: string, formData: FormData) {
    const institution = formData.get('institution') as string;
    const degree = formData.get('degree') as string;
    const dateString = formData.get('dateString') as string;
    const description = formData.get('description') as string;
    const marksheetUrl = formData.get('marksheetUrl') as string;

    await prisma.education.update({
        where: { id },
        data: {
            institution,
            degree,
            dateString,
            description,
            marksheetUrl
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function updateSkill(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const issuer = formData.get('issuer') as string;
    const dateString = formData.get('dateString') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const link = formData.get('link') as string;

    await (prisma.skill as any).update({
        where: { id },
        data: {
            name,
            issuer,
            dateString,
            imageUrl,
            link
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function addProject(formData: FormData) {
    const user = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
    if (!user) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const link = formData.get('link') as string;
    const tags = formData.get('tags') as string; // Comma separated

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    await prisma.project.create({
        data: {
            userId: user.id,
            title,
            description,
            imageUrl,
            link,
            tags: JSON.stringify(tagsArray)
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function updateProject(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const link = formData.get('link') as string;
    const tags = formData.get('tags') as string;

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    await prisma.project.update({
        where: { id },
        data: {
            title,
            description,
            imageUrl,
            link,
            tags: JSON.stringify(tagsArray)
        }
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

export async function deleteProject(id: string) {
    await prisma.project.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/admin');
}
