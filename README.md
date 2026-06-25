# User Management System (Latihan Vibe Coding)

Aplikasi ini adalah RESTful API untuk Sistem Manajemen Pengguna (User Management System) yang dibangun menggunakan runtime **Bun** dan web framework **ElysiaJS**. Aplikasi menyediakan fungsionalitas untuk pendaftaran pengguna (registrasi), login, pengambilan profil pengguna aktif (session), dan logout menggunakan autentikasi berbasis token session yang disimpan di database MySQL.

---

## Teknologi yang Digunakan (Technology Stack)

- **Runtime**: [Bun](https://bun.sh/) (v1.3.14+) – Runtime JavaScript/TypeScript all-in-one yang cepat, bertindak sebagai package manager, compiler, dan test runner.
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) – Web framework yang dikembangkan khusus untuk Bun dengan performa tinggi dan static typing terintegrasi.
- **Database**: [MySQL](https://www.mysql.com/) – Sistem manajemen basis data relasional.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) – ORM TypeScript-first yang ringan dan type-safe.
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox) – Pustaka penentu skema data statis (bawaan Elysia) untuk validasi request payload.

### Pustaka Tambahan (Libraries)
- `mysql2` – Driver client MySQL untuk koneksi database.
- `drizzle-kit` – Tooling CLI Drizzle untuk manajemen migrasi skema dan database studio.
- `@types/bun` / `bun-types` – Definisi tipe TypeScript untuk lingkungan Bun.
- Enkripsi Bawaan:
  - `Bun.password` – Enkripsi password menggunakan algoritma bcrypt (cost: 10).
  - `crypto.randomUUID()` – Pembuatan token session unik berbasis UUIDv4.

---

## Struktur File & Folder (Arsitektur)

Proyek ini menggunakan struktur direktori yang modular dan terpisah berdasarkan perannya masing-masing (routing, business logic, database, dan testing):

```text
├── drizzle/                      # File SQL migrasi otomatis yang di-generate oleh Drizzle Kit
├── plans/                        # Dokumentasi rencana kerja dan perbaikan issue
├── src/                          # Kode sumber utama aplikasi (Source Code)
│   ├── db/                       # Konfigurasi dan skema Database
│   │   ├── index.ts              # Inisialisasi pool koneksi database MySQL menggunakan mysql2
│   │   └── schema.ts             # Definisi skema tabel database (users & sessions) menggunakan Drizzle core
│   ├── routes/                   # Lapisan API Routing & Request Validation (Controller)
│   │   ├── users-route.ts        # Endpoint API user, ekstraksi token, validasi skema input, dan HTTP status handler
│   │   └── users-route.test.ts   # Integration test untuk endpoints (memerlukan database aktif)
│   ├── services/                 # Lapisan Logika Bisnis (Business Logic Layer)
│   │   └── users-service.ts      # Operasi database (register, login, get profile, logout) dan custom errors
│   └── index.ts                  # Entry point aplikasi (konfigurasi instansi Elysia server, HTTP server listen)
├── test/                         # Unit Testing terisolasi
│   └── api.test.ts               # Unit test API menggunakan mock services dan DB (tidak membutuhkan database aktif)
├── .env                          # File konfigurasi environment variables (sensitif, abaikan di git)
├── bun.lock                      # Lockfile dependensi dari Bun
├── drizzle.config.ts             # File konfigurasi CLI Drizzle Kit
├── package.json                  # Manifes proyek, daftar pustaka, dan perintah script
└── tsconfig.json                 # Konfigurasi compiler TypeScript
```

---

## Skema Database (Database Schema)

