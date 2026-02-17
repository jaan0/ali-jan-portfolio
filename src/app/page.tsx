import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, FileText, Target, ExternalLink, FolderKanban } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@example.com' },
    include: { experiences: true, educations: true, skills: true, projects: true }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">Please run the seed script to populate the database.</p>
          <code className="bg-gray-100 p-2 rounded text-sm">npm run seed</code>
        </div>
      </div>
    );
  }

  // Helper to safely parse JSON
  const parseList = (jsonStr: string | null) => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [jsonStr]; // Fallback if regular string
    }
  };

  return (
    <main className="min-h-screen bg-white/50 pb-20">
      {/* Decorative timeline line wrapper if needed, or stick to simple layout */}

      <div className="mx-auto max-w-3xl px-5 pt-10 flex flex-col gap-12">
        {/* Header / Hero */}
        <header className="flex flex-col sm:flex-row items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative w-44 h-44 shrink-0 bg-indigo-100 border-4 border-white shadow-xl rounded-full overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-transparent transition z-10" />
            <Image
              src={user.avatarUrl?.startsWith('http') ? user.avatarUrl : (user.avatarUrl ? `/${user.avatarUrl.replace(/^\//, '')}` : 'https://avatar.vercel.sh/ali-jan')}
              alt={user.name}
              fill
              className="object-cover"
              priority
              unoptimized // For external/local mix simplicity
            />
          </div>

          <div className="flex flex-col items-center sm:items-start gap-4 text-center sm:text-left">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 tracking-tight mb-2">
                {user.name}
              </h1>
              <div className="text-lg sm:text-xl font-medium text-slate-600 space-y-1">
                <p className="text-indigo-600 font-semibold">{user.title}</p>
                {user.subTitle && <p className="text-slate-500 text-base">{user.subTitle}</p>}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {user.linkedinUrl && (
                <Link href={user.linkedinUrl} target="_blank" className="p-2.5 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all group" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </Link>
              )}
              {user.githubUrl && (
                <Link href={user.githubUrl} target="_blank" className="p-2.5 bg-white border border-gray-200 rounded-full hover:border-gray-800 hover:text-gray-900 hover:shadow-md transition-all group" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </Link>
              )}
              {user.cvUrl && (
                <Link href={user.cvUrl} target="_blank" className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-200 font-medium text-sm">
                  <FileText className="w-4 h-4" />
                  <span>View CV</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <hr className="border-gray-100" />

        {/* About Section */}
        {user.about && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              About Me <span className="text-2xl">👋</span>
            </h2>
            <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
              {user.about}
            </div>
          </section>
        )}

        {/* Experience Section */}
        {user.experiences.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              Experience <span className="text-2xl">💼</span>
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {user.experiences.map((exp) => (
                <div key={exp.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline Dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 group-hover:bg-indigo-500 transition shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Target className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                  </div>

                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col mb-1">
                      <span className="font-bold text-slate-700 text-lg">{exp.title}</span>
                      <span className="text-indigo-600 font-medium">{exp.company}</span>
                      <time className="text-xs text-slate-400 font-mono mt-1">{exp.dateString}</time>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {parseList(exp.description).map((desc: string, i: number) => (
                        <li key={i} className="text-slate-600 text-sm leading-relaxed flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          <span>{desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education Section */}
        {user.educations.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              Education <span className="text-2xl">🎓</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.educations.map((edu) => (
                <div key={edu.id} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-slate-700 text-lg mb-1">{edu.degree}</h3>
                  <p className="text-slate-500 text-sm mb-3 font-medium">{edu.institution}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono">{edu.dateString}</span>
                    {edu.marksheetUrl && (
                      <Link href={edu.marksheetUrl.startsWith('http') ? edu.marksheetUrl : `/${edu.marksheetUrl.replace(/^\//, '')}`} target="_blank" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                        View Diploma <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {edu.description && (
                    <p className="mt-3 text-sm text-slate-500 border-t border-gray-50 pt-3">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills & Certifications */}
        {user.skills.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              Certifications <span className="text-2xl">📜</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.skills.map((skill) => (
                <Link href={skill.link || '#'} key={skill.id} target="_blank" className="group">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center shrink-0">
                      {skill.imageUrl ? (
                        <Image
                          src={skill.imageUrl.startsWith('http') ? skill.imageUrl : `/${skill.imageUrl.replace(/^\//, '')}`}
                          alt={skill.name}
                          width={48}
                          height={48}
                          className="object-cover transition-transform group-hover:scale-110"
                          unoptimized
                        />
                      ) : (
                        <Target className="w-6 h-6 text-indigo-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition">{skill.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{(skill as any).issuer} • {(skill as any).dateString}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {user.projects.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              Projects <span className="text-2xl">🚀</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.projects.map((project) => (
                <div key={project.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <div className="relative h-48 w-full bg-slate-100">
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl.startsWith('http') ? project.imageUrl : `/${project.imageUrl.replace(/^\//, '')}`}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FolderKanban className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition">{project.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {parseList(project.tags).map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {project.link && (
                      <Link href={project.link} target="_blank" className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:gap-3 transition-all">
                        View Project <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-slate-400 text-sm py-10">
          <p>© {new Date().getFullYear()} {user.name}. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
