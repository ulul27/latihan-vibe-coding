# Task: Implementasi Fitur Login User

## Deskripsi Tugas
Tugas ini adalah untuk mengimplementasikan fitur login user pada aplikasi backend. Aplikasi ini menggunakan ElysiaJS untuk routing dan Drizzle ORM untuk database. Silakan ikuti instruksi di bawah ini dengan teliti.

## 1. Skema Database
Buat tabel `sessions` dengan spesifikasi berikut:
- `id`: integer, auto increment (Primary Key)
- `token`: varchar(255), not null (Isinya harus berupa UUID untuk token user login)
- `user_id`: integer (Foreign Key yang merujuk ke tabel `users`)
- `create_at`: timestamp, default current_timestamp

## 2. Struktur Folder & File
Pastikan penulisan kode berada di dalam direktori `src` dengan melanjutkan struktur yang sudah ada:
- `src/routes/`: Direktori untuk menyimpan routing ElysiaJS.
  - File yang digunakan: `users-route.ts`
- `src/services/`: Direktori untuk menyimpan business logic (logika aplikasi).
  - File yang digunakan: `users-service.ts`

## 3. Spesifikasi API
Buat sebuah endpoint untuk login user.

- **Endpoint:** `POST /api/users/login`
- **Request Body (JSON):**
  ```json
  {
    "email": "eko@localhost",
    "password": "rahasia"
  }
  ```
- **Response Body - Success (200 OK):**
  ```json
  {
    "data": "token_uuid_dari_database"
  }
  ```
- **Response Body - Error (Misalnya HTTP 401 Unauthorized atau 400 Bad Request):**
  Jika email tidak terdaftar atau password tidak cocok:
  ```json
  {
    "error": "Email atau password salah"
  }
  ```

## 4. Tahapan Implementasi
Berikut adalah langkah-langkah sistematis yang harus Anda lakukan untuk menyelesaikan tugas ini:

1. **Buat dan Update Skema Database:**
   - Buka file skema database (misalnya `src/db/schema.ts`).
   - Tambahkan definisi tabel `sessions` yang memuat kolom `id`, `token`, `user_id`, dan `create_at`.
   - Pada kolom `user_id`, definisikan sebagai *foreign key* yang bereferensi (merujuk) ke kolom `id` pada tabel `users`.
   - Jalankan migrasi atau push skema database agar tabel `sessions` terbuat di database lokal (misal: `bun run db:push`).

2. **Buat Logika Bisnis (Service):**
   - Buka file `src/services/users-service.ts`.
   - Buat fungsi/method baru untuk proses login (misal `loginUser(...)`).
   - Alur fungsi tersebut harus meliputi:
     a. Lakukan query (select) ke tabel `users` berdasarkan `email` yang dikirim dari input.
     b. Jika user tidak ditemukan, hentikan proses dan lemparkan error (throw) dengan pesan `"Email atau password salah"`.
     c. Jika user ditemukan, verifikasi password yang diinputkan terhadap password hasil hash di database (Bisa menggunakan `Bun.password.verify` jika menggunakan ekosistem Bun, atau library `bcrypt` standar).
     d. Jika password tidak cocok, lemparkan error dengan pesan `"Email atau password salah"` (Pesan error disamakan dengan poin (b) demi keamanan).
     e. Jika password cocok, buat string `token` unik menggunakan UUID (misal: `crypto.randomUUID()`).
     f. Lakukan proses *insert* ke tabel `sessions` dengan data `token` tersebut dan `user_id` dari user yang berhasil login.
     g. Fungsi harus mengembalikan nilai berupa string token.

3. **Buat Routing API:**
   - Buka file `src/routes/users-route.ts`.
   - Tambahkan endpoint baru `POST /api/users/login` ke instance route Elysia yang ada.
   - Ekstrak data body (email dan password) dengan schema validasi yang sesuai (misal menggunakan TypeBox / fungsi `t` bawaan Elysia).
   - Panggil fungsi login dari `users-service.ts` dengan data tersebut.
   - Tangkap (catch) error yang dilempar oleh service. Jika errornya terkait validasi kredensial, kembalikan status HTTP yang sesuai (400 atau 401) dan kirimkan response `{ "error": "Email atau password salah" }`.
   - Jika sukses, kembalikan response sukses berbentuk `{ "data": "<isi_token>" }`.

4. **Pengujian Internal:**
   - Pastikan aplikasi bebas dari error kompilasi TypeScript.
   - Lakukan testing dengan endpoint POST login. Coba skenario salah password dan salah email, pastikan mendapatkan pesan error yang sama persis.
   - Coba dengan kombinasi email dan password yang valid, pastikan server membalas dengan UUID token, dan cek di database apakah *session* berhasil tersimpan di tabel `sessions`.
