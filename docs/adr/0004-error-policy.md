# ADR 0004 — Error policy `Result<T, AppError>`

Status: Diterima · 2026-10-19 · Refs: KNF-006

## Konteks
Baseline memakai `.lock().unwrap()` dan `unwrap()` di jalur runtime. Satu panic menjatuhkan seluruh app, dan mutex yang poisoned membuat semua command berikutnya ikut panic.

## Opsi
1. Biarkan panic, lalu restart otomatis.
2. String error ad-hoc.
3. **Enum `AppError` yang serializable**, dipakai oleh semua command dan service.

## Keputusan
Opsi 3. Command mengembalikan `Result<T, AppError>`. `unwrap`/`expect` hanya boleh di setup. Mutex poisoned dipulihkan dengan `into_inner()` disertai log. Adapter yang gagal membuat widget kosong, bukan crash.

## Konsekuensi
+ App tahan terhadap kegagalan sumber data, dan frontend bisa membedakan jenis error.
− Kode lebih verbose, dan setiap varian error perlu dipetakan ke tipe TS.