Aplikasi memiliki dua tabel relasional utama yang didefinisikan pada [src/db/schema.ts](file:///Users/ululfadhli/Downloads/latihan-vibe-coding/src/db/schema.ts):

### 1. Tabel `users`
Menyimpan informasi identitas akun pengguna.
*   `id` (`serial`): Primary Key, Auto-Increment.
*   `name` (`varchar(255)`): Nama pengguna, wajib diisi (`notNull`).
*   `email` (`varchar(255)`): Email pengguna, wajib diisi, bernilai unik (`unique`).
*   `password` (`varchar(255)`): Hash password pengguna (bcrypt), wajib diisi.
*   `create_at` (`timestamp`): Tanggal akun dibuat, otomatis diisi dengan waktu server saat ini.

### 2. Tabel `sessions`
Menyimpan token session yang aktif untuk autentikasi stateful.
*   `id` (`serial`): Primary Key, Auto-Increment.
*   `token` (`varchar(255)`): Token unik UUIDv4, wajib diisi, bernilai unik.
*   `user_id` (`int`): Foreign Key yang merujuk ke `users.id`.
*   `create_at` (`timestamp`): Waktu session dibuat, otomatis diisi waktu saat ini.

> **Hubungan Relasi**: Satu baris data pada tabel `users` dapat terhubung ke beberapa baris data pada tabel `sessions` (Relasi One-to-Many). Ini memungkinkan pengguna untuk login di beberapa perangkat secara bersamaan.

---

## API Endpoints

Aplikasi mengekspos endpoint HTTP berikut:

### 1. Root Endpoint
*   **Path**: `GET /`
*   **Fungsi**: Memeriksa status kesehatan server.
*   **Response Sukses**: `200 OK`
    ```text
    Hello Elysia
    ```

### 2. Get All Users (Debugging/Admin)
*   **Path**: `GET /users`
*   **Fungsi**: Mengambil data seluruh pengguna langsung dari database.
*   **Response Sukses**: `200 OK`
    ```json
    [
      {
        "id": 1,
        "name": "Eko",
        "email": "eko@localhost",
        "createAt": "2026-06-25T12:00:00.000Z"
      }
    ]
    ```
*   **Response Error (Database Error)**: `200 OK`
    ```json
    { "error": "Database connection or query failed" }
    ```

### 3. Register User
*   **Path**: `POST /api/users`
*   **Fungsi**: Mendaftarkan pengguna baru dengan mengenkripsi password.
*   **Request Body (JSON)**:
    ```json
    {
      "name": "Nama Pengguna",
      "email": "user@example.com",
      "password": "passwordAman123"
    }
    ```
    *(Semua string memiliki batasan panjang maksimum 255 karakter)*
*   **Response Sukses**: `200 OK`
    ```json
    { "data": "OK" }
    ```
*   **Response Error**:
    *   `400 Bad Request` (Email duplikat):
        ```json
        { "error": "Email sudah terdaftar" }
        ```
    *   `422 Unprocessable Entity` (Validasi input gagal / > 255 karakter / data kurang).
    *   `500 Internal Server Error`.

### 4. Login User
*   **Path**: `POST /api/users/login`
*   **Fungsi**: Melakukan verifikasi kredensial pengguna dan mengembalikan token session.
*   **Request Body (JSON)**:
    ```json
    {
      "email": "user@example.com",
      "password": "passwordAman123"
    }
    ```
    *(Semua string memiliki batasan panjang maksimum 255 karakter)*
*   **Response Sukses**: `200 OK`
    ```json
    { "data": "893c5ebf-8012-4c28-bbbe-cb6c5ff7d632" }
    ```
*   **Response Error**:
    *   `401 Unauthorized` (Email/password salah):
        ```json
        { "error": "Email atau password salah" }
        ```
    *   `422 Unprocessable Entity` (Validasi input gagal / format tidak sesuai).
    *   `500 Internal Server Error`.

### 5. Get Current User Profil
*   **Path**: `GET /api/users/current`
*   **Fungsi**: Mengambil profil pengguna yang terikat pada session token aktif.
*   **Headers**:
    *   `Authorization: Bearer <session_token>` ATAU `Authorization: Bearer. <session_token>`
*   **Response Sukses**: `200 OK`
    ```json
    {
      "data": {
        "id": 1,
        "name": "Nama Pengguna",
        "email": "user@example.com",
        "created_at": "2026-06-25T12:00:00.000Z"
      }
    }
    ```
*   **Response Error**:
    *   `401 Unauthorized` (Token salah/kedaluwarsa/header tidak disertakan):
        ```json
        { "error": "Unauthorizeed" }
        ```
    *   `500 Internal Server Error`.

### 6. Logout User
*   **Path**: `DELETE /api/users/logout`
*   **Fungsi**: Menghapus session token aktif dari basis data untuk mengakhiri session.
*   **Headers**:
    *   `Authorization: Bearer <session_token>` ATAU `Authorization: Bearer. <session_token>`
*   **Response Sukses**: `200 OK`
    ```json
    { "data": "OK" }
    ```
*   **Response Error**:
    *   `401 Unauthorized` (Token salah atau sudah dihapus/logout):
        ```json
        { "error": "Unauthorizeed" }
        ```
    *   `500 Internal Server Error`.

---

## Cara Setup Project (Setup Guide)

Ikuti langkah-langkah di bawah ini untuk mempersiapkan lingkungan pengembangan:

1.  **Clone dan Navigasi Proyek**:
    Masuk ke direktori proyek lokal Anda.
2.  **Konfigurasi Environment Variables**:
    Buat file `.env` di root direktori proyek, lalu tentukan string URL koneksi MySQL Anda:
    ```env
    DATABASE_URL="mysql://username:password@localhost:3306/nama_database"
    ```
    *Ganti `username`, `password`, dan `nama_database` sesuai dengan server MySQL lokal Anda.*
3.  **Instal Dependensi**:
    Gunakan Bun untuk menginstal modul pendukung:
    ```bash
    bun install
    ```
4.  **Migrasi Database**:
    Gunakan CLI Drizzle Kit untuk menyelaraskan skema database Anda:
    *   **Generate SQL Migration**:
        ```bash
        bun run db:generate
        ```
    *   **Push Schema** (Langsung buat tabel di basis data Anda):
        ```bash
        bun run db:push
        ```
    *   *Opsional (Membuka Drizzle Studio untuk memvisualisasikan database):*
        ```bash
        bun run db:studio
        ```

---

## Cara Menjalankan Aplikasi (Run App)

Untuk menjalankan server dalam mode pengembangan (development mode) dengan fitur deteksi perubahan file otomatis (*hot reload/watch*):

```bash
bun run dev
```

Server akan aktif dan mendengarkan request di:
`http://localhost:3000`

---

## Cara Menguji Aplikasi (Testing)

Aplikasi memiliki dua jenis test runner menggunakan utilitas bawaan Bun (`bun test`).

### 1. Unit Tests (Terisolasi / Tanpa Database)
Pengujian ini menggunakan fitur mocking module dari Bun (`mock.module`) untuk mengisolasi routing API. Pengujian tidak memerlukan koneksi MySQL yang aktif karena service layer dan query database sudah di-mock.

Untuk menjalankan Unit Test:
```bash
bun test test/api.test.ts
```

### 2. Integration Tests (End-to-End dengan Database)
Pengujian ini memanggil endpoint API secara nyata dan melakukan modifikasi data langsung ke dalam database MySQL yang aktif.
*   **Syarat**: Pastikan server database MySQL aktif dan variabel `DATABASE_URL` pada `.env` mengarah ke database pengujian yang aman (data test email `eko@localhost` akan dibersihkan sebelum test berjalan).

Untuk menjalankan Integration Test:
```bash
bun test src/routes/users-route.test.ts
```