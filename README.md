# InvoiceHub - Invoice Management System Frontend

Sistem manajemen invoice berbasis web untuk mengelola proyek, invoice, pengeluaran, dan anggaran. Dibangun dengan Next.js 16, React 19, dan Redux Toolkit (RTK Query).

## Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| [Next.js](https://nextjs.org/) | 16.1.6 | Framework React dengan App Router |
| [React](https://react.dev/) | 19.2.3 | UI Library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 2.11.2 | State management & RTK Query |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Styling |
| [Lucide React](https://lucide.dev/) | 0.563.0 | Icon library |
| [React Hot Toast](https://react-hot-toast.com/) | 2.6.0 | Notifikasi toast |
| [clsx](https://github.com/lukeed/clsx) | 2.1.1 | Utility class names |

## Prasyarat

- **Node.js** >= 20.9.0 (disarankan v20.19.2+)
- **npm** >= 9.x
- **Backend** berjalan di `http://localhost:3000` (Go/Fiber + MySQL)

## Instalasi & Menjalankan

```bash
# 1. Clone repository
git clone <repo-url>
cd invoice-frontend

# 2. Install dependencies
npm install

# 3. Setup environment variable
cp .env.example .env.local
# Edit .env.local sesuai URL backend Anda
```

### Environment Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Base URL API backend |

### Menjalankan

```bash
# Development
npm run dev          # http://localhost:3001

# Production build
npm run build
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Fitur Utama

### 1. Autentikasi & Role-Based Access Control
- Login dan Register dengan JWT
- 3 role: **SPV** (Supervisor), **FINANCE**, **OWNER**
- Password strength indicator saat registrasi
- Konfirmasi password untuk mencegah typo
- Route protection dengan `AuthGuard`
- Hydration-safe auth (SSR compatible)

### 2. Dashboard
- Overview total anggaran, terpakai, dan tersisa
- Progress bar pemakaian budget
- Statistik proyek, invoice, pengeluaran, budget request
- Breakdown status (pending/approved/rejected)

### 3. Manajemen Proyek
- CRUD proyek (buat, lihat, edit)
- Detail proyek dengan informasi budget dan progress
- Tambah/hapus anggota proyek (searchable user dropdown)
- Hanya **FINANCE** dan **OWNER** yang bisa membuat dan mengelola proyek

### 4. Invoice
- Buat invoice dengan upload file attachment (JPG, PNG, PDF, max 5MB)
- Filter berdasarkan status (Pending/Approved/Rejected)
- Approve/Reject invoice dengan konfirmasi dialog
- Alasan penolakan wajib diisi (min. 5 karakter)
- Hanya **SPV** yang bisa membuat invoice
- Hanya **FINANCE/OWNER** yang bisa approve/reject

### 5. Pengeluaran (Expenses)
- Catat pengeluaran dengan kategori dan upload bukti
- Kategori: Supplies, Equipment, Travel, Marketing, Office, Lainnya
- Filter, approve/reject, dan delete dengan konfirmasi dialog
- Validasi ukuran file upload (max 5MB)

### 6. Budget Request
- Ajukan permintaan tambahan budget untuk proyek
- Card-based UI dengan detail amount dan justifikasi
- Approve/Reject dengan konfirmasi dialog

### 7. Notifikasi Real-time
- **SSE (Server-Sent Events)** untuk notifikasi real-time
- Badge unread count di header
- Mark as read / mark all as read
- Klik notifikasi navigasi ke halaman terkait (invoice/expense/budget request)
- Pagination (15 item per halaman)

### 8. Audit Log
- Riwayat semua aktivitas di sistem
- Filter berdasarkan entity type (Invoice, Expense, Budget Request, Project)
- Color-coded action types (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- Pagination (15 item per halaman)
- Hanya bisa diakses **FINANCE** dan **OWNER**

## Role & Permission Matrix

| Fitur | SPV | FINANCE | OWNER |
|-------|:---:|:-------:|:-----:|
| Lihat Dashboard | Y | Y | Y |
| Buat Invoice | Y | - | - |
| Approve/Reject Invoice | - | Y | Y |
| Buat Pengeluaran | Y | Y | Y |
| Approve/Reject Pengeluaran | - | Y | Y |
| Hapus Pengeluaran (milik sendiri) | Y | Y | Y |
| Buat Proyek | - | Y | Y |
| Edit Proyek | - | Y | Y |
| Kelola Anggota Proyek | - | Y | Y |
| Ajukan Budget Request | Y | Y | Y |
| Approve/Reject Budget Request | - | Y | Y |
| Lihat Notifikasi | Y | Y | Y |
| Lihat Audit Log | - | Y | Y |

## Struktur Proyek

```
invoice-frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (StoreProvider, font, Toaster)
│   ├── page.tsx                  # Landing page (redirect logic)
│   ├── globals.css               # Tailwind imports & custom styles
│   ├── (auth)/                   # Auth route group (tanpa sidebar)
│   │   ├── login/page.tsx        # Halaman login
│   │   └── register/page.tsx     # Halaman register
│   └── (dashboard)/              # Dashboard route group (dengan sidebar)
│       ├── layout.tsx            # Dashboard layout (sidebar, header, SSE)
│       ├── dashboard/page.tsx    # Halaman dashboard
│       ├── projects/
│       │   ├── page.tsx          # Daftar proyek
│       │   └── [id]/page.tsx     # Detail proyek
│       ├── invoices/page.tsx     # Halaman invoice
│       ├── expenses/page.tsx     # Halaman pengeluaran
│       ├── budget-requests/page.tsx  # Halaman budget request
│       ├── notifications/page.tsx    # Halaman notifikasi
│       └── audit-logs/page.tsx       # Halaman audit log
│
├── components/
│   ├── layout/
│   │   ├── AuthGuard.tsx         # Route protection (cek token)
│   │   ├── Header.tsx            # Header (title, notif bell, avatar)
│   │   └── Sidebar.tsx           # Sidebar navigasi (collapsible)
│   ├── providers/
│   │   └── StoreProvider.tsx     # Redux store provider
│   └── ui/
│       ├── Badge.tsx             # Status badge (PENDING/APPROVED/REJECTED)
│       ├── ConfirmDialog.tsx     # Dialog konfirmasi (delete/approve/reject)
│       ├── EmptyState.tsx        # Empty & error state display
│       ├── LoadingSpinner.tsx    # Loading spinner
│       ├── Modal.tsx             # Reusable modal
│       └── Pagination.tsx        # Komponen pagination
│
├── lib/
│   ├── api/                      # RTK Query API slices
│   │   ├── baseApi.ts            # Base API config (JWT header, tags)
│   │   ├── authApi.ts            # Login & register
│   │   ├── projectApi.ts         # CRUD proyek + members
│   │   ├── invoiceApi.ts         # CRUD invoice + approve/reject
│   │   ├── expenseApi.ts         # CRUD expense + approve/reject
│   │   ├── budgetRequestApi.ts   # CRUD budget request + approve/reject
│   │   ├── dashboardApi.ts       # Dashboard summary
│   │   ├── notificationApi.ts    # Notifikasi + unread count
│   │   ├── auditLogApi.ts        # Audit logs
│   │   ├── uploadApi.ts          # File upload
│   │   └── userApi.ts            # List users by role
│   ├── hooks/
│   │   └── useSSE.ts             # Server-Sent Events hook
│   ├── slices/
│   │   └── authSlice.ts          # Auth state (token, user, hydrated)
│   ├── types/
│   │   └── index.ts              # Semua TypeScript interfaces
│   ├── hooks.ts                  # Typed Redux hooks
│   ├── store.ts                  # Redux store configuration
│   └── utils.ts                  # Utility functions
│
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

## Arsitektur & Design Patterns

### State Management
- **Redux Toolkit** untuk auth state (token, user, hydrated flag)
- **RTK Query** untuk semua API calls dengan:
  - Automatic caching
  - Tag-based cache invalidation
  - Loading/error state management
  - Optimistic updates via tag invalidation

### Authentication Flow
```
1. User login/register -> Backend returns JWT + user data
2. Token disimpan di Redux state + localStorage
3. AuthGuard cek hydrated flag -> show loading sampai hydrated
4. Setelah hydrated, cek token -> redirect ke login jika tidak ada
5. Semua API request otomatis inject Bearer token via baseApi
```

### Hydration-Safe Pattern
```
Server render: initialState = { token: null, user: null, hydrated: false }
Client mount:  useEffect -> dispatch(hydrate()) -> baca localStorage
Setelah hydrated: render sesuai auth state
```
Ini mencegah hydration mismatch antara server dan client rendering.

### Real-time Updates (SSE)
```
1. Dashboard layout mount -> useSSE() hook aktif
2. EventSource connect ke GET /api/events?token=<jwt>
3. Event diterima -> invalidate RTK Query tags
4. RTK Query auto-refetch data yang berubah
5. UI update otomatis tanpa manual refresh
```

## API Endpoints yang Digunakan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Register |
| GET | `/dashboard` | Dashboard summary |
| GET | `/projects` | List proyek |
| GET | `/projects/:id` | Detail proyek |
| POST | `/projects` | Buat proyek |
| PUT | `/projects/:id` | Update proyek |
| GET | `/projects/:id/members` | List anggota |
| POST | `/projects/:id/members` | Tambah anggota |
| DELETE | `/projects/:id/members/:userId` | Hapus anggota |
| GET | `/invoices` | List invoice |
| POST | `/invoices` | Buat invoice |
| PUT | `/invoices/:id` | Update invoice |
| DELETE | `/invoices/:id` | Hapus invoice |
| POST | `/invoices/:id/approve` | Approve invoice |
| POST | `/invoices/:id/reject` | Reject invoice |
| GET | `/expenses` | List pengeluaran |
| POST | `/expenses` | Buat pengeluaran |
| PUT | `/expenses/:id` | Update pengeluaran |
| DELETE | `/expenses/:id` | Hapus pengeluaran |
| POST | `/expenses/:id/approve` | Approve pengeluaran |
| POST | `/expenses/:id/reject` | Reject pengeluaran |
| GET | `/budget-requests` | List budget request |
| POST | `/budget-requests` | Buat budget request |
| POST | `/budget-requests/:id/approve` | Approve budget request |
| POST | `/budget-requests/:id/reject` | Reject budget request |
| GET | `/notifications` | List notifikasi |
| GET | `/notifications/unread-count` | Jumlah notif belum dibaca |
| PATCH | `/notifications/:id/read` | Tandai sudah dibaca |
| PATCH | `/notifications/read-all` | Tandai semua dibaca |
| GET | `/audit-logs` | List audit logs |
| POST | `/upload` | Upload file |
| GET | `/users` | List users (by role) |
| GET | `/events` | SSE stream |

## Komponen UI

### Reusable Components

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `Modal` | `components/ui/Modal.tsx` | Modal dialog dengan backdrop blur, 3 ukuran (sm/md/lg) |
| `ConfirmDialog` | `components/ui/ConfirmDialog.tsx` | Dialog konfirmasi untuk aksi berbahaya (delete/reject), variant danger & warning |
| `Badge` | `components/ui/Badge.tsx` | Status badge berwarna (PENDING=kuning, APPROVED=hijau, REJECTED=merah) |
| `Pagination` | `components/ui/Pagination.tsx` | Pagination dengan info range dan navigasi halaman |
| `LoadingSpinner` | `components/ui/LoadingSpinner.tsx` | Centered loading spinner |
| `EmptyState` | `components/ui/EmptyState.tsx` | Tampilan kosong/error dengan ikon dan pesan |
| `AuthGuard` | `components/layout/AuthGuard.tsx` | HOC untuk proteksi route berdasarkan auth state |
| `Sidebar` | `components/layout/Sidebar.tsx` | Sidebar navigasi, collapsible, role-based menu |
| `Header` | `components/layout/Header.tsx` | Header dengan judul halaman, notif badge, dan avatar |

## Backend

Backend dibangun dengan **Go (Fiber v2)** + **MySQL**. Pastikan backend sudah berjalan sebelum menjalankan frontend.

```bash
# Jalankan backend (di folder terpisah)
cd invoice-backend
go run main.go
# Backend berjalan di http://localhost:3000
```

### Konfigurasi Backend yang Dibutuhkan
- MySQL database sudah di-setup dan migrate
- JWT secret sudah dikonfigurasi
- Upload directory tersedia untuk file upload
- SSE endpoint `/api/events` aktif untuk real-time notifications

## Deployment

### Build Production

```bash
npm run build
npm start
```

### Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Pastikan environment variable `NEXT_PUBLIC_API_URL` di-set di dashboard Vercel ke URL backend production.

### Deploy dengan Docker

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

## License

Private - All rights reserved.
