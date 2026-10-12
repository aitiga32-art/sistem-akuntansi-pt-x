# Sistem Akuntansi Perusahaan Berbasis Proyek

> Identitas perusahaan pada repositori dan aplikasi ini disamarkan menjadi **PT X** untuk menjaga kerahasiaan perusahaan dan data operasionalnya.

**Demo website:** [https://aitiga32-art.github.io/sistem-akuntansi-pt-x/](https://aitiga32-art.github.io/sistem-akuntansi-pt-x/)

## Tentang Sistem

Sistem ini dibuat untuk perusahaan yang kegiatan operasionalnya berbasis proyek, khususnya proyek teknologi seperti pemasangan videotron, pengadaan komputer/PC, perangkat jaringan, dan pekerjaan teknologi lainnya.

Proyek ini berasal dari kebutuhan nyata dan telah digunakan untuk membantu otomatisasi pencatatan yang sebelumnya dikerjakan menggunakan Microsoft Excel. Versi publik menggunakan identitas PT X, data contoh anonim, serta tidak menyertakan kredensial maupun berkas operasional perusahaan.

## Fitur Utama

- Pencatatan penjualan dan tagihan per proyek.
- Pencatatan pembelian PPN dan non-PPN.
- Pelunasan penjualan dan pembelian dari bank atau kas.
- Buku bank, kas kecil, biaya, dan aktiva.
- Jurnal otomatis dari transaksi operasional.
- Buku besar, neraca lajur, laporan laba rugi, dan neraca.
- Kontrol proyek untuk memantau status pekerjaan dan realisasi transaksi.
- Penyimpanan data terpusat menggunakan PostgreSQL di Supabase.

## Teknologi

- GitHub Pages untuk antarmuka web publik
- Supabase Edge Functions untuk API Express
- PostgreSQL di Supabase untuk penyimpanan data
- HTML, CSS, dan JavaScript
- GitHub Actions untuk validasi dan deployment otomatis

## Menjalankan Secara Lokal

1. Instal Node.js versi 20 atau lebih baru.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` dan secret dengan nilai milik sendiri.
4. Muat `supabase/schema-and-demo-data.sql` ke database Supabase baru bila memulai dari database kosong.
5. Jalankan `npm start` dan buka `http://localhost:8080`.

`CLIENT_PORTAL_SKIP_SCHEMA_ENSURE=true` digunakan setelah skema SQL selesai dimuat agar aplikasi tidak mengulang pemeriksaan DDL pada setiap proses deployment.

Variabel lingkungan tidak boleh disimpan ke GitHub. File `.env`, database lokal, log, runtime, dan kredensial telah dikecualikan melalui `.gitignore`.

## Deployment

Antarmuka web dibangun oleh `scripts/build-github-pages.mjs` dan diterbitkan otomatis oleh workflow GitHub Pages setiap kali ada perubahan pada branch `main`. API aplikasi dijalankan sebagai Supabase Edge Function bernama `api`, sedangkan seluruh data tersimpan di PostgreSQL pada project Supabase yang terpisah dari repositori.

Versi demonstrasi tidak memakai halaman login agar mudah diperiksa untuk kebutuhan akademik. Karena tautannya bersifat publik, gunakan hanya data contoh dan jangan memasukkan data perusahaan, pelanggan, rekening, atau dokumen yang bersifat rahasia.

## Catatan Kerahasiaan

Nama perusahaan, pelanggan, pihak terkait, alamat, nomor identitas, nomor rekening, dan data transaksi asli tidak dipublikasikan. Istilah **PT X** dan data contoh digunakan khusus untuk kebutuhan demonstrasi dan dokumentasi akademik.

