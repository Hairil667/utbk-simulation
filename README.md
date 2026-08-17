# 📝 Web Simulasi Latihan Soal UTBK - SNBT (Sistem CAT Resmi)

Aplikasi web simulasi ujian **UTBK - SNBT** berbasis komputer yang dirancang semirip mungkin dengan antarmuka CAT resmi (Balai Pengelolaan Pengujian Pendidikan / Pusmendik).

Web ini **100% Client-side (HTML, CSS, Vanilla JS)** sehingga sangat ringan, cepat, responsif untuk **HP (Mobile) & Desktop**, serta langsung siap diunggah ke **GitHub Pages** secara gratis.

---

## ✨ Fitur Utama

1. **Antarmuka Otentik CAT UTBK**:
   - Header biru dongker resmi dengan info peserta, nomor peserta, dan subtes.
   - **Countdown Timer Digital**: Hitung mundur waktu dengan peringatan warna merah jika waktu tersisa < 3 menit.
   - **Pengatur Ukuran Font Soal (A- / A / A+)** untuk kenyamanan membaca.
   - **Navigasi Soal Lengkap**: Tombol *Soal Sebelumnya*, *Ragu-Ragu* (warna kuning), dan *Soal Berikutnya / Selesai*.
   - **Daftar Soal Interaktif (Question Map Grid)**: Status warna *Sudah Dijawab (Biru)*, *Ragu-Ragu (Kuning)*, *Belum Dijawab (Putih)*, dan *Sedang Aktif (Border Biru)*.
   - **Responsif Mobile & Desktop**: Tampilan drawer daftar soal fleksibel di smartphone.

2. **Fleksibilitas Bank Soal & Waktu (JSON)**:
   - Bank soal tersimpan rapi dalam format file [`questions.json`](questions.json) yang sangat mudah diedit dan ditambah.
   - Pengaturan durasi waktu pengerjaan ujian (bisa custom menit sesuai keinginan untuk latihan kecepatan).
   - Fitur upload file `.json` kustom langsung dari web browser.

3. **Skor Akhir & Pembahasan Lengkap**:
   - Perhitungan estimasi skor skala UTBK (200 - 1000) dan persentase akurasi.
   - Statistik Benar, Salah, Dikosongkan, dan Waktu Pengerjaan.
   - **Review & Pembahasan Interaktif**: Menampilkan perbandingan jawaban yang dipilih peserta vs kunci jawaban benar beserta teks pembahasan detail.

4. **Keyboard Shortcut Cepat**:
   - `Arrow Left` (◀) / `Arrow Right` (▶) : Berpindah soal
   - Huruf `A`, `B`, `C`, `D`, `E` : Memilih opsi jawaban
   - Huruf `R` : Mengaktifkan/menonaktifkan status Ragu-Ragu

---

## 📂 Struktur File

```
utbk/
├── index.html          # Halaman utama aplikasi (Start, Ujian CAT, Skor & Pembahasan)
├── style.css           # Styling lengkap, modern & responsif (Desktop & Mobile)
├── app.js              # Engine simulasi (Timer, State, Navigasi, Skoring)
├── questions.json      # Bank soal UTBK (PU, PK, Literasi B. Indonesia & Inggris)
├── README.md           # Dokumentasi & panduan deploy
└── assets/
    └── avatar.svg      # Ilustrasi foto peserta ujian
```

---

## 🛠️ Cara Mengedit & Menambah Soal di `questions.json`

Anda dapat dengan mudah menambahkan subtes atau butir soal baru dengan mengedit file `questions.json`:

```json
{
  "testInfo": {
    "title": "SIMULASI UTBK - SNBT RESMI",
    "subtitle": "Balai Pengelolaan Pengujian Pendidikan",
    "year": "2025 / 2026",
    "defaultTimeMinutes": 20
  },
  "subtests": [
    {
      "id": "tps-pu",
      "name": "Kemampuan Penalaran Umum (PU)",
      "timeMinutes": 15,
      "questions": [
        {
          "id": 1,
          "question": "Tuliskan teks pertanyaan soal di sini...",
          "options": {
            "A": "Pilihan jawaban A",
            "B": "Pilihan jawaban B",
            "C": "Pilihan jawaban C",
            "D": "Pilihan jawaban D",
            "E": "Pilihan jawaban E"
          },
          "correctAnswer": "A",
          "explanation": "Tuliskan penjelasan dan cara pembahasan soal di sini."
        }
      ]
    }
  ]
}
```

---

## 🚀 Cara Upload & Deploy ke GitHub Pages (Gratis)

Ikuti 3 langkah mudah berikut untuk mempublikasikan web ini agar bisa diakses lewat internet:

### Langkah 1: Buat Repositori di GitHub
1. Buka [GitHub](https://github.com/) dan buat repositori baru (misal diberi nama `utbk-simulation`).
2. Atur repositori menjadi **Public**.

### Langkah 2: Upload File Proyek
Jalankan perintah berikut di terminal (atau upload file langsung lewat web GitHub):
```bash
git init
git add .
git commit -m "Initial commit simulasi UTBK CAT"
git branch -M main
git remote add origin https://github.com/USERNAME-ANDA/utbk-simulation.git
git push -u origin main
```

### Langkah 3: Aktifkan GitHub Pages
1. Di halaman repositori GitHub Anda, klik menu **Settings** > **Pages** (di sidebar kiri).
2. Pada bagian **Build and deployment** > **Branch**, pilih branch `main` dan folder `/ (root)`.
3. Klik **Save**.
4. Dalam 1-2 menit, web Anda sudah live di:
   `https://USERNAME-ANDA.github.io/utbk-simulation/`

---

*Selamat belajar dan semoga sukses lolos UTBK-SNBT di PTN impian! 🎉*
