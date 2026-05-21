# Project Setup & Planning: Bun + ElysiaJS + Drizzle (MySQL)

## Tujuan
Membuat proyek backend baru di dalam direktori ini menggunakan ekosistem Bun. Proyek ini akan menggunakan ElysiaJS sebagai framework web dan Drizzle ORM untuk berinteraksi dengan database MySQL.

## Tech Stack
- **Runtime & Package Manager:** Bun
- **Web Framework:** ElysiaJS
- **ORM:** Drizzle ORM
- **Database:** MySQL

## Instruksi Implementasi (High Level)

### 1. Inisialisasi Proyek
- Lakukan inisialisasi proyek baru (disarankan menggunakan template bawaan Elysia untuk Bun).
- Pastikan seluruh file proyek diletakkan langsung di dalam folder root ini.
- Instal seluruh dependensi utama (ElysiaJS, Drizzle ORM, driver MySQL/mysql2) dan dev dependencies (drizzle-kit, types).

### 2. Konfigurasi Database (Drizzle & MySQL)
- Buat file `.env` untuk menyimpan string koneksi MySQL (`DATABASE_URL`).
- Setup file konfigurasi Drizzle (`drizzle.config.ts` atau sejenisnya) agar `drizzle-kit` mengenali skema dan kredensial database.
- Buat file inisialisasi koneksi database dan definisi skema awal (contoh tabel sederhana) agar sistem ORM siap digunakan.

### 3. Integrasi Rute & Server
- Konfigurasikan file server utama (biasanya `index.ts` atau `src/index.ts`).
- Setup aplikasi ElysiaJS agar berjalan pada port tertentu (misal port 3000).
- Buat setidaknya satu rute endpoint (misal `GET /`) yang melakukan query sederhana ke database menggunakan Drizzle ORM, sebagai *proof of concept* bahwa integrasi berjalan lancar.

### 4. Setup Skrip (package.json)
- Pastikan skrip untuk development (`bun run dev`) sudah tersedia.
- Tambahkan skrip untuk keperluan manajemen database menggunakan Drizzle Kit, seperti:
  - Generate skema/migrasi.
  - Push/eksekusi migrasi ke database.

## Kriteria Penerimaan (Acceptance Criteria)
- Server ElysiaJS berhasil menyala menggunakan perintah `bun run dev` tanpa error.
- Terdapat endpoint yang bisa diakses dan berhasil mengembalikan respon (ideal mengambil/menyimpan data test dari MySQL).
- Perintah generasi/migrasi dari Drizzle dapat dieksekusi dengan baik.
- Penulisan kode bersih, siap untuk dikembangkan dan diskalakan oleh developer.
