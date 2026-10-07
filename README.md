# Amalon International Education CRM
**نظام إدارة علاقات العملاء والقبولات الجامعية لشركة أمالون للدراسة بالخارج**

A comprehensive, production-grade Study-Abroad Consultancy CRM built for **Amalon International Education** across multiple branches (Cairo HQ, Istanbul, Dubai, Baghdad) serving students destined for 11 countries: **Spain 🇪🇸, Malta 🇲🇹, Germany 🇩🇪, United Kingdom 🇬🇧, Turkey 🇹🇷, Russia 🇷🇺, Ukraine 🇺🇦, Belarus 🇧🇾, Cyprus 🇨🇾, Malaysia 🇲🇾, and Egypt 🇪🇬**.

---

## 🛠 Tech Stack
- **Framework:** Next.js 15+ (App Router) with TypeScript (Strict)
- **Styling & UI:** Tailwind CSS v4, Cairo Font (Arabic default, full RTL with English toggle), Dark/Light theme
- **Database & ORM:** Prisma ORM with SQLite (dev/embedded) and PostgreSQL schema (`prisma/schema.postgresql.prisma` + Docker Compose)
- **Authentication:** JWT Sessions (Auth.js compatible, `jose`, HTTP-only secure cookies) with bcrypt password hashing
- **Security:** Server-side RBAC enforcement, AES encrypted passport numbers, complete Audit Log trail (`AuditLog`)
- **Containerization:** Production Dockerfile + `docker-compose.yml` (App + PostgreSQL + Persistent Volumes + Backups)

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js 20+
- npm 10+

### 2. Environment Setup
Create your `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Key variables:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="amalon_super_secret_crm_jwt_key_2026_xyz"
LOCAL_UPLOAD_DIR="./uploads"
```

### 3. Generate Database & Seed
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **👑 مدير النظام (Admin)** | `admin@amalon.com` | `Admin123456!` | Full system access, all branches, audit logs |
| **🎓 مستشارة قبولات (Counselor)** | `counselor@amalon.com` | `Counselor123!` | Student admissions, documents, follow-ups |
| **🛂 مسؤول تأشيرات (Visa Officer)** | `visa@amalon.com` | `Visa123!` | Embassy files, visa cases, checklist items |

*Tip: Quick 1-click credential buttons are available right on the `/login` screen.*

---

## 🐳 Production Deployment (Docker & PostgreSQL)

The repository includes a ready-to-run `docker-compose.yml` orchestrating PostgreSQL 16 and the standalone Next.js CRM service.

```bash
# Start all containers
docker-compose up -d --build

# Run migrations on production PostgreSQL
docker-compose exec crm_app npx prisma db push --schema=prisma/schema.postgresql.prisma
docker-compose exec crm_app npx tsx prisma/seed.ts
```

---

## 💾 Automated Database Backups & Restore

### Backup
Run `/scripts/backup.sh` directly or via cron:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

### PostgreSQL Restore
```bash
gunzip -c /backup/amalon_crm_postgres_YYYYMMDD_HHMMSS.sql.gz | psql -U amalon_admin -d amalon_crm
```

### SQLite Restore
```bash
gunzip -c /backup/amalon_crm_sqlite_YYYYMMDD_HHMMSS.db.gz > ./dev.db
```

---

## 📂 Project Architecture

```
├── app/
│   ├── api/
│   │   ├── auth/          # Login, Logout, Session inspection (/me)
│   │   ├── branches/      # Multi-branch selector endpoint
│   │   ├── dashboard/     # Live operational metrics & counters
│   │   └── notifications/ # Bell notifications & read status
│   ├── login/             # Arabic/English login portal with role presets
│   ├── layout.tsx         # Root layout with Cairo font, CrmProvider, CrmShell
│   └── page.tsx           # Operational Dashboard (12 metrics, charts, tasks, visas)
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx    # RTL Responsive Navigation Sidebar
│   │   ├── header.tsx     # Branch filter, notification bell, theme/lang toggle
│   │   └── crm-shell.tsx  # Auth-protected shell wrapper
│   └── providers/
│       └── crm-provider.tsx # Multi-language (AR/EN), Theme (light/dark), Branch store
├── lib/
│   ├── audit.ts           # Central audit logging (who, when, action, old/new value)
│   ├── auth.ts            # JWT session minting, parsing, and verification
│   ├── crypto.ts          # AES-256 passport number encryption & decryption
│   ├── prisma.ts          # Prisma Client singleton
│   └── rbac.ts            # Server-side permission guards & branch scoping
├── prisma/
│   ├── schema.prisma      # Full schema (SQLite for local rapid dev)
│   ├── schema.postgresql.prisma # Production PostgreSQL schema
│   └── seed.ts            # Seed: 11 Countries, 14 Kanban stages, roles, permissions, demo data
├── Dockerfile             # Multi-stage production container
└── docker-compose.yml     # PostgreSQL + Next.js orchestration
```

---

## 🔒 Security & Data Ownership
1. **Server-Side Authorization:** Permissions are checked server-side via `hasPermission` / `requirePermission` before database mutations.
2. **Audit Logging:** Every sensitive creation, modification, deletion, and status change generates an unalterable `AuditLog` entry.
3. **Passport Privacy:** Passport numbers are encrypted with AES-256 before storage in `passportNumberEnc`.
4. **Soft Deletion:** Every core entity implements `deletedAt` for compliance and recovery.
