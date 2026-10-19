# Spesifikasi Kebutuhan Perangkat Lunak (SKPL) — Living Notch for Windows

Versi 0.1 · 2026-10-19 · Status: draf, disetujui user untuk prioritas

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini menjelaskan **apa** yang harus dilakukan Living Notch, yaitu sebuah notch interaktif di tepi atas layar Windows. Dokumen ini tidak membahas **bagaimana** mengimplementasikannya. Keputusan teknis ada di `architecture.md` dan `adr/`.

### 1.2 Lingkup
Living Notch menampilkan informasi yang sering dicek pengguna tanpa perlu membuka aplikasi lain: musik, baterai, jadwal, deadline, fokus, dan notifikasi. Targetnya beban sistem hampir nol saat idle.

### 1.3 Definisi
| Istilah | Arti |
|---|---|
| Notch | Jendela berbentuk pil di tepi atas layar |
| Resting | Keadaan idle: jam + "mata", tanpa aktivitas |
| Closed | Keadaan ringkas: baterai, jam, indikator musik |
| Expanded | Keadaan melebar saat di-hover, menampilkan detail satu fitur |
| Wide | Keadaan sangat lebar untuk lirik |
| Alert | Tampilan sementara berprioritas (charging, pengingat, notifikasi, dll.) |
| Monitor target | Monitor tempat notch ditampilkan (lihat KF-090) |

### 1.4 Prioritas
MoSCoW: **Must**, **Should**, **Could**, **Won't** (untuk saat ini).

## 2. Deskripsi umum

### 2.1 Pengguna
Satu pengguna utama: mahasiswa informatika yang ingin produktif dan menjalankan peran project manager. Pengguna ini memakai laptop Windows, kadang ditambah monitor eksternal.

### 2.2 Lingkungan operasi
- Windows 10 22H2 dan Windows 11
- WebView2 Runtime terpasang
- Laptop, dengan atau tanpa satu monitor eksternal

### 2.3 Batasan
- Satu-satunya akses jaringan yang diizinkan didefinisikan di KNF-007.
- Data pengguna disimpan lokal di perangkat.
- Lisensi MIT (warisan fork).

### 2.4 Asumsi dan ketergantungan
- **A-1:** Player musik yang dipakai mendaftarkan diri ke kontrol media sistem Windows. Player yang tidak melakukannya tidak akan terdeteksi.
- **A-2:** Jadwal kuliah tersedia sebagai kalender iCalendar (.ics), dalam bentuk file atau URL.
- **A-3:** Aplikasi chat (WhatsApp, LINE, Teams) menampilkan notifikasi lewat toast Windows. Kemampuan membacanya **belum diverifikasi** (spike S-1).
- **A-4:** Banyak earbuds tidak melaporkan baterai lewat API standar.
- **A-5:** Tidak ada API publik resmi untuk kuota pemakaian Claude (belum diverifikasi, spike S-2).
- **A-6:** "Monitor utama" berarti monitor eksternal jika ada. Jika tidak ada, notch berada di layar laptop. Dikonfirmasi user pada 2026-10-19.

## 3. Kebutuhan fungsional

Format: **ID** (Prioritas, sumber) pernyataan EARS.

### 3.1 Keadaan notch (UC-01)
- **KF-001** (Must, user) Selama tidak ada aktivitas media, alert, atau hover, sistem harus menampilkan notch dalam keadaan Resting berisi jam dan "mata".
- **KF-002** (Must, user) Selama media sedang diputar dan tidak ada hover, sistem harus menampilkan keadaan Closed berisi baterai, jam, dan indikator gelombang suara.
- **KF-003** (Must, user) Ketika kursor berada di atas notch, sistem harus menampilkan keadaan Expanded untuk fitur yang aktif.
- **KF-004** (Must, turunan UC-01) Ketika kursor meninggalkan notch, sistem harus kembali ke keadaan sebelum Expanded.
- **KF-005** (Must, turunan UC-01) Ketika alert dipicu, sistem harus menampilkan alert berprioritas tertinggi selama durasinya, lalu kembali ke keadaan sebelumnya.
- **KF-006** (Must, turunan UC-01) Jika alert baru berprioritas lebih rendah dari alert yang sedang tampil, maka sistem harus mengantrekannya.
- **KF-007** (Must, KNF-008) Selama notch dalam keadaan Resting atau Closed, sistem harus meneruskan klik di luar area pil ke aplikasi di bawahnya.

