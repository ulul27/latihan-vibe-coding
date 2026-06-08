# Task: Implementasi Fitur Registrasi User

## Deskripsi Tugas
Tugas ini adalah untuk mengimplementasikan fitur registrasi user baru pada aplikasi backend. Aplikasi ini menggunakan ElysiaJS untuk routing. Silakan ikuti instruksi di bawah ini dengan teliti.

## 1. Skema Database
Buat tabel `users` dengan spesifikasi berikut:
- `id`: integer, auto increment (Primary Key)
- `name`: varchar(255), not null
- `email`: varchar(255), not null (Harus unique)
- `password`: varchar(255), not null (Password harus berupa hash dari `bcrypt`)
- `create_at`: timestamp, default current_timestamp

## 2. Struktur Folder & File
Pastikan kode berada di dalam direktori `src` dengan struktur berikut:
- `src/routes/`: Direktori untuk menyimpan routing ElysiaJS.
  - Buat file: `users-route.ts`
- `src/services/`: Direktori untuk menyimpan business logic (logika aplikasi).
  - Buat file: `users-service.ts`

## 3. Spesifikasi API
Buat sebuah endpoint untuk registrasi user baru.

- **Endpoint:** `POST /api/users`
- **Request Body (JSON):**
  ```json
  {
    "name": "Eko",
    "email": "eko@localhost",
    "password": "rahasia"
  }
  ```
- **Response Body - Success:**
  ```json
  {
    "data": "OK"
  }
  ```
- **Response Body - Error (Misalnya HTTP 400/409):**
  Jika email sudah terdaftar sebelumnya:
  ```json
  {
    "error": "Email sudah terdaftar"
  }
  ```

## 4. Tahapan Implementasi
Berikut adalah langkah-langkah sistematis yang harus Anda lakukan untuk menyelesaikan tugas ini:

1. **Buat dan Update Skema Database:**
   - Cari file deklarasi database/ORM yang digunakan (misalnya di `src/db/schema.ts`).
   - Tambahkan definisi tabel `users` dengan kolom-kolom yang disebutkan di atas (`id`, `name`, `email`, `password`, `create_at`).

2. **Buat Logika Bisnis (Service):**
   - Buat direktori `src/services/` (jika belum ada) dan buat file `users-service.ts`.
   - Di dalam `users-service.ts`, buat fungsi/method untuk registrasi (misalnya `register(...)`).
   - Alur fungsi tersebut harus meliputi:
     a. Lakukan pengecekan ke database apakah `email` yang diinput sudah ada.
     b. Jika email sudah ada, kembalikan pesan error / throw error khusus.
     c. Jika email belum ada, hash `password` yang dikirimkan menggunakan `bcrypt`.
     d. Simpan data user baru (termasuk password yang sudah di-hash) ke database.

3. **Buat Routing API:**
   - Buat direktori `src/routes/` (jika belum ada) dan buat file `users-route.ts`.
   - Buat dan ekspor instance `Elysia`.
   - Definisikan endpoint `POST /api/users`.
   - Di dalam handler endpoint ini, ekstrak data dari Request Body dan panggil fungsi dari `users-service.ts`.
   - Tangani (catch) error. Jika terdapat error email duplikat, kembalikan format response error `{ "error" : "Email sudah terdaftar" }` dengan status HTTP terkait (misal 400).
   - Jika sukses, kembalikan response sukses `{ "data" : "OK" }`.

4. **Daftarkan Routing ke Aplikasi Utama:**
   - Buka file entri utama aplikasi (biasanya `src/index.ts` atau sejenisnya).
   - Import routing dari `users-route.ts`.
   - Hubungkan (use) routing tersebut ke dalam aplikasi Elysia utama agar endpoint dapat diakses.

5. **Pengujian Internal:**
   - Pastikan kode dapat berjalan (compile/build) tanpa error Typescript.
   - Cek manual apakah logika penyimpanan, hashing, dan validasi duplikasi email berfungsi sesuai spesifikasi response.
