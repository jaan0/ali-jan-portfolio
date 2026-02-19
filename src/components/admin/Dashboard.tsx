'use client'

import { useState, useRef, useEffect, FormEvent } from 'react';
import { User, Experience, Education, Skill, Project, Meeting, MeetingBlock } from '@prisma/client';
import {
    updateProfile,
    addExperience, deleteExperience, updateExperience,
    addEducation, deleteEducation, updateEducation,
    addSkill, deleteSkill, updateSkill,
    addProject, updateProject, deleteProject
} from '@/app/actions';
import { Trash2, Plus, Save, User as UserIcon, Briefcase, GraduationCap, Award, Pencil, X, FolderKanban, CalendarCheck2, RefreshCw } from 'lucide-react';
import ImageUpload from './ImageUpload';
import toast, { Toaster } from 'react-hot-toast';

interface DashboardProps {
    user: User & {
        experiences: Experience[];
        educations: Education[];
        skills: Skill[];
        projects: Project[];
        meetings?: Meeting[];
    }
}

export default function Dashboard({ user }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'education' | 'skills' | 'projects' | 'meetings'>('profile');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const [cvUrl, setCvUrl] = useState(user.cvUrl || '');
    const [skillImageUrl, setSkillImageUrl] = useState('');
    const [projectImageUrl, setProjectImageUrl] = useState('');

    // Global edit image states (so controlled ImageUpload works in edit forms)
    const [editSkillImageUrl, setEditSkillImageUrl] = useState('');
    const [editProjectImageUrl, setEditProjectImageUrl] = useState('');
    const [eduMarksheetUrl, setEduMarksheetUrl] = useState('');
    const [editEduMarksheetUrl, setEditEduMarksheetUrl] = useState('');

    const [editingExpId, setEditingExpId] = useState<string | null>(null);
    const [editingEduId, setEditingEduId] = useState<string | null>(null);
    const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>(user.meetings || []);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
    const [blocks, setBlocks] = useState<MeetingBlock[]>([]);
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [startBlockAt, setStartBlockAt] = useState('');
    const [endBlockAt, setEndBlockAt] = useState('');
    const [blockNote, setBlockNote] = useState('');

    const expFormRef = useRef<HTMLFormElement>(null);
    const eduFormRef = useRef<HTMLFormElement>(null);
    const skillFormRef = useRef<HTMLFormElement>(null);
    const projectFormRef = useRef<HTMLFormElement>(null);

    async function loadMeetings(showErrors = true) {
        setLoadingMeetings(true);
        try {
            const response = await fetch('/api/admin/meetings');
            const data = await response.json();

            if (!response.ok) {
                throw new Error((data?.error as string) || 'Failed to load meetings');
            }

            setMeetings((data?.meetings as Meeting[]) || []);
            if (showErrors && typeof data?.error === 'string' && data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            if (showErrors) {
                toast.error((error as Error).message || 'Failed to load meetings');
            }
        } finally {
            setLoadingMeetings(false);
        }
    }

    async function loadBlocks() {
        setLoadingBlocks(true);
        try {
            const response = await fetch('/api/admin/meeting-blocks');
            const data = await response.json();

            if (!response.ok) {
                throw new Error((data?.error as string) || 'Failed to load blocked slots');
            }

            setBlocks((data?.blocks as MeetingBlock[]) || []);
        } catch (error) {
            toast.error((error as Error).message || 'Failed to load blocked slots');
        } finally {
            setLoadingBlocks(false);
        }
    }

    async function addBlockWindow(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!startBlockAt || !endBlockAt) {
            toast.error('Start and end time are required');
            return;
        }

        const startIso = new Date(startBlockAt).toISOString();
        const endIso = new Date(endBlockAt).toISOString();

        try {
            const response = await fetch('/api/admin/meeting-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: startIso,
                    endTime: endIso,
                    note: blockNote
                })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error((data?.error as string) || 'Failed to create blocked slot');
            }

            toast.success('Blocked slot added');
            setStartBlockAt('');
            setEndBlockAt('');
            setBlockNote('');
            await loadBlocks();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to create blocked slot');
        }
    }

    async function deleteBlockWindow(blockId: string) {
        try {
            const response = await fetch(`/api/admin/meeting-blocks/${encodeURIComponent(blockId)}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error((data?.error as string) || 'Failed to delete blocked slot');
            }

            toast.success('Blocked slot removed');
            await loadBlocks();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to delete blocked slot');
        }
    }

    async function cancelMeeting(bookingId: string) {
        setCancelingBookingId(bookingId);
        try {
            const response = await fetch(`/api/forgecal/bookings/${encodeURIComponent(bookingId)}/cancel`, {
                method: 'POST'
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error((data?.error as string) || 'Failed to cancel meeting');
            }

            toast.success('Meeting canceled');
            await loadMeetings();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to cancel meeting');
        } finally {
            setCancelingBookingId(null);
        }
    }

    useEffect(() => {
        if (activeTab === 'meetings') {
            loadMeetings();
            loadBlocks();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'meetings') return;

        const pollId = setInterval(() => {
            loadMeetings(false);
        }, 5000);

        return () => clearInterval(pollId);
    }, [activeTab]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Toaster position="top-right" />
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <UserIcon className="w-4 h-4" /> Profile
                </button>
                <button
                    onClick={() => setActiveTab('experience')}
                    className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'experience' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Briefcase className="w-4 h-4" /> Experience
                </button>
                <button
                    onClick={() => setActiveTab('education')}
                    className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'education' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <GraduationCap className="w-4 h-4" /> Education
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'skills' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Award className="w-4 h-4" /> Skills
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'projects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FolderKanban className="w-4 h-4" /> Projects
                </button>
                <button
                    onClick={() => setActiveTab('meetings')}
                    className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'meetings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <CalendarCheck2 className="w-4 h-4" /> Meetings
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'profile' && (
                    <form action={async (formData) => {
                        try {
                            await updateProfile(formData);
                            toast.success('Profile updated successfully!');
                        } catch (error) {
                            toast.error('Failed to update profile');
                        }
                    }} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input name="name" defaultValue={user.name} required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                <input name="title" defaultValue={user.title} required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Title</label>
                                <input name="subTitle" defaultValue={user.subTitle || ''} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                            </div>
                            <div className="md:col-span-2">
                                <ImageUpload
                                    currentUrl={avatarUrl}
                                    onUrlChange={setAvatarUrl}
                                    label="Profile Avatar"
                                    name="avatarUrl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                            <textarea name="about" defaultValue={user.about || ''} rows={5} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                                <input name="linkedinUrl" defaultValue={user.linkedinUrl || ''} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                                <input name="githubUrl" defaultValue={user.githubUrl || ''} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                            </div>
                            <div className="md:col-span-2">
                                <ImageUpload
                                    currentUrl={cvUrl}
                                    onUrlChange={setCvUrl}
                                    label="CV / Resume (PDF or Link)"
                                    name="cvUrl"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">ForgeCal Integration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ForgeCal API Key</label>
                                    <input
                                        name="forgeCalApiKey"
                                        type="password"
                                        defaultValue={user.forgeCalApiKey || ''}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        placeholder="paste your x-api-key value"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Slug</label>
                                    <input
                                        name="forgeCalEventSlug"
                                        defaultValue={user.forgeCalEventSlug || 'strategy-call'}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        placeholder="strategy-call"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                                    <input
                                        name="forgeCalBaseUrl"
                                        defaultValue={user.forgeCalBaseUrl || 'https://forge-cal.vercel.app'}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        placeholder="https://forge-cal.vercel.app"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                                    <input
                                        name="forgeCalWebhookSecret"
                                        type="password"
                                        defaultValue={user.forgeCalWebhookSecret || ''}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                        placeholder="random secret used to verify x-forgecal-signature"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 hover:shadow-lg transition font-medium">
                                <Save className="w-4 h-4" /> Save Profile
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'experience' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Experience</h3>
                            <form ref={expFormRef} action={async (formData) => {
                                try {
                                    await addExperience(formData);
                                    expFormRef.current?.reset();
                                    toast.success('Experience added successfully!');
                                } catch (error) {
                                    toast.error('Failed to add experience');
                                }
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="title" placeholder="Job Title" required className="rounded-md border-gray-300 border p-2" />
                                <input name="company" placeholder="Company Name" required className="rounded-md border-gray-300 border p-2" />
                                <input name="dateString" placeholder="Date Range (e.g. 2021 - Present)" required className="rounded-md border-gray-300 border p-2" />
                                <textarea name="description" placeholder="Description (enter each point on new line)" required className="md:col-span-2 rounded-md border-gray-300 border p-2" rows={3} />
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">Add Entry</button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-4">
                            {user.experiences.map(exp => (
                                <div key={exp.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                    {editingExpId === exp.id ? (
                                        <form action={async (formData) => {
                                            try {
                                                await updateExperience(exp.id, formData);
                                                setEditingExpId(null);
                                                toast.success('Experience updated!');
                                            } catch (error) {
                                                toast.error('Failed to update');
                                            }
                                        }} className="space-y-3">
                                            <input name="title" defaultValue={exp.title} required className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Job Title" />
                                            <input name="company" defaultValue={exp.company} required className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Company" />
                                            <input name="dateString" defaultValue={exp.dateString} required className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Date Range" />
                                            <textarea name="description" defaultValue={JSON.parse(exp.description || '[]').join('\n')} required className="w-full rounded-md border-gray-300 border p-2 text-sm" rows={3} placeholder="Description" />
                                            <div className="flex gap-2">
                                                <button type="submit" className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
                                                    <Save className="w-3 h-3" /> Save
                                                </button>
                                                <button type="button" onClick={() => setEditingExpId(null)} className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700">
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{exp.title}</h4>
                                                <p className="text-sm text-gray-500">{exp.company} • {exp.dateString}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingExpId(exp.id)} className="text-gray-400 hover:text-indigo-600 p-2 transition">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={async () => {
                                                    try {
                                                        await deleteExperience(exp.id);
                                                        toast.success('Experience deleted');
                                                    } catch (error) {
                                                        toast.error('Failed to delete experience');
                                                    }
                                                }} className="text-gray-400 hover:text-red-600 p-2 transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'education' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Education</h3>
                            <form ref={eduFormRef} action={async (formData) => {
                                try {
                                    await addEducation(formData);
                                    eduFormRef.current?.reset();
                                    setEduMarksheetUrl('');
                                    toast.success('Education added successfully!');
                                } catch (error) {
                                    toast.error('Failed to add education');
                                }
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="institution" placeholder="Institution Name" required className="rounded-md border-gray-300 border p-2" />
                                <input name="degree" placeholder="Degree / Certificate" required className="rounded-md border-gray-300 border p-2" />
                                <input name="dateString" placeholder="Date Range" required className="rounded-md border-gray-300 border p-2" />
                                <div className="md:col-span-2">
                                    <ImageUpload
                                        currentUrl={eduMarksheetUrl}
                                        onUrlChange={setEduMarksheetUrl}
                                        label="Diploma / Marksheet (PDF or Image)"
                                        name="marksheetUrl"
                                    />
                                </div>
                                <textarea name="description" placeholder="Description (Optional)" className="md:col-span-2 rounded-md border-gray-300 border p-2" rows={2} />
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">Add Entry</button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-4">
                            {user.educations.map(edu => (
                                <div key={edu.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                    {editingEduId === edu.id ? (
                                        <form action={async (formData) => {
                                            try {
                                                await updateEducation(edu.id, formData);
                                                setEditingEduId(null);
                                                toast.success('Education updated!');
                                            } catch (error) {
                                                toast.error('Failed to update');
                                            }
                                        }} className="space-y-3">
                                            <input name="institution" defaultValue={edu.institution} required className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                                            <input name="degree" defaultValue={edu.degree} required className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                                            <input name="dateString" defaultValue={edu.dateString} required className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                                            <ImageUpload
                                                currentUrl={editEduMarksheetUrl}
                                                onUrlChange={setEditEduMarksheetUrl}
                                                label="Diploma / Marksheet"
                                                name="marksheetUrl"
                                            />
                                            <textarea name="description" defaultValue={edu.description || ''} className="w-full rounded-md border-gray-300 border p-2 text-sm" rows={2} placeholder="Description" />
                                            <div className="flex gap-2">
                                                <button type="submit" className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
                                                    <Save className="w-3 h-3" /> Save
                                                </button>
                                                <button type="button" onClick={() => setEditingEduId(null)} className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700">
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                                                <p className="text-sm text-gray-500">{edu.institution} • {edu.dateString}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    setEditingEduId(edu.id);
                                                    setEditEduMarksheetUrl(edu.marksheetUrl || '');
                                                }} className="text-gray-400 hover:text-indigo-600 p-2 transition">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={async () => {
                                                    try {
                                                        await deleteEducation(edu.id);
                                                        toast.success('Education deleted');
                                                    } catch (error) {
                                                        toast.error('Failed to delete education');
                                                    }
                                                }} className="text-gray-400 hover:text-red-600 p-2 transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Certification/Skill</h3>
                            <form ref={skillFormRef} action={async (formData) => {
                                try {
                                    await addSkill(formData);
                                    skillFormRef.current?.reset();
                                    setSkillImageUrl('');
                                    toast.success('Skill added successfully!');
                                } catch (error) {
                                    toast.error('Failed to add skill');
                                }
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="name" placeholder="Skill Name (e.g. Python)" required className="rounded-md border-gray-300 border p-2" />
                                <input name="issuer" placeholder="Issuer (e.g. Kaggle)" required className="rounded-md border-gray-300 border p-2" />
                                <input name="dateString" placeholder="Date Issued" required className="rounded-md border-gray-300 border p-2" />
                                <div className="md:col-span-2">
                                    <ImageUpload
                                        currentUrl={skillImageUrl}
                                        onUrlChange={setSkillImageUrl}
                                        label="Skill/Certificate Icon"
                                        name="imageUrl"
                                    />
                                </div>
                                <input name="link" placeholder="Certificate URL (Optional)" className="md:col-span-2 rounded-md border-gray-300 border p-2" />
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">Add Entry</button>
                                </div>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {user.skills.map(skill => (
                                <div key={skill.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                    {editingSkillId === skill.id ? (
                                        <form action={async (formData) => {
                                            try {
                                                await updateSkill(skill.id, formData);
                                                setEditingSkillId(null);
                                                toast.success('Skill updated!');
                                            } catch (error) {
                                                toast.error('Failed to update');
                                            }
                                        }} className="space-y-3">
                                            <input name="name" defaultValue={skill.name} required className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Name" />
                                            <input name="issuer" defaultValue={(skill as any).issuer || ''} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Issuer" />
                                            <input name="dateString" defaultValue={(skill as any).dateString || ''} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Date" />
                                            <div className="md:col-span-2">
                                                <ImageUpload
                                                    currentUrl={editSkillImageUrl}
                                                    onUrlChange={setEditSkillImageUrl}
                                                    label="Skill Icon"
                                                    name="imageUrl"
                                                />
                                            </div>
                                            <input name="link" defaultValue={skill.link || ''} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Certificate Link" />
                                            <div className="flex gap-2">
                                                <button type="submit" className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
                                                    <Save className="w-3 h-3" /> Save
                                                </button>
                                                <button type="button" onClick={() => setEditingSkillId(null)} className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700">
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                                    {skill.imageUrl ? <img src={skill.imageUrl.startsWith('http') ? skill.imageUrl : `/${skill.imageUrl.replace(/^\//, '')}`} alt="" className="w-full h-full object-cover rounded" /> : <Award className="w-5 h-5 text-gray-400" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-800 text-sm">{skill.name}</h4>
                                                    <p className="text-xs text-gray-500">{(skill as any).issuer} • {(skill as any).dateString}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => {
                                                    setEditingSkillId(skill.id);
                                                    setEditSkillImageUrl(skill.imageUrl || '');
                                                }} className="text-gray-400 hover:text-indigo-600 p-1.5 transition">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={async () => {
                                                    try {
                                                        await deleteSkill(skill.id);
                                                        toast.success('Skill deleted');
                                                    } catch (error) {
                                                        toast.error('Failed to delete skill');
                                                    }
                                                }} className="text-gray-400 hover:text-red-600 p-1.5 transition">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Project</h3>
                            <form ref={projectFormRef} action={async (formData) => {
                                try {
                                    await addProject(formData);
                                    projectFormRef.current?.reset();
                                    setProjectImageUrl('');
                                    toast.success('Project added!');
                                } catch (error) {
                                    toast.error('Failed to add project');
                                }
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="title" placeholder="Project Title" required className="rounded-md border-gray-300 border p-2" />
                                <input name="link" placeholder="Project Link (Optional)" className="rounded-md border-gray-300 border p-2" />
                                <input name="tags" placeholder="Tags (comma separated)" className="md:col-span-2 rounded-md border-gray-300 border p-2" />
                                <div className="md:col-span-2">
                                    <ImageUpload
                                        currentUrl={projectImageUrl}
                                        onUrlChange={setProjectImageUrl}
                                        label="Project Image"
                                        name="imageUrl"
                                    />
                                </div>
                                <textarea name="description" placeholder="Project Description" className="md:col-span-2 rounded-md border-gray-300 border p-2" rows={2} required />
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">Add Project</button>
                                </div>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {user.projects.map(project => (
                                <div key={project.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                    {editingProjectId === project.id ? (
                                        <form action={async (formData) => {
                                            try {
                                                await updateProject(project.id, formData);
                                                setEditingProjectId(null);
                                                toast.success('Project updated!');
                                            } catch (error) {
                                                toast.error('Failed to update');
                                            }
                                        }} className="space-y-3">
                                            <input name="title" defaultValue={project.title} required className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                                            <input name="link" defaultValue={project.link || ''} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Link" />
                                            <input name="tags" defaultValue={JSON.parse(project.tags || '[]').join(', ')} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="Tags" />
                                            <ImageUpload
                                                currentUrl={editProjectImageUrl}
                                                onUrlChange={setEditProjectImageUrl}
                                                label="Project Image"
                                                name="imageUrl"
                                            />
                                            <textarea name="description" defaultValue={project.description} required className="w-full rounded-md border-gray-300 border p-2 text-sm" rows={3} />
                                            <div className="flex gap-2">
                                                <button type="submit" className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
                                                    <Save className="w-3 h-3" /> Save
                                                </button>
                                                <button type="button" onClick={() => setEditingProjectId(null)} className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700">
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-4">
                                                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                                                    {project.imageUrl ? <img src={project.imageUrl.startsWith('http') ? project.imageUrl : `/${project.imageUrl.replace(/^\//, '')}`} alt="" className="w-full h-full object-cover" /> : <FolderKanban className="w-full h-full p-4 text-gray-300" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{project.title}</h4>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    setEditingProjectId(project.id);
                                                    setEditProjectImageUrl(project.imageUrl || '');
                                                }} className="text-gray-400 hover:text-indigo-600 p-2 transition">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={async () => {
                                                    try {
                                                        await deleteProject(project.id);
                                                        toast.success('Project deleted');
                                                    } catch (error) {
                                                        toast.error('Failed to delete');
                                                    }
                                                }} className="text-gray-400 hover:text-red-600 p-2 transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'meetings' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Requested & Booked Meetings</h3>
                                <p className="text-sm text-gray-500">
                                    Configure blocked windows below. Availability and booking enforce them automatically.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => loadMeetings()}
                                disabled={loadingMeetings}
                                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-60"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingMeetings ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-4">
                            <h4 className="font-medium text-gray-800">Blocked Slots</h4>
                            <form onSubmit={addBlockWindow} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input
                                    type="datetime-local"
                                    value={startBlockAt}
                                    onChange={(event) => setStartBlockAt(event.target.value)}
                                    className="rounded-md border-gray-300 border p-2 text-sm"
                                    required
                                />
                                <input
                                    type="datetime-local"
                                    value={endBlockAt}
                                    onChange={(event) => setEndBlockAt(event.target.value)}
                                    className="rounded-md border-gray-300 border p-2 text-sm"
                                    required
                                />
                                <input
                                    type="text"
                                    value={blockNote}
                                    onChange={(event) => setBlockNote(event.target.value)}
                                    placeholder="Reason (optional)"
                                    className="rounded-md border-gray-300 border p-2 text-sm"
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                                >
                                    Add Block
                                </button>
                            </form>

                            <div className="space-y-2">
                                {loadingBlocks && (
                                    <p className="text-sm text-gray-500">Loading blocked slots...</p>
                                )}
                                {!loadingBlocks && blocks.length === 0 && (
                                    <p className="text-sm text-gray-500">No blocked slots configured.</p>
                                )}
                                {blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2"
                                    >
                                        <div className="text-sm text-gray-700">
                                            <span className="font-medium">
                                                {new Date(block.startTime).toLocaleString()}
                                            </span>
                                            {' '}to{' '}
                                            <span className="font-medium">
                                                {new Date(block.endTime).toLocaleString()}
                                            </span>
                                            {block.note ? ` (${block.note})` : ''}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => deleteBlockWindow(block.id)}
                                            className="text-sm text-red-600 hover:text-red-700 underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {meetings.length === 0 && (
                                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                                    No meetings found yet.
                                </div>
                            )}

                            {meetings.map((meeting) => (
                                <div key={meeting.id} className="rounded-lg border border-gray-200 p-4 bg-white">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{meeting.guestName || 'Guest'}</p>
                                            <p className="text-sm text-gray-500">{meeting.guestEmail || '-'}</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meeting.status === 'booked' ? 'bg-emerald-100 text-emerald-700' :
                                                meeting.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-200 text-gray-700'
                                            }`}>
                                            {meeting.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                        <p>
                                            <span className="font-medium text-gray-700">Start:</span>{' '}
                                            {meeting.startTime ? new Date(meeting.startTime).toLocaleString() : '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Timezone:</span> {meeting.timezone || '-'}
                                        </p>
                                        <p className="md:col-span-2 break-all">
                                            <span className="font-medium text-gray-700">Booking ID:</span> {meeting.forgeCalBookingId}
                                        </p>
                                        {meeting.meetingUrl && (
                                            <a
                                                href={meeting.meetingUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="md:col-span-2 text-indigo-600 hover:underline break-all"
                                            >
                                                {meeting.meetingUrl}
                                            </a>
                                        )}
                                    </div>
                                    {(meeting.status === 'requested' || meeting.status === 'booked') && (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() => cancelMeeting(meeting.forgeCalBookingId)}
                                                disabled={cancelingBookingId === meeting.forgeCalBookingId}
                                                className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
                                            >
                                                {cancelingBookingId === meeting.forgeCalBookingId ? 'Canceling...' : 'Cancel meeting'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
