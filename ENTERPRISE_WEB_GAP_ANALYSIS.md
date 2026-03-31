# Enterprise Web Gap Analysis (Bahasa Indonesia)

Dokumen ini menjelaskan status fitur saat ini agar **tetap berjalan di environment web**, kekurangan yang masih ada, dan roadmap agar ide ini siap level enterprise/commercial.

## 1) Fitur yang sudah berjalan di web environment

### Frontend (React + Vite)
- IDE layout berjalan di browser, termasuk mode mobile/tablet/desktop.
- Sidebar file explorer bisa dibuka/tutup.
- Panel kanan (Chat/Preview/Git) berjalan sebagai side panel (desktop) dan bottom sheet (mobile).
- Chat panel mengirim request HTTP ke backend (`/api/chat`) melalui proxy Vite.
- Ada indikator latensi request dan provider response.

### Backend (Node HTTP)
- `GET /api/health`: health check service.
- `GET /api/capabilities`: daftar kemampuan backend saat ini.
- `POST /api/chat`: menerima message array dan mode `ultra-think`.
- Rate limit in-memory per IP agar tidak mudah disalahgunakan.
- Request ID (`X-Request-Id`) untuk basic traceability.
- Jika `OPENAI_API_KEY` tersedia, backend mencoba provider AI eksternal; jika gagal, fallback ke local ultra-think.

## 2) Kekurangan saat ini (jujur, no bullshit)

1. **Belum enterprise-grade security**
   - Belum ada auth (JWT/OAuth/SSO).
   - Belum ada RBAC/ABAC per project/team.
   - Belum ada encryption-at-rest untuk data project/chat history.

2. **Belum enterprise-grade reliability**
   - Rate limit masih in-memory (tidak distributed).
   - Belum ada queue/retry worker untuk tugas berat.
   - Belum ada circuit breaker + bulkhead pattern.

3. **Belum enterprise-grade observability**
   - Belum ada OpenTelemetry tracing.
   - Belum ada central log aggregation (ELK/Loki/Datadog).
   - Belum ada error budget + SLO dashboard.

4. **Belum enterprise-grade AI governance**
   - Belum ada prompt versioning + eval pipeline.
   - Belum ada guardrails policy engine (PII, toxicity, secrets).
   - Belum ada retrieval pipeline (RAG) untuk knowledge base perusahaan.

5. **Belum enterprise-grade deployment**
   - Belum ada IaC (Terraform/Pulumi) untuk provisioning.
   - Belum ada canary/blue-green deployment otomatis.
   - Belum ada multi-region strategy + DR plan.

## 3) Rencana menuju enterprise commercial

### Fase 1 (2-4 minggu)
- Tambah autentikasi (OIDC/SAML), manajemen session aman, dan RBAC minimal.
- Pindah rate-limit ke Redis + token bucket.
- Tambah API contract validation (schema) dan strict error model.
- Tambah audit log untuk semua action penting.

### Fase 2 (4-8 minggu)
- Integrasi observability penuh (logs, metrics, traces).
- Introduce model router (cost/performance aware) + fallback chain.
- Tambah policy guardrails sebelum/ sesudah model call.
- Tambah caching context dan semantic retrieval (RAG) untuk repo besar.

### Fase 3 (8-12 minggu)
- Multi-tenant architecture, tenant isolation, quota/billing.
- Enterprise admin panel: governance, policy, eval score, cost control.
- DR drills, chaos test, performance/load test formal.
- Compliance readiness: SOC2 controls map, data retention policies.

## 4) Definisi "proper AI" untuk produk ini

Agar AI dianggap proper untuk enterprise, minimal harus punya:
- Deterministic prompts untuk task kritikal.
- Evals otomatis (regression suite) sebelum rilis prompt/model.
- Grounding context yang benar (repo-aware + doc-aware).
- Safety checks (secret leak prevention, policy filtering).
- Cost/perf monitoring per tenant dan per feature.

## 5) Keputusan arsitektur saat ini

- Tetap **web-first**: semua fitur utama bisa diakses via browser.
- Backend dibuat stateless-ish agar mudah di-scale horizontal.
- AI provider bersifat optional via env (`OPENAI_API_KEY`) dengan local fallback agar fitur tidak mati total.

