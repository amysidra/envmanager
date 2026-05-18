# Env Manager — Project Context

Dokumen ini ringkasan project tugas akhir. Paste atau referensikan ke Claude Code di terminal sebagai context awal.

## Overview

**Nama project:** Env Manager (nama final TBD)
**Konteks:** Tugas akhir Devscale Fullstack JavaScript Batch XI
**Deadline:** < 2 minggu dari sekarang (15 Mei 2026)
**Tim:** 2-3 orang (saya + Raihan A + Shidratul Muntaha + anisank25)

## Problem Statement

Tim kecil developer (2-10 orang) sering share file `.env` antar anggota lewat channel yang tidak aman (chat, email, DM). File `.env` berisi secret sensitif (API key, password DB, token) yang seharusnya tidak boleh bocor. Selain itu, tim kecil biasanya tidak punya security engineer untuk mengecek apakah isi `.env` sudah aman.

**Solusi:** Tempat terpusat untuk simpan, share, dan analisis keamanan file `.env` dengan bantuan AI.

## Target User

Tim kecil developer (2-10 orang) — startup tahap awal, tim freelance, atau tim project kuliah.

## Tech Stack (wajib dari kurikulum Devscale)

- **Frontend + Backend:** Hono + TanStack Start (monorepo)
- **ORM + Database:** Prisma ORM + PostgreSQL
- **Auth:** Authentication + Authorization (implementasi sendiri atau library)
- **AI:** LLM Implementation (untuk fitur Security Scanner)

## Scope MVP

### Fitur wajib jadi

1. **Auth** — register & login user
2. **Project / workspace** — user bisa bikin project
3. **Upload `.env`** — file di-encrypt sebelum disimpan di database
4. **View & download `.env`** — decrypt saat user authorized membuka
5. **Invite member** — via email, member bisa akses file `.env` project
6. **Role sederhana** — owner (bisa invite & kelola) dan member (cuma akses)
7. **AI Security Scanner** — LLM analisis file `.env`, kasih warning untuk:
   - Production secret kelihatannya di-mix dengan dev (misal Stripe live key di .env staging)
   - Password / secret lemah
   - Format API key janggal
   - Variable sensitif yang sebaiknya di-rotate
   - Output: list warning dengan severity (high / medium / low)

### Out of scope (future work)

- CLI tool untuk pull `.env`
- Versioning / history perubahan
- Integrasi langsung ke Vercel / Netlify / Railway
- Multi-environment per project (dev / staging / prod) — cukup 1 file per project dulu
- Audit log
- 2FA
- Billing

## Kenapa Security Scanner untuk fitur LLM

- Paling nyambung dengan core value produk (keamanan secret)
- Demo-able pas presentasi (upload `.env` bermasalah → langsung kelihatan warning-nya)
- Prompt-nya straightforward, output bisa structured JSON
- Mengisi gap nyata tim kecil yang tidak punya security engineer

## Hal teknis yang perlu dipikirin di awal

1. **Strategi encryption** — pakai AES-256-GCM, di mana key master disimpan? (env variable di server, bukan di DB)
2. **Schema Prisma** — entity utama: User, Project, ProjectMember, EnvFile, ScanResult
3. **LLM provider** — Anthropic / OpenAI / lokal? Perlu cek budget API
4. **Structured output dari LLM** — pakai JSON schema / tool use biar response konsisten
5. **Authorization** — siapa boleh akses project mana, owner vs member, middleware check di Hono

## Status saat ini

- ✅ Ide & scope sudah final (dokumen ini)
- ⏳ Belum: setup repo, scaffolding monorepo, schema database, breakdown task per anggota tim
- 📅 Hari ini Jumat 15 Mei 2026 — Sabtu ada checkpoint progress tim

## Catatan personal

- Familiar Next.js dari project sebelumnya (skypiacademy / SPP), tapi untuk project ini wajib pakai TanStack Start + Hono
- Sudah pernah pakai TanStack Start sebelumnya, lancar
- Workflow git biasanya: main / staging / feature branch, deploy via Netlify Branch Deploy (perlu konfirmasi apakah tim mau workflow sama)
