# InvoiceHub - Invoice Management System

Sistem manajemen invoice profesional berbasis web untuk mengelola proyek, invoice (dengan line items & PDF generation), pengeluaran, dan anggaran. Terdiri dari 2 repository: **Frontend** (Next.js) dan **Backend** (Go/Fiber).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Setup & Instalasi](#setup--instalasi)
- [Environment Variables](#environment-variables)
- [Fitur Lengkap](#fitur-lengkap)
- [Role & Permission Matrix](#role--permission-matrix)
- [Invoice System](#invoice-system)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Struktur Proyek](#struktur-proyek)
- [Design Patterns](#design-patterns)
- [Deployment](#deployment)

---

## Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| [Next.js](https://nextjs.org/) | 16.1.6 | Framework React (App Router) |
| [React](https://react.dev/) | 19.2.3 | UI Library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 2.11.2 | State management & RTK Query |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Styling |
| [Lucide React](https://lucide.dev/) | 0.563.0 | Icon library |
| [React Hot Toast](https://react-hot-toast.com/) | 2.6.0 | Notifikasi toast |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| [Go](https://go.dev/) | 1.24.0 | Backend language |
| [Fiber](https://gofiber.io/) | v2 | HTTP framework |
| [MySQL](https://www.mysql.com/) | 8.x | Database |
| [JWT](https://github.com/golang-jwt/jwt) | v5 | Authentication |
| [go-playground/validator](https://github.com/go-playground/validator) | v10 | Request validation |

### Infrastructure

| Service | Fungsi |
|---------|--------|
| [Vercel](https://vercel.com/) | Frontend hosting |
| [Railway](https://railway.app/) | Backend + MySQL hosting |

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | *(Vercel URL)* |
| Backend API | `https://invoice-backend-production-ceda.up.railway.app/api` |
| Health Check | `GET /api/health` |

---

## Arsitektur Sistem

```
┌──────────────────┐       HTTPS        ┌──────────────────────┐       MySQL      ┌─────────┐
│                  │  ──────────────►    │                      │  ──────────────►  │         │
│   Next.js App    │    RTK Query        │   Go/Fiber API       │                   │  MySQL  │
│   (Vercel)       │  ◄──────────────    │   (Railway)          │  ◄──────────────  │  (Rail) │
│                  │                     │                      │                   │         │
│  - React 19      │       SSE           │  - JWT Auth          │                   │         │
│  - Redux Toolkit │  ◄──────────────    │  - Role middleware   │                   │         │
│  - Tailwind CSS  │    EventSource      │  - File upload       │                   │         │
│                  │                     │  - SSE notifications │                   │         │
└──────────────────┘                     └──────────────────────┘                   └─────────┘
```

### Request Flow
```
Browser → Next.js (SSR/CSR) → RTK Query → Fiber API → Service → Repository → MySQL
                                  ↑                         ↓
                                  └──── SSE (EventSource) ──┘
```

---

## Setup & Instalasi

### Prasyarat

- **Node.js** >= 20.9.0 (disarankan v20.19.2+)
- **Go** >= 1.24.0
- **MySQL** 8.x
- **npm** >= 9.x

### Frontend

```bash
# 1. Clone & install
git clone <frontend-repo-url>
cd invoice-frontend
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL sesuai backend URL

# 3. Development
npm run dev          # http://localhost:3001

# 4. Production
npm run build
npm start

# 5. Type check & lint
npx tsc --noEmit
npm run lint
```

### Backend

```bash
# 1. Clone & install
git clone <backend-repo-url>
cd invoice-backend
go mod download

# 2. Setup environment
cp .env.example .env
# Edit konfigurasi database & JWT secret

# 3. Jalankan migration
# Execute semua file di folder migrations/ secara berurutan di MySQL:
#   - 000001_init_schema.sql
#   - 000002_invoices.sql
#   - 000003_enhanced_invoices.sql

# 4. Run server
go run cmd/server/main.go    # http://localhost:3000
```

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Contoh | Deskripsi |
|----------|--------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://backend.railway.app/api` | Base URL API backend (harus diakhiri `/api`) |

> **Penting:** `NEXT_PUBLIC_*` di-embed saat build time. Setelah mengubah, harus rebuild (`npm run build`).

### Backend (`.env`)

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `APP_PORT` | `3000` | Port server |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | - | MySQL password |
| `DB_NAME` | `invoice_db` | Nama database |
| `MYSQL_URL` | - | Full MySQL URL (Railway auto-set) |
| `JWT_SECRET` | - | Secret key untuk JWT (wajib diisi) |
| `JWT_EXPIRY_HOURS` | `24` | Masa berlaku JWT token (jam) |

> Backend mendukung Railway env variables (`MYSQLHOST`, `MYSQLPORT`, dll) secara otomatis.

---

## Fitur Lengkap

### 1. Autentikasi & Role-Based Access Control
- Login dan Register dengan JWT
- 3 role: **SPV** (Supervisor), **FINANCE**, **OWNER**
- Password strength indicator (5 level) saat registrasi
- Konfirmasi password untuk mencegah typo
- Route protection otomatis dengan `AuthGuard`
- Hydration-safe auth (SSR compatible, no mismatch)

### 2. Dashboard
- Overview total anggaran, terpakai, dan tersisa
- Progress bar pemakaian budget (persentase)
- Statistik proyek, invoice, pengeluaran, budget request
- Breakdown status (pending/approved/rejected) per kategori

### 3. Manajemen Proyek
- CRUD proyek (buat, lihat, edit)
- Detail proyek: budget info, progress, daftar anggota
- Tambah/hapus anggota proyek (searchable user dropdown)
- Hanya **FINANCE** dan **OWNER** yang bisa membuat & mengelola proyek

### 4. Invoice (Enhanced)
- **7 tipe invoice**: DP, Final Payment, TOP 1/2/3, Meals, Additional
- **Line items**: deskripsi, harga, jumlah, unit, subtotal — unlimited items
- **Recipient info**: nama perusahaan, alamat, attention, no. PO
- **DP fleksibel**: persentase DP bisa diatur (tidak fix 50%)
- **Pajak**: persentase pajak configurable per invoice
- **Multi-bahasa**: Indonesia & English (untuk invoice international)
- **PDF Preview**: template invoice profesional langsung di browser
- **Cetak/Download PDF**: via browser print (Ctrl+P) dengan format A4
- **Terbilang**: angka otomatis dikonversi ke kata (ID & EN)
- **Approve/Reject**: OWNER bisa approve/reject invoice yang dibuat FINANCE
- **Auto invoice number**: format `001/INV/{KODE}/{MM}/{YYYY}` (dari company settings)

### 5. Pengeluaran (Expenses)
- Catat pengeluaran langsung tanpa perlu approval (budget sudah dialokasikan)
- Kategori: Supplies, Equipment, Travel, Marketing, Office, Lainnya
- Upload bukti pengeluaran (JPG, PNG, PDF max 5MB)
- Hapus pengeluaran milik sendiri dengan konfirmasi dialog

### 6. Budget Request
- Ajukan permintaan tambahan budget untuk proyek
- Card-based UI dengan detail amount dan justifikasi
- Approve otomatis menambah `total_budget` proyek
- Reject dengan alasan wajib (min. 5 karakter)

### 7. Notifikasi Real-time
- **SSE (Server-Sent Events)** — bukan polling, real-time push
- Event types: `notification`, `invoice_update`, `expense_update`, `budget_request_update`, `project_update`
- Badge unread count di header (auto-update)
- Mark as read / mark all as read
- Klik notifikasi → navigasi ke halaman terkait
- Pagination (15 item per halaman)

### 8. Audit Log
- Riwayat semua aktivitas di sistem
- Filter: Invoice, Expense, Budget Request, Project
- Color-coded actions: CREATE, UPDATE, DELETE, APPROVE, REJECT
- Pagination (15 item per halaman)
- Hanya **FINANCE** dan **OWNER**

### 9. Company Settings
- Pengaturan informasi perusahaan (nama, kode, alamat, telepon, email, NPWP)
- Informasi bank (nama bank, cabang, nomor rekening, atas nama)
- Upload logo perusahaan
- Penandatangan invoice (nama & jabatan)
- Data otomatis muncul di semua invoice PDF
- Hanya **FINANCE** dan **OWNER**

---

## Role & Permission Matrix

| Fitur | SPV | FINANCE | OWNER |
|-------|:---:|:-------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ |
| Buat Invoice | - | ✅ | - |
| Lihat/Detail Invoice | - | ✅ | ✅ |
| Cetak Invoice PDF | - | ✅ | ✅ |
| Approve/Reject Invoice | - | - | ✅ |
| Buat Pengeluaran | ✅ | ✅ | ✅ |
| Hapus Pengeluaran (milik sendiri) | ✅ | ✅ | ✅ |
| Buat Proyek | - | ✅ | ✅ |
| Edit Proyek | - | ✅ | ✅ |
| Kelola Anggota Proyek | - | ✅ | ✅ |
| Ajukan Budget Request | ✅ | ✅ | ✅ |
| Approve/Reject Budget Request | - | ✅ | ✅ |
| Notifikasi | ✅ | ✅ | ✅ |
| Audit Log | - | ✅ | ✅ |
| Company Settings | - | ✅ | ✅ |

---

## Invoice System

### Tipe Invoice

| Tipe | Kode | Deskripsi |
|------|------|-----------|
| Down Payment | `DP` | Pembayaran awal, persentase fleksibel |
| Final Payment | `FINAL_PAYMENT` | Pelunasan sisa pembayaran |
| Termin 1 | `TOP_1` | Term of Payment tahap 1 |
| Termin 2 | `TOP_2` | Term of Payment tahap 2 |
| Termin 3 | `TOP_3` | Term of Payment tahap 3 |
| Meals | `MEALS` | Invoice makan (terpisah, tanpa pajak) |
| Additional | `ADDITIONAL` | Invoice tambahan dengan bukti |

### Format Nomor Invoice

```
{sequence}/INV/{company_code}/{month}/{year}
Contoh: 001/INV/CGA/02/2026
```
- `{sequence}` — auto-increment per invoice (3 digit)
- `{company_code}` — dari Company Settings (contoh: CGA)
- `{month}/{year}` — bulan dan tahun dari tanggal invoice

### Invoice PDF Template

Invoice PDF mengikuti template profesional dengan elemen:

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]  PT. Nama Perusahaan          INVOICE       │
│  Alamat, Telepon, Email          001/INV/CGA/02/2026│
│  NPWP: xx.xxx.xxx.x-xxx.xxx     Down Payment (DP)  │
│─────────────────────────────────────────────────────│
│  Kepada:                         Tanggal:           │
│  PT. Client Name                 20 Februari 2026   │
│  Alamat client                   No. PO: PO-001     │
│  Attn: Bpk/Ibu xxx                                 │
│─────────────────────────────────────────────────────│
│  No │ Keterangan    │ Harga     │ Qty │ Unit │ Sub  │
│  1  │ Development   │ 50.000.000│  1  │ lot  │ 50jt │
│  2  │ Design UI/UX  │ 20.000.000│  1  │ lot  │ 20jt │
│─────────────────────────────────────────────────────│
│                               Subtotal:  Rp70.000.000│
│                               Tax (11%): Rp 7.700.000│
│                               TOTAL:     Rp77.700.000│
│                               DP (50%):  Rp38.850.000│
│                               Pelunasan: Rp38.850.000│
│─────────────────────────────────────────────────────│
│  Terbilang: Tujuh Puluh Tujuh Juta Tujuh Ratus     │
│  Ribu Rupiah                                        │
│─────────────────────────────────────────────────────│
│  Informasi Pembayaran:                              │
│  Bank BCA - KCP Sudirman                            │
│  No. Rek: 1234567890                                │
│  a/n PT. Nama Perusahaan                            │
│─────────────────────────────────────────────────────│
│                               Hormat kami,          │
│                                                     │
│                               ____________          │
│                               Nama Penandatangan    │
│                               Director              │
└─────────────────────────────────────────────────────┘
```

### Alur Invoice

```
FINANCE buat invoice (PENDING) → OWNER review
  ├── APPROVE → status = APPROVED, notifikasi ke FINANCE
  └── REJECT  → status = REJECTED + alasan, notifikasi ke FINANCE
```

---

## API Reference

Semua endpoint menggunakan prefix `/api`. Autentikasi via header `Authorization: Bearer <token>`.

### Auth (Public)

| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/auth/register` | `{ full_name, email, password, role }` | Register user baru |
| `POST` | `/auth/login` | `{ email, password }` | Login, return JWT + user |

### Projects

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/projects` | All | List proyek (SPV: hanya member) |
| `GET` | `/projects/:id` | All | Detail proyek |
| `POST` | `/projects` | FINANCE, OWNER | Buat proyek baru |
| `PUT` | `/projects/:id` | FINANCE, OWNER | Update proyek |
| `GET` | `/projects/:id/members` | All | List anggota proyek |
| `POST` | `/projects/:id/members` | FINANCE, OWNER | Tambah anggota |
| `DELETE` | `/projects/:id/members/:userId` | FINANCE, OWNER | Hapus anggota |

### Invoices

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/invoices` | All | List invoice (SPV: hanya project member) |
| `GET` | `/invoices/:id` | All | Detail invoice + items |
| `POST` | `/invoices` | FINANCE | Buat invoice dengan items |
| `PUT` | `/invoices/:id` | FINANCE | Update invoice (hanya PENDING) |
| `DELETE` | `/invoices/:id` | FINANCE | Hapus invoice (hanya PENDING) |
| `POST` | `/invoices/:id/approve` | OWNER | Approve invoice |
| `POST` | `/invoices/:id/reject` | OWNER | Reject invoice (notes wajib min 5 char) |

**Create Invoice Body:**
```json
{
  "project_id": 1,
  "invoice_type": "DP",
  "recipient_name": "PT. Client Name",
  "recipient_address": "Jl. Contoh No. 1",
  "attention": "Bpk. John",
  "po_number": "PO-001",
  "invoice_date": "2026-02-20",
  "dp_percentage": 50,
  "tax_percentage": 11,
  "notes": "Catatan optional",
  "language": "ID",
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "unit": "lot",
      "unit_price": 50000000
    }
  ]
}
```

### Expenses

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/expenses` | All | List pengeluaran |
| `GET` | `/expenses/:id` | All | Detail pengeluaran |
| `POST` | `/expenses` | All | Buat pengeluaran (langsung tercatat, tanpa approval) |
| `PUT` | `/expenses/:id` | All | Update (milik sendiri) |
| `DELETE` | `/expenses/:id` | All | Hapus (milik sendiri) |

### Budget Requests

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/budget-requests` | All | List budget request |
| `GET` | `/budget-requests/:id` | All | Detail |
| `POST` | `/budget-requests` | All | Buat request |
| `POST` | `/budget-requests/:id/approve` | FINANCE, OWNER | Approve (+ update budget) |
| `POST` | `/budget-requests/:id/reject` | FINANCE, OWNER | Reject |

### Company Settings

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/company-settings` | All | Get company settings |
| `PUT` | `/company-settings` | FINANCE, OWNER | Create/Update settings |

### Other

| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/dashboard` | All | Dashboard summary |
| `GET` | `/notifications` | All | List notifikasi |
| `GET` | `/notifications/unread-count` | All | Jumlah notif belum dibaca |
| `PATCH` | `/notifications/:id/read` | All | Tandai sudah dibaca |
| `PATCH` | `/notifications/read-all` | All | Tandai semua dibaca |
| `GET` | `/audit-logs` | FINANCE, OWNER | List audit logs |
| `POST` | `/upload` | All | Upload file (max 5MB, JPG/PNG/PDF) |
| `GET` | `/users` | All | List users (filter by role) |
| `GET` | `/events` | All | SSE stream (real-time) |
| `GET` | `/health` | Public | Health check |

---

## Database Schema

### Tabel Utama

```sql
users                    -- User accounts (SPV/FINANCE/OWNER)
projects                 -- Projects
project_members          -- Many-to-many: user ↔ project
project_budgets          -- One-to-one: project budget tracking
invoices                 -- Invoices (enhanced: type, status, recipient, tax)
invoice_items            -- Line items per invoice
expenses                 -- Expenses with category & receipt
expense_approvals        -- Approval records for expenses
budget_requests          -- Budget increase requests
notifications            -- User notifications
audit_logs               -- System-wide audit trail
company_settings         -- Company info for invoices
```

### ERD Ringkas

```
users ──┬── projects (created_by)
        ├── project_members ──── projects
        ├── invoices (created_by, approved_by) ──── projects
        │   └── invoice_items
        ├── expenses (created_by) ──── projects
        │   └── expense_approvals
        ├── budget_requests (requested_by, approved_by) ──── projects
        ├── notifications
        └── audit_logs

company_settings (standalone, 1 row)
project_budgets ──── projects (one-to-one)
```

### Migration Files

Jalankan secara berurutan:

1. **`000001_init_schema.sql`** — users, projects, project_members, project_budgets, expenses, expense_approvals, budget_requests, notifications, audit_logs
2. **`000002_invoices.sql`** — invoices table (basic)
3. **`000003_enhanced_invoices.sql`** — ALTER invoices (tambah type, status, recipient, tax, approve/reject), CREATE invoice_items, CREATE company_settings

---

## Struktur Proyek

### Frontend

```
invoice-frontend/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (StoreProvider, Toaster)
│   ├── page.tsx                      # Landing (redirect logic)
│   ├── globals.css                   # Tailwind + custom styles
│   ├── (auth)/                       # Auth pages (tanpa sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/                  # Dashboard pages (dengan sidebar + SSE)
│       ├── layout.tsx                # Sidebar, Header, AuthGuard, useSSE()
│       ├── dashboard/page.tsx
│       ├── projects/
│       │   ├── page.tsx              # List proyek
│       │   └── [id]/page.tsx         # Detail proyek + members
│       ├── invoices/
│       │   ├── page.tsx              # List invoice + create modal
│       │   └── [id]/page.tsx         # Detail invoice + PDF preview
│       ├── expenses/page.tsx
│       ├── budget-requests/page.tsx
│       ├── notifications/page.tsx
│       ├── audit-logs/page.tsx
│       └── settings/page.tsx         # Company settings
│
├── components/
│   ├── layout/
│   │   ├── AuthGuard.tsx             # Route protection
│   │   ├── Header.tsx                # Header + notif badge
│   │   └── Sidebar.tsx               # Collapsible sidebar, role-based menu
│   ├── providers/
│   │   └── StoreProvider.tsx         # Redux provider
│   └── ui/
│       ├── Badge.tsx                 # Status badges
│       ├── ConfirmDialog.tsx         # Confirmation dialogs
│       ├── EmptyState.tsx            # Empty/error states
│       ├── LoadingSpinner.tsx        # Spinner
│       ├── Modal.tsx                 # Reusable modal (sm/md/lg)
│       └── Pagination.tsx            # Pagination component
│
├── lib/
│   ├── api/                          # RTK Query API slices
│   │   ├── baseApi.ts                # Base config (JWT inject, tags)
│   │   ├── authApi.ts                # Login & register
│   │   ├── invoiceApi.ts             # Invoice CRUD + approve/reject
│   │   ├── expenseApi.ts             # Expense CRUD + approve/reject
│   │   ├── projectApi.ts             # Project CRUD + members
│   │   ├── budgetRequestApi.ts       # Budget request CRUD
│   │   ├── companySettingsApi.ts      # Company settings get/upsert
│   │   ├── dashboardApi.ts           # Dashboard summary
│   │   ├── notificationApi.ts        # Notifications
│   │   ├── auditLogApi.ts            # Audit logs
│   │   ├── uploadApi.ts              # File upload
│   │   └── userApi.ts                # User list
│   ├── hooks/
│   │   └── useSSE.ts                 # SSE real-time hook
│   ├── slices/
│   │   └── authSlice.ts              # Auth state (token, user, hydrated)
│   ├── types/
│   │   └── index.ts                  # All TypeScript interfaces
│   ├── hooks.ts                      # Typed Redux hooks
│   ├── store.ts                      # Redux store config
│   └── utils.ts                      # formatCurrency, terbilang, numberToWords, dll
│
├── .env.local                        # Environment variables
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Backend

```
invoice-backend/
├── cmd/server/
│   └── main.go                       # Entry point
├── internal/
│   ├── config/config.go              # Environment config
│   ├── database/mysql.go             # MySQL connection
│   ├── middleware/
│   │   ├── auth.go                   # JWT validation
│   │   ├── context.go                # Context helpers
│   │   └── role.go                   # Role-based access
│   ├── model/                        # Data models
│   │   ├── user.go
│   │   ├── project.go
│   │   ├── project_budget.go
│   │   ├── project_member.go
│   │   ├── invoice.go                # Enhanced: type, status, recipient
│   │   ├── invoice_item.go           # Line items
│   │   ├── expense.go
│   │   ├── expense_approval.go
│   │   ├── budget_request.go
│   │   ├── notification.go
│   │   ├── audit_log.go
│   │   └── company_settings.go
│   ├── dto/
│   │   ├── request/                  # Request DTOs (validation tags)
│   │   └── response/                 # Response DTOs
│   ├── repository/                   # Database queries
│   ├── service/                      # Business logic
│   ├── handler/                      # HTTP handlers (Fiber)
│   ├── router/router.go             # Route definitions
│   └── sse/hub.go                   # SSE event hub
├── migrations/                       # SQL migration files
├── uploads/                          # Uploaded files
├── go.mod
└── .env
```

---

## Design Patterns

### State Management (Frontend)

```
Redux Toolkit
├── authSlice     → token, user, hydrated flag (localStorage)
└── RTK Query     → semua API calls
    ├── Automatic caching
    ├── Tag-based cache invalidation
    ├── Loading/error state management
    └── SSE → invalidate tags → auto-refetch
```

### Authentication Flow

```
1. User login/register → Backend returns JWT + user data
2. Token disimpan di Redux state + localStorage
3. AuthGuard cek hydrated flag → show loading sampai hydrated
4. Setelah hydrated, cek token → redirect ke login jika tidak ada
5. Semua API request otomatis inject Bearer token via baseApi
```

### Hydration-Safe Pattern

```
Server render: { token: null, user: null, hydrated: false }
Client mount:  useEffect → dispatch(hydrate()) → baca localStorage
Setelah hydrated: render sesuai auth state
```

Ini mencegah hydration mismatch antara server dan client rendering.

### Real-time Updates (SSE)

```
1. Dashboard layout mount → useSSE() hook aktif
2. EventSource connect ke GET /api/events?token=<jwt>
3. Event diterima → invalidate RTK Query tags
4. RTK Query auto-refetch data yang berubah
5. UI update otomatis tanpa manual refresh
```

### Backend Architecture

```
Handler (HTTP layer)
  → ParseAndValidate request
  → Call Service method
Service (Business logic)
  → Validate business rules
  → Call Repository
  → Create audit logs
  → Send notifications via SSE
Repository (Data access)
  → Raw SQL queries
  → Transaction management
  → Return models
```

---

## Deployment

### Frontend → Vercel

1. Connect repo ke Vercel
2. Set environment variable di Vercel Dashboard:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.railway.app/api
   ```
3. Deploy (auto-build on push)

> **Penting:** Setiap kali mengubah `NEXT_PUBLIC_API_URL`, harus redeploy karena nilainya di-embed saat build.

### Backend → Railway

1. Connect repo ke Railway
2. Railway auto-detect Go project
3. Add MySQL service (Railway auto-set `MYSQL_*` env variables)
4. Set env variables tambahan:
   ```
   JWT_SECRET = <your-secret-key>
   APP_PORT = 3000
   ```
5. Jalankan migration SQL di MySQL Railway

### Docker (Alternative)

**Frontend:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3001
ENV PORT=3001
CMD ["npm", "start"]
```

**Backend:**
```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations
RUN mkdir -p uploads
EXPOSE 3000
CMD ["./server"]
```

---

## Kontak & Tim

- **Repository Frontend:** `invoice-frontend`
- **Repository Backend:** `invoice-backend`

---

*Dokumentasi ini di-generate pada Februari 2026.*
