const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: 'password123', // In production use bcrypt
            name: 'Ali Jan',
            title: 'Software Engineer',
            subTitle: 'Front-End Developer',
            avatarUrl: '/img/logo.jpeg',
            about: `I started learning programming in early 2018 after doing some basic Notepad coding, such as Timer Shutdown, PC Greets, Matrix, Freeze Virus etc. What began as curiosity quickly turned into a strong desire to solve problems and keep learning.\n\nNow, as a Full-Stack Developer, I keep improving my skills to build useful and efficient solutions. I'm quite interested in new technologies like Web3.0, blockchain, cryptocurrency, NFTs, and AI/ML in addition to full-stack development.`,
            cvUrl: 'https://drive.google.com/file/d/1qK_fiX7NlSWr0gcS7G5-a-xdrqEh5wmf/view?usp=sharing',
            linkedinUrl: 'https://www.linkedin.com/in/ali-jan-ba4339359/',
            githubUrl: 'https://github.com/jaan0/',
            experiences: {
                create: [
                    {
                        title: 'SEO Internship',
                        company: 'Nexia Tech',
                        dateString: '17/04/2025 – 17/07/2025',
                        description: JSON.stringify(['Completed an SEO internship where I focused on off-page SEO tactics, mostly creating high quality backlinks to increase site visibility and search engine rankings.'])
                    },
                    {
                        title: 'Software Engineer',
                        company: 'Aptech Learning',
                        dateString: '16/02/2021 – 10/10/2024',
                        description: JSON.stringify([
                            'Designed a user-friendly interface for a finance and lab automation website using PHP and MySQL.',
                            'Utilized technologies like [Android Studio, PyCharm, VS Code, Dev-C++, Jupyter Notebook]',
                            'Used Python (Django) to design the website for a hotel management system.',
                            'Gained experience in back-end development, database management, and debugging.',
                            'Utilize SEO techniques and tools to optimize content for search engines.',
                            'Demonstrated strong SQL skills by writing CREATE TABLE statements, defining foreign key constraints, and implementing data integrity measures.'
                        ])
                    }
                ]
            },
            educations: {
                create: [
                    {
                        institution: 'Iqra University, Pakistan',
                        degree: 'Bachelor In Computer Science',
                        dateString: '2023 - 2027',
                        description: null
                    },
                    {
                        institution: 'Aptech Learning, Pakistan',
                        degree: 'Advanced Diploma in Software Engineering',
                        dateString: '2021 - 2024',
                        marksheetUrl: 'https://drive.google.com/file/d/114T-XN1KRyXTBM0vCZ0bhtKy2vi2e_Kd/view?usp=sharing'
                    },
                    {
                        institution: 'Quaid e Azam Rangers School & Colleges',
                        degree: 'Higher Secondary Qualification',
                        dateString: 'June, 2020 - Septmeber 10, 2022',
                        description: 'Field: Pre-Engineering. Major modules: Physics, Chemistry, Mathematics'
                    },
                    {
                        institution: 'Secondary Qualification',
                        degree: 'Secondary Qualification', // Placeholder as school name missing in HTML snippet logic
                        dateString: 'June, 2018 - Septmeber 10, 2020',
                        description: 'Field: Computer Science. Major modules: Physics, Chemistry, Mathematics, Computer Science'
                    }
                ]
            },
            skills: {
                create: [
                    {
                        name: 'Intro to Machine Learning',
                        category: 'Certification',
                        issuer: 'Kaggle',
                        dateString: 'May 2024',
                        link: 'https://www.kaggle.com/learn/certification/sameerqureshii/intro-to-machine-learning',
                        tags: JSON.stringify(['Python']),
                        imageUrl: 'img/kaggle.jpg'
                    },
                    {
                        name: 'Pandas',
                        category: 'Certification',
                        issuer: 'Kaggle',
                        dateString: 'May 2024',
                        link: 'https://www.kaggle.com/learn/certification/sameerqureshii/pandas',
                        tags: JSON.stringify(['Python']),
                        imageUrl: 'img/kaggle.jpg'
                    }
                ]
            }
        }
    })
    console.log({ user })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
