# Task: Implementasi API Get User Saat Ini (Current User)

## Deskripsi Tugas
Tugas ini adalah untuk mengimplementasikan API endpoint yang digunakan untuk mengambil data profil user yang sedang login saat ini berdasarkan token yang dikirimkan melalui header `Authorization`. Aplikasi ini menggunakan ElysiaJS untuk routing dan Drizzle ORM untuk database.

---

## Spesifikasi API

- **Endpoint:** `GET /api/users/current`
- **Headers:**
  - `Authorization: Bearer <token>` (atau `Bearer. <token>`)
    *(Catatan: Token ini adalah token session yang disimpan di database. Pada skema saat ini, token dicari pada tabel `sessions` kolom `token` untuk mengidentifikasi user).*

- **Response Body - Success (200 OK):**
  ```json
  {
    "data": {
      "id": 1,
      "name": "eko",
      "email": "eko@localhost",
      "created_at": "timestamp"
    }
  }
  ```
  *(Catatan: Field `created_at` dipetakan dari kolom `create_at` pada tabel `users`).*

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
- **Routes (Routing Elysia JS):** `src/routes/users-route.ts`
- **Services (Logika Bisnis):** `src/services/users-service.ts`

---

## Tahapan Implementasi

Berikut adalah langkah-langkah detail dan terstruktur yang harus dilakukan oleh junior programmer atau AI model:

### Langkah 1: Membuat Custom Error di Service
Buka file `src/services/users-service.ts` dan tambahkan custom error class untuk menangani kondisi unauthorized:
```typescript
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorizeed");
    this.name = "UnauthorizedError";
  }
}
```

### Langkah 2: Membuat Fungsi Bisnis di Service
Buat fungsi baru bernama `getCurrentUser` di dalam `src/services/users-service.ts` dengan spesifikasi berikut:
1. Fungsi menerima parameter `token: string`.
2. Lakukan query ke database dengan men-join tabel `sessions` dan `users` berdasarkan hubungan foreign key: `sessions.userId = users.id`.
3. Cari session yang memiliki token yang sesuai dengan parameter.
4. Jika session tidak ditemukan, lempar `UnauthorizedError`.
5. Jika ditemukan, kembalikan data user dengan properti yang dibutuhkan:
   - `id`: number
   - `name`: string
   - `email`: string
   - `created_at`: timestamp/date (`createAt`)

### Langkah 3: Menambahkan Route Baru di Elysia
Buka file `src/routes/users-route.ts` dan tambahkan route baru:
1. Definisikan endpoint `GET /api/users/current`.
2. Dapatkan header `Authorization` dari request headers.
3. Lakukan parsing terhadap token:
   - Periksa apakah header `Authorization` ada.
   - Ambil token dari header tersebut (biasanya berformat `Bearer <token>` atau `Bearer. <token>`). Pastikan penanganan regex atau parsing string cukup aman untuk mengambil token.
   - Jika header kosong atau formatnya tidak sesuai, set status response ke `401` dan kembalikan `{ error: "Unauthorizeed" }`.
4. Panggil fungsi `getCurrentUser(token)` dari service di dalam blok `try-catch`.
5. Jika berhasil, kembalikan data user dalam format `{ data: { id, name, email, created_at } }`.
6. Jika menangkap `UnauthorizedError`, set status response ke `401` dan kembalikan `{ error: "Unauthorizeed" }`.
7. Jika terjadi error lain (Internal Server Error), set status response ke `500` dan kembalikan `{ error: "Internal Server Error" }`.

### Langkah 4: Pengujian & Validasi
1. Pastikan project ter-compile dengan sukses tanpa ada error TypeScript.
2. Lakukan login terlebih dahulu via `POST /api/users/login` untuk mendapatkan token.
3. Lakukan HTTP GET request ke `/api/users/current` menggunakan header `Authorization: Bearer <token_anda>` atau `Bearer. <token_anda>`. Pastikan data yang dikembalikan sesuai dengan spesifikasi sukses.
4. Lakukan request tanpa header `Authorization` atau menggunakan token palsu/acak. Pastikan response mengembalikan status `401` dengan error `Unauthorizeed`.
