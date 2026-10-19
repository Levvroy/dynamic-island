# ADR 0003 — Persistensi JSON atomik

Status: Diterima · 2026-10-19 · Refs: KF-045, KF-060..063, KF-070..073

## Konteks
Data yang disimpan kecil (to-do, log minum, statistik fokus, cache lirik, pengaturan), dengan satu pengguna dan satu proses.

## Opsi
1. SQLite. Kuat, tetapi menambah ukuran binary dan butuh migrasi skema.
2. tauri-plugin-store. Praktis, tetapi kontrol atomisitas dan versi skema terbatas.
3. **File JSON per domain** di `app_data_dir()`, ditulis ke file sementara lalu di-rename, dengan field `schema_version`.

## Keputusan
Opsi 3. File rusak di-rename menjadi `*.corrupt-<timestamp>.json`, lalu mulai dengan data kosong (KF-063). Token tidak disimpan di JSON (KNF-011, pakai Credential Manager).

## Konsekuensi
+ Tanpa dependensi berat, mudah diinspeksi dan diuji.
− Tidak ada query. Kalau data membesar (misalnya riwayat bertahun-tahun), perlu ditinjau ulang.
