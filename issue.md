# Issue: Implementasi Swagger API Documentation

## Deskripsi
Kita perlu menambahkan antarmuka dokumentasi API interaktif menggunakan Swagger agar pengguna atau developer lain (seperti frontend developer) dapat dengan mudah melihat spesifikasi dan menguji endpoint API yang tersedia di aplikasi ini secara langsung dari browser.

## Target Implementator
Junior Programmer / AI Assistant

## Teknologi yang Digunakan
- `@elysiajs/swagger` (Plugin resmi ElysiaJS untuk integrasi Swagger/OpenAPI)

---

## Tahapan Implementasi (Langkah demi Langkah)

Tolong ikuti langkah-langkah di bawah ini dengan berurutan:

### 1. Instalasi Dependensi
Jalankan perintah berikut di terminal (pada root direktori proyek) untuk menginstal plugin Swagger dari ekosistem Elysia:
```bash
bun add @elysiajs/swagger
```

### 2. Integrasi Swagger di Entry Point (`src/index.ts`)
Buka file `src/index.ts` dan lakukan modifikasi berikut:
- Import plugin swagger di bagian atas file:
  ```typescript
  import { swagger } from "@elysiajs/swagger";
  ```
- Daftarkan plugin tersebut menggunakan `.use()` pada instansiasi aplikasi Elysia. 
  **Penting:** Posisikan `.use(swagger(...))` di awal, sebelum pendaftaran route lainnya (seperti `.use(usersRoute)`), agar Swagger dapat membaca seluruh rute yang ada di bawahnya.
  
  Contoh implementasi:
  ```typescript
  export const app = new Elysia()
    .use(swagger({
      documentation: {
        info: {
          title: 'User Management API',
          version: '1.0.0',
          description: 'Dokumentasi API untuk Sistem Manajemen Pengguna'
        }
      }
    }))
    .use(usersRoute)
    // ... route lainnya tetap dibiarkan ...
  ```

### 3. Memperkaya Dokumentasi Route (`src/routes/users-route.ts`)
Agar tampilan di Swagger UI informatif dan rapi, kita perlu menambahkan metadata pada tiap endpoint. 
Buka file `src/routes/users-route.ts`. Pada parameter kedua dari tiap handler rute (objek konfigurasi skema), tambahkan properti `detail`.

Berikut adalah contoh modifikasi untuk rute **Register** (`POST /api/users`):
```typescript
.post("/api/users", async ({ body, set }) => {
  // ... kode implementasi tetap sama ...
}, {
  detail: {
    tags: ['Users'], // Untuk mengelompokkan API di Swagger UI
    summary: 'Registrasi Pengguna Baru',
    description: 'Endpoint untuk mendaftarkan pengguna baru ke dalam database.'
  },
  body: t.Object({
    // ... skema body tetap sama ...
  })
})
```
**Tugas Anda:** Lakukan hal yang sama (menambahkan properti `detail`) untuk rute lainnya:
- `POST /api/users/login` (Login User)
- `GET /api/users/current` (Get Current User)
- `DELETE /api/users/logout` (Logout User)

### 4. Verifikasi dan Pengujian Manual
Setelah kode ditambahkan:
1. Jalankan aplikasi secara lokal dengan perintah:
   ```bash
   bun run dev
   ```
2. Buka browser dan akses alamat: `http://localhost:3000/swagger`
3. Pastikan halaman antarmuka **Swagger UI** muncul dan menampilkan daftar endpoint `Users`.
4. Uji coba salah satu endpoint (misal: `GET /` atau register) langsung dari halaman Swagger menggunakan tombol **"Try it out"**.

### 5. Verifikasi Unit Test & Commit
1. Pastikan perubahan yang dilakukan tidak merusak fitur yang sudah ada dengan menjalankan unit test:
   ```bash
   bun test test/api.test.ts
   ```
2. Jika semua test *pass* (hijau), lakukan proses commit dengan pesan yang jelas. Contoh:
   ```bash
   git add .
   git commit -m "feat: integrasi swagger api documentation"
   ```
3. Push ke branch baru (misal: `feature/swagger`) dan buat Pull Request ke branch utama.
