# Task: Implementasi API Logout User

## Deskripsi Tugas
Tugas ini adalah untuk mengimplementasikan API endpoint yang digunakan untuk melakukan proses logout user. Proses ini dilakukan dengan cara menghapus data session (token) user yang sedang login dari database. Aplikasi ini menggunakan ElysiaJS untuk routing dan Drizzle ORM.

---

## Spesifikasi API

- **Endpoint:** `DELETE /api/users/logout`
- **Headers:**
  - `Authorization: Bearer <token>` (atau `Bearer. <token>`)
    *(Catatan: Token ini adalah token session yang akan dihapus dari tabel `sessions` di database).*

- **Response Body - Success (200 OK):**
  ```json
  {
    "data": "OK"
  }
  ```
  *(Catatan: Jika sukses logout, data session dengan token tersebut harus dihapus secara permanen dari tabel `sessions`).*

- **Response Body - Error (401 Unauthorized):**
  Jika token tidak valid, tidak dikirimkan, atau tidak ditemukan di database:
  ```json
  {
    "error": "Unauthorizeed"
  }
  ```
  *(Penting: Samakan teks error `"Unauthorizeed"` persis dengan spesifikasi).*

---

## Struktur Folder & File
Pastikan implementasi kode mengikuti arsitektur yang sudah ada:
- **Routes:** `src/routes/users-route.ts`
- **Services:** `src/services/users-service.ts`

---

## Tahapan Implementasi

Berikut adalah langkah-langkah detail yang harus dilakukan oleh junior programmer atau AI model:

### Langkah 1: Membuat Fungsi Bisnis Logout di Service
Buka file `src/services/users-service.ts` dan tambahkan fungsi `logoutUser`:
1. Buat fungsi async `logoutUser(token: string)`.
2. Lakukan pengecekan token di database: Lakukan query (select) ke tabel `sessions` untuk mencari record yang memiliki `token` yang sama.
3. Jika record session tidak ditemukan, lemparkan error menggunakan `UnauthorizedError` (class custom yang sudah ada di service).
4. Jika session ditemukan, jalankan perintah `delete` menggunakan Drizzle ORM pada tabel `sessions` dengan kondisi `token` sama dengan parameter yang dikirim.
5. Fungsi ini dapat berupa void, atau cukup menunggu (`await`) proses delete selesai.

### Langkah 2: Menambahkan Route Baru di Elysia
Buka file `src/routes/users-route.ts` dan lakukan langkah berikut:
1. Impor fungsi `logoutUser` dari `users-service.ts`.
2. Definisikan endpoint `DELETE /api/users/logout` menggunakan method `.delete()`.
3. Lakukan proses ekstraksi token dari header `Authorization`:
   - Ambil header `Authorization` dari request context.
   - Periksa apakah string dimulai dengan `"Bearer "` atau `"Bearer. "`.
   - Jika header tidak valid atau kosong, set status response menjadi `401` dan kembalikan `{ error: "Unauthorizeed" }`.
   - Ekstrak nilai token yang sebenarnya.
4. Panggil fungsi `logoutUser(token)` di dalam blok `try-catch`.
5. Jika proses berhasil, kembalikan response sukses berbentuk `{ data: "OK" }`.
6. Tangkap (catch) error: Jika error berupa instance dari `UnauthorizedError`, kembalikan HTTP status `401` dengan pesan `{ error: "Unauthorizeed" }`.
7. Jika ada error server lain, kembalikan HTTP status `500` dengan pesan `{ error: "Internal Server Error" }`.

### Langkah 3: Pengujian (Validasi)
1. Pastikan project ter-compile sukses tanpa ada error TypeScript.
2. Jalankan simulasi Login (`POST /api/users/login`) untuk mendapatkan token session baru.
3. Coba akses endpoint `GET /api/users/current` dengan token tersebut (harus sukses).
4. Panggil endpoint `DELETE /api/users/logout` dengan token tersebut. Pastikan HTTP response adalah `200 OK` dengan body `{"data": "OK"}` dan data di tabel sessions terhapus.
5. Panggil kembali endpoint `GET /api/users/current` dengan token yang sama. Kali ini harus gagal dengan pesan `"Unauthorizeed"` karena session sudah dihapus.
6. Coba panggil endpoint `DELETE /api/users/logout` tanpa header authorization atau token asal, pastikan gagal dengan pesan `"Unauthorizeed"`.
