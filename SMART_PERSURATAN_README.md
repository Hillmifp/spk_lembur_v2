# Smart Persuratan Checker — Tahap 1

Modul ini menambahkan pustaka dokumen final, ekstraksi paragraf, observasi frekuensi paragraf, aturan persuratan yang divalidasi manusia, pemeriksaan berbasis aturan lokal, jejak sumber, dan audit log. Tidak ada panggilan ke AI/API eksternal pada tahap ini.

## File baru

- `services/reference_service.py` — penyimpanan referensi, ekstraksi paragraf, pola berulang, aturan, provenance, dan audit log.
- `services/analysis_provider.py` — antarmuka provider analisis. Implementasi aktif saat ini `LocalRuleProvider`; adapter AI di masa depan dapat ditambahkan di sini setelah mendapat persetujuan keamanan.
- `frontend/src/pages/PustakaReferensi.jsx` — UI dokumen referensi, pola paragraf, aturan, dan audit log.
- `SMART_PERSURATAN_README.md` — panduan ini.

## File yang diubah

- `app.py` — endpoint `/api/references`, `/api/reference-insights`, `/api/rules`, dan `/api/audit-log`; endpoint lama tetap dipertahankan.
- `services/checker_service.py` — menyimpan temuan berbasis aturan dan sumber referensi; menambah kolom `source_findings` secara backward-compatible.
- `frontend/src/App.jsx` — route `/pustaka-referensi`.
- `frontend/src/components/layout/Sidebar.jsx` — menu Pustaka Referensi.
- `frontend/src/pages/CheckerPersuratan.jsx` — menampilkan temuan dari standar referensi berikut sumbernya.

## Cara kerja

1. Buka menu **Pustaka Referensi**.
2. Unggah hanya dokumen final yang disetujui/ditandatangani. Format: DOCX, PDF berbasis teks, atau TXT.
3. Sistem mengekstrak paragraf, menyimpan hash SHA-256 file untuk mendeteksi unggahan identik, dan mencatat metadata.
4. Tab **Pola Paragraf** menampilkan paragraf identik setelah normalisasi sederhana beserta jumlah dokumen dan frekuensinya. Frekuensi adalah observasi, bukan penetapan kewajiban.
5. Buka detail dokumen, tinjau paragraf, lalu klik **Jadikan aturan** hanya pada redaksi yang telah dipastikan sebagai standar.
6. Aturan aktif akan dibandingkan dengan dokumen baru di Checker Persuratan. Hasil menyertakan ID aturan, judul sumber, nomor dokumen sumber (jika dicatat), dan nomor paragraf sumber.
7. Tab **Jejak Audit** menampilkan peristiwa pembuatan/penghapusan referensi, perubahan aturan, dan pembaruan pemeriksaan.

## Persyaratan

Gunakan environment Python yang sama dengan aplikasi SPK Lembur. Dependensi utama proyek tetap dibutuhkan (Flask, Flask-CORS, pandas, openpyxl, python-docx). Untuk PDF teks, pasang `pypdf`:

```bash
pip install pypdf
```

Frontend tetap memakai package yang sudah ada pada `frontend/package.json`.

## Menjalankan

Terminal backend:

```bash
python app.py
```

Terminal frontend:

```bash
cd frontend
npm run dev
```

Buka URL Vite yang ditampilkan terminal lalu pilih **Pustaka Referensi**. Tabel baru dibuat otomatis pada database SQLite yang sama. Jangan menghapus `database/spk.db` yang sudah digunakan aplikasi produksi.

## Batasan tahap 1

- Belum memakai AI generatif atau API eksternal.
- PDF scan/gambar belum memiliki OCR; gunakan DOCX atau PDF yang teksnya dapat diseleksi.
- Analisis pola saat ini hanya menghitung paragraf yang sama setelah normalisasi. Paragraf yang bermakna serupa tetapi redaksinya berbeda tidak digabung otomatis.
- Pencocokan aturan bersifat deterministik dan perlu divalidasi checker. Hasil “belum terdeteksi” bukan bukti otomatis bahwa naskah salah.
- Nomor surat, dasar hukum, tanda tangan, lampiran fisik, dan keberlakuan peraturan tetap perlu diverifikasi manusia.
- Aplikasi dasar belum memiliki autentikasi khusus untuk endpoint baru. Terapkan kontrol akses jaringan/server sesuai kebijakan instansi sebelum digunakan untuk dokumen kedinasan.

## Prinsip keamanan

Simpan referensi pada `data/reference_documents/` dan dokumen pemeriksaan pada `data/checker_uploads/`. Folder tersebut berisi dokumen kedinasan; jangan masukkan ke repository publik. Backup database dan folder dokumen dengan akses terbatas. Jangan menambahkan provider AI eksternal sebelum layanan dan klasifikasi data disetujui instansi.