### 3.2 Musik (UC-02)
- **KF-010** (Must, user) Ketika sesi media aktif berubah, sistem harus menampilkan judul, artis, dan sampul lagu.
- **KF-011** (Must, user) Ketika pengguna menekan kontrol play/pause, next, atau previous, sistem harus meneruskan perintah tersebut ke player aktif.
- **KF-012** (Must, user) Selama lagu diputar, sistem harus menampilkan progres lagu.
- **KF-013** (Must, turunan UC-02) Jika tidak ada sesi media, maka sistem harus menyembunyikan kontrol musik dan kembali ke Resting.
- **KF-014** (Must, turunan UC-02) Jika player menolak perintah, maka sistem harus tetap menampilkan status terakhir yang dilaporkan player tanpa crash.

### 3.3 Lirik (UC-03)
- **KF-020** (Should, user) Ketika lagu yang diputar berganti, sistem harus meminta lirik tersinkron berdasarkan judul, artis, dan durasi lagu.
- **KF-021** (Should, user) Jika lirik tersinkron tidak ditemukan, maka sistem harus tetap menampilkan mode musik tanpa lirik dan tidak menampilkan pesan error.
- **KF-022** (Should, user) Selama lirik tersedia dan mode lirik aktif, sistem harus menyorot baris yang sesuai dengan posisi lagu.
- **KF-023** (Should, turunan UC-03) Jika tidak ada koneksi internet, maka sistem harus memakai lirik dari cache lokal bila tersedia.

### 3.4 Charging dan baterai (UC-04)
- **KF-030** (Must, user) Ketika charger dicolokkan, sistem harus menampilkan alert charging berisi persentase baterai.
- **KF-031** (Must, user) Ketika charger dicabut, sistem harus menampilkan alert singkat berisi persentase baterai.
- **KF-032** (Must, baseline) Sistem harus menampilkan persentase baterai yang sebenarnya dari sistem operasi.
- **KF-033** (Must, turunan UC-04) Pada perangkat tanpa baterai, sistem harus menyembunyikan indikator baterai.
- **KF-034** (Should, elisitasi) Ketika baterai turun di bawah 15% dan tidak sedang di-charge, sistem harus menampilkan alert baterai rendah satu kali per siklus pengosongan.

### 3.5 Fokus / Pomodoro (UC-05)
- **KF-040** (Must, user) Ketika pengguna memulai sesi fokus, sistem harus menghitung mundur 25 menit fokus diikuti 5 menit istirahat.
- **KF-041** (Must, user) Ketika fase fokus atau istirahat berakhir, sistem harus menampilkan alert pergantian fase.
- **KF-042** (Must, user) Ketika pengguna menjeda atau membatalkan sesi, sistem harus menghentikan hitung mundur.
- **KF-043** (Should, elisitasi) Selama sesi fokus berjalan, sistem harus menahan alert berprioritas rendah sampai fase fokus berakhir.
- **KF-044** (Could, elisitasi) Sistem harus mencatat jumlah sesi fokus selesai per hari dan menampilkan ringkasan 7 hari terakhir.
- **KF-045** (Must, turunan UC-05) Jika aplikasi ditutup saat sesi berjalan, maka sistem harus memulihkan sisa waktu ketika dibuka kembali.

### 3.6 Shelf (UC-06)
- **KF-050** (Should, user) Ketika pengguna menjatuhkan file ke notch, sistem harus menyimpan referensi file tersebut di shelf.
- **KF-051** (Should, user) Ketika pengguna menyeret item dari shelf ke aplikasi lain, sistem harus menyerahkan file tersebut.
- **KF-052** (Should, turunan UC-06) Jika file di shelf sudah dipindah atau dihapus, maka sistem harus menandai item tersebut sebagai tidak tersedia.

