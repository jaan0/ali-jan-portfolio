# 📊 Portfolio Data Storage Guide

## Where Your Data is Saved

### Local Development (Current Setup)

#### 1. **Text/Content Data**
- **Location**: SQLite database at `/prisma/dev.db`
- **Includes**:
  - Profile info (name, title, about)
  - Experiences
  - Education
  - Skills/Certifications
  - Image URLs/paths

#### 2. **Uploaded Images**
- **Location**: `/public/uploads/` folder
- **Stored**: Original image files
- **Access**: Via URL like `/uploads/filename.jpg`

#### 3. **External Images**
- **Location**: Remain on external servers
- **Storage**: Only the URL is saved in database

### Production Deployment (Vercel)

When you deploy to Vercel, you'll need to:

#### Database Migration
1. **Switch to Vercel Postgres**
   - Update `prisma/schema.prisma`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   - Get Postgres URL from Vercel dashboard
   - Run: `npx prisma db push`
   - Run: `node prisma/seed.js`

#### Image Storage Options

**Option A: Keep in /public** (Simple but not recommended)
- Images stay in `/public/uploads/`
- ⚠️ Files are ephemeral on Vercel - will be deleted on redeployment
- Only for testing

**Option B: Vercel Blob Storage** (Recommended)
```bash
npm install @vercel/blob
```
- Cloud storage for images
- Persistent across deployments
- Easy integration

**Option C: Cloudinary** (Popular alternative)
```bash
npm install cloudinary
```
- Free tier available
- Built-in image optimization
- CDN delivery

## Current File Structure

```
jan-portfolio/
├── prisma/
│   ├── dev.db              # SQLite database (local)
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Initial data
├── public/
│   └── uploads/            # Uploaded images (local)
│       ├── .gitkeep        # Keeps directory in git
│       └── [images]        # User uploaded files
└── .env                    # DATABASE_URL="file:./dev.db"
```

## Data Backup

### Backup Your Local Data

**Database:**
```bash
# Copy the database file
cp prisma/dev.db prisma/dev.db.backup
```

**Images:**
```bash
# Copy uploads folder
cp -r public/uploads public/uploads.backup
```

## Migration to Production Checklist

- [ ] Set up Vercel Postgres database
- [ ] Update DATABASE_URL in Vercel environment variables
- [ ] Update schema to use postgresql
- [ ] Run migrations: `npx prisma db push`
- [ ] Seed data: `node prisma/seed.js`
- [ ] Choose image storage solution (Vercel Blob/Cloudinary)
- [ ] Update upload API to use cloud storage
- [ ] Copy existing images to cloud storage
- [ ] Test deployment

## Quick Facts

✅ **Currently**: Everything is stored locally on your computer
✅ **Database**: SQLite file at `prisma/dev.db`
✅ **Images**: Saved to `public/uploads/` folder
✅ **Safe**: Database and uploads are in `.gitignore`
✅ **Backup**: Keep regular backups of `dev.db` and `uploads/` folder
