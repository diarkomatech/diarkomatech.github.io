# Portofolio Diemas Arya Komara

Situs statis (HTML, CSS, JavaScript) tanpa proses build, untuk ditayangkan di GitHub Pages di `https://diarkomatech.github.io`.

## Isi folder

| Berkas | Fungsi |
|---|---|
| `index.html` | Seluruh isi halaman, dalam bahasa Inggris dan Indonesia |
| `style.css` | Tampilan: latar putih dan biru, huruf (Newsreader untuk teks, Atkinson Hyperlegible untuk navigasi), tata letak |
| `script.js` | Kartu lanyard, filter publikasi, ganti bahasa, tautan email, daftar repositori GitHub |
| `404.html` | Halaman "tidak ditemukan" untuk alamat yang salah |
| `robots.txt`, `sitemap.xml` | Membantu Google mengindeks situs |
| `favicon.svg` | Ikon tab browser |
| `assets/img/` | Foto profil dan foto wisuda |

Resume dan isi prototipe **tidak** disertakan dan tidak bisa diunduh dari situs. Tombol "Request my CV" dan "Ask for a demonstration" membuka email ke Anda dengan subjek yang sudah terisi, jadi Anda yang memutuskan siapa yang mendapat berkasnya.

## Menayangkan di GitHub Pages (tanpa perintah terminal)

1. Masuk ke GitHub, klik **New repository**.
2. Isi nama repositori **persis** `diarkomatech.github.io`, pilih **Public**, lalu **Create repository**.
3. Di halaman repositori yang masih kosong, klik **uploading an existing file**. Seret **isi** folder ini (bukan foldernya): semua berkas di atas, termasuk folder `assets`. Klik **Commit changes**.
4. Buka **Settings → Pages**. Pastikan *Source* = **Deploy from a branch**, *Branch* = **main** dan **/ (root)**, lalu **Save**.
5. Tunggu 1–3 menit, lalu buka `https://diarkomatech.github.io`.

Setiap kali Anda mengunggah atau menyunting berkas di repositori itu, situsnya ikut diperbarui dalam beberapa menit.

Opsional: daftarkan situs di [Google Search Console](https://search.google.com/search-console) dan kirim `https://diarkomatech.github.io/sitemap.xml` supaya lebih cepat muncul saat nama Anda dicari.

## Hal yang bisa Anda ubah sendiri

**Mata kuliah yang diampu.** Di `index.html`, cari `<ul class="courses"`. Satu mata kuliah = satu `<li>`, dengan nama Inggris dan Indonesia.

**Repositori GitHub.** Username `diarkomatech` sudah terisi di `script.js`, jadi tautan GitHub muncul di Kontak. Daftar repositori hanya tampil untuk nama yang Anda tulis sendiri, supaya repositori pribadi tidak ikut terpajang:

```js
const GITHUB_REPOS = ['nama-repo-1', 'nama-repo-2'];
```

**Menambah publikasi.** Salin satu blok `<li ...> ... </li>` di dalam `<ol class="refs">`, ubah isinya, isi `data-doi` (tanpa `https://doi.org/`), dan atur `data-tags` (pilihan: `misinfo`, `literacy`, `behaviour`, `biblio`, `edu`) supaya ikut tersaring. Kalau `data-doi` kosong, judul tertaut ke pencarian Google Scholar.

**Memperbarui angka Google Scholar.** Cari teks "535 citations" (Inggris) dan "535 sitasi" (Indonesia) di `index.html`, lalu ubah keduanya beserta bulannya.

**Teks dua bahasa.** Setiap teks ditulis dua kali: `<span data-l="en">…</span>` dan `<span data-l="id" lang="id">…</span>`. Ubah keduanya supaya tetap selaras.

**Foto profil.** `assets/img/profile.jpg` saat ini berukuran 256 × 256 px, jadi agak kurang tajam di layar beresolusi tinggi. Ganti dengan versi minimal 600 × 600 px dengan nama berkas yang sama.

## Catatan

- Nomor HP tidak ditampilkan. Email dirakit oleh JavaScript supaya tidak mudah dipanen bot.
- Kartu lanyard dapat ditarik dengan mouse atau jari, dan diketuk untuk dibalik. Sisi belakangnya adalah kartu katalog dengan nomor panggil DDC 020.92.
- Pengunjung yang mengaktifkan pengaturan "kurangi gerakan" di perangkatnya akan melihat kartu dalam posisi diam.