### 3.7 To-do dan deadline (UC-07)
- **KF-060** (Should, user) Sistem harus memungkinkan pengguna menambah, menyelesaikan, dan menghapus tugas dengan tanggal jatuh tempo opsional.
- **KF-061** (Should, user) Ketika tugas mencapai 1 jam sebelum jatuh tempo, sistem harus menampilkan alert pengingat.
- **KF-062** (Should, user) Selama ada deadline dalam 24 jam ke depan, sistem harus menampilkan jumlah deadline tersebut di keadaan Expanded.
- **KF-063** (Should, turunan UC-07) Jika data tugas tersimpan rusak, maka sistem harus menyimpan salinan file rusak dan memulai daftar kosong tanpa crash.

### 3.8 Pengingat minum (UC-08)
- **KF-070** (Should, user) Selama jam aktif yang diatur pengguna, sistem harus mengingatkan minum dengan interval yang diatur pengguna.
- **KF-071** (Should, user) Ketika pengguna mencatat minum, sistem harus memperbarui progres harian dan chart per jam.
- **KF-072** (Should, user) Jika pengingat sebelumnya belum ditanggapi, maka sistem harus tidak menampilkan pengingat baru sebelum interval berikutnya.
- **KF-073** (Should, turunan UC-08) Ketika tanggal berganti, sistem harus mengatur ulang progres harian.

### 3.9 Headphone (UC-09)
- **KF-080** (Could, user) Pada perangkat audio Bluetooth yang melaporkan baterai, sistem harus menampilkan persentase baterai ketika perangkat terhubung.
- **KF-081** (Could, user) Jika perangkat tidak melaporkan baterai, maka sistem harus menampilkan "tidak tersedia".

### 3.10 Penempatan monitor (UC-10)
- **KF-090** (Must, user) Ketika aplikasi dimulai, sistem harus menampilkan notch di tengah atas monitor eksternal jika ada, atau di layar laptop jika tidak ada.
- **KF-091** (Must, user) Ketika monitor eksternal terhubung, sistem harus memindahkan notch ke monitor tersebut.
- **KF-092** (Must, user) Ketika monitor eksternal dilepas, sistem harus memindahkan notch ke layar laptop.
- **KF-093** (Must, turunan UC-10) Ketika resolusi atau skala tampilan monitor target berubah, sistem harus memposisikan ulang notch di tengah atas.

### 3.11 Kalender dan jadwal kuliah (UC-11)
- **KF-100** (Should, user) Sistem harus memungkinkan pengguna mendaftarkan satu atau lebih sumber kalender iCalendar (file lokal atau URL).
- **KF-101** (Should, user) Selama ada event dalam 12 jam ke depan, sistem harus menampilkan event berikutnya dan hitung mundurnya di keadaan Expanded.
- **KF-102** (Should, elisitasi) Ketika event akan dimulai dalam 10 menit, sistem harus menampilkan alert berisi judul, lokasi, dan waktu mulai.
- **KF-103** (Should, elisitasi) Ketika alert event ditampilkan dan event memiliki tautan rapat, sistem harus menyediakan tombol untuk membuka tautan tersebut.
- **KF-104** (Should, turunan UC-11) Jika sumber kalender tidak dapat diambil, maka sistem harus menampilkan data terakhir yang tersimpan beserta waktu sinkronisasinya.

### 3.12 Notifikasi aplikasi (UC-12)
- **KF-110** (Could, user) Ketika notifikasi baru masuk dari aplikasi yang diizinkan pengguna, sistem harus menampilkan nama aplikasi dan pengirim selama ≤ 5 detik.
- **KF-111** (Could, user) Sistem harus memungkinkan pengguna memilih aplikasi mana yang notifikasinya ditampilkan.
- **KF-112** (Could, turunan UC-12) Jika izin akses notifikasi ditolak atau tidak didukung, maka sistem harus menyembunyikan fitur notifikasi tanpa menampilkan error.

