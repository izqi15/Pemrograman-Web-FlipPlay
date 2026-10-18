# FlipPlay — Modul 1

## Struktur
- `index.html` — halaman utama FlipPlay
- `script.js` — interaksi halaman utama dan validasi form
- `api.html` — halaman demonstrasi public API
- `api.js` — Fetch API GET, loading/error state, render cards
- `main.css` — sumber Tailwind CSS v4
- `output.css` — hasil build Tailwind (dibuat melalui perintah build)
- `package.json` — dependensi dan perintah build

## Menjalankan di MacBook
1. Pastikan Node.js dan npm terpasang (`node -v` dan `npm -v`).
2. Buka Terminal di folder project ini.
3. Jalankan `npm install`.
4. Jalankan `npm run build:css` untuk membuat `output.css`.
5. Buka `index.html` menggunakan Live Server di VS Code. Untuk API, buka link Anime API/Posts API atau buka `api.html` langsung dari Live Server.

Untuk pengembangan, gunakan `npm run watch:css` di terminal terpisah agar Tailwind membangun ulang CSS saat file berubah.

Catatan: API demo menggunakan JSONPlaceholder (`https://jsonplaceholder.typicode.com/posts?_limit=8`) agar tidak bergantung pada Jikan yang sebelumnya timeout. File `index.html` dipulihkan dari versi FlipPlay yang tersimpan di percakapan, sehingga beberapa detailnya mungkin tidak identik dengan salinan terakhir yang ada di laptop lama.
