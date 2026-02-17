export interface User {
    id: string;
    email: string;
    name: string;
    title: string;
    subTitle?: string | null;
    avatarUrl?: string | null;
    about?: string | null;
    cvUrl?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    experiences: Experience[];
    educations: Education[];
    skills: Skill[];
    projects: Project[];
}

export interface Experience {
    id: string;
    userId: string;
    title: string;
    company: string;
    dateString: string;
    descriptions: string[]; // JSON array stored as string or array
}

export interface Education {
    id: string;
    userId: string;
    institution: string;
    degree: string;
    dateString: string;
    marksheetUrl?: string | null;
    description?: string | null;
}

export interface Skill {
    id: string;
    userId: string;
    name: string;
    category: string; // 'Language', 'Tool', 'Certification'
    level?: number | null; // e.g. 1-100
    imageUrl?: string | null;
    link?: string | null;
}

export interface Project {
    id: string;
    userId: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    link?: string | null;
    tags: string[];
}