### 3.13 Status GitHub (UC-13)
- **KF-120** (Could, elisitasi) Ketika workflow CI pada repositori yang dipantau gagal, sistem harus menampilkan alert berisi nama repositori dan workflow.
- **KF-121** (Could, elisitasi) Selama ada pull request yang meminta review pengguna, sistem harus menampilkan jumlahnya di keadaan Expanded.
- **KF-122** (Could, turunan UC-13) Jika token tidak valid atau batas API tercapai, maka sistem harus menonaktifkan sementara fitur GitHub dan menampilkan status "perlu login ulang" di pengaturan.

### 3.14 Ringkasan harian (UC-14)
- **KF-130** (Could, elisitasi) Ketika pengguna login pertama kali pada suatu hari, sistem harus menampilkan ringkasan jumlah kelas, deadline, dan PR menunggu hari itu.
- **KF-131** (Could, turunan UC-14) Jika suatu sumber data tidak tersedia, maka sistem harus melewatkan bagian tersebut dari ringkasan.

### 3.15 Indikator privasi (UC-15)
- **KF-140** (Could, elisitasi) Selama mikrofon atau kamera sedang dipakai oleh aplikasi apa pun, sistem harus menampilkan indikator di notch.

### 3.16 Pemakaian Claude
- **KF-150** (Won't, user) Sistem harus menampilkan sisa kuota pemakaian Claude milik pengguna. *Ditunda sampai ada sumber data resmi (spike S-2).*

### 3.17 Widget warisan
- **KF-160** (Won't, baseline) Widget weather, clipboard, dan sistem tetap ada tetapi nonaktif secara default di balik pengaturan.

## 4. Kebutuhan non-fungsional

Diukur di mesin dev dengan release build.

| ID | Prio | Pernyataan | Cara ukur |
|---|---|---|---|
| KNF-001 | Must | Selama Resting, proses app harus memakai CPU rata-rata < 0,5% dalam 60 detik | `Get-Counter '\Process(dynamic-island*)\% Processor Time'` |
| KNF-002 | Must | Selama Resting, working set app + WebView2 harus < 150 MB | Task Manager, jumlahkan proses milik app |
| KNF-003 | Must | Transisi hover → Expanded harus selesai ≤ 250 ms | Rekam layar / perf trace |
| KNF-004 | Must | Perubahan lagu harus tampil ≤ 500 ms setelah event OS | Log timestamp backend vs render |
| KNF-005 | Should | Installer harus < 15 MB | Artefak `tauri build` |
| KNF-006 | Must | Kegagalan sumber data apa pun tidak boleh membuat app crash. Widget menampilkan state kosong | Test dengan adapter mock yang error |
| KNF-007 | Must | Request jaringan keluar hanya boleh ke: LRCLIB (judul, artis, album, durasi), URL kalender yang dikonfigurasi, API GitHub (jika diaktifkan), dan weather (jika diaktifkan) | Review kode + CSP + log request |
| KNF-008 | Must | Selama Resting/Closed, notch tidak boleh menghalangi klik ke aplikasi di bawahnya di luar area pil | Uji manual |
| KNF-009 | Must | Perpindahan notch antar monitor harus selesai ≤ 2 detik setelah perubahan tampilan | Stopwatch / log |
| KNF-010 | Should | Alert tidak boleh muncul lebih dari 1 per 10 detik, kecuali alert charging | Test penjadwal alert |
| KNF-011 | Must | Kredensial (token GitHub) harus disimpan di penyimpanan kredensial OS, tidak dalam file teks biasa | Review kode |

## 5. Spike teknis yang harus dilakukan sebelum komitmen

| ID | Pertanyaan | Memengaruhi |
|---|---|---|
| S-1 | Bisakah app Tauri tanpa paket MSIX membaca toast Windows (WhatsApp, LINE, Teams)? | KF-110..112 |
| S-2 | Adakah sumber data resmi untuk kuota Claude? | KF-150 |
| S-3 | Bagaimana cara mendeteksi mic/kamera yang aktif tanpa hak admin? | KF-140 |
| S-4 | Apakah drag-drop berfungsi pada jendela transparan yang click-through? | KF-050, KF-007 |
