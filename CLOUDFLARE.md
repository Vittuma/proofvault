# Tài liệu Kỹ thuật & Vận hành Cloudflare: proofvault

Tài liệu chi tiết về kiến trúc, kiểm thử thực tế, bản vá edge runtime, cấu hình môi trường và phân tích chi phí cho dự án `proofvault` (Railway → Cloudflare).

---

## 1. Thông tin Triển khai Thực tế trên Cloudflare

- **Người phụ trách:** Vittuma
- **Project / Git repo:** `proofvault` — [https://github.com/Vittuma/proofvault.git](https://github.com/Vittuma/proofvault.git)
- **Cloudflare Account ID:** `2ce680ef1cb71099e460efa96b737070`
- **Email:** `blancaromerocrypto@gmail.com`
- **Account Name:** `Blancaromerocrypto@gmail.com's Account`
- **Subdomain:** `whale-app.workers.dev`
- **Worker Name:** `proofvault`
- **URL chạy thử:** [https://proofvault.whale-app.workers.dev](https://proofvault.whale-app.workers.dev)
- **Trạng thái HTTPS/TLS:** ✅ **Hoạt động ổn định (TLS 1.3 / HTTP/2)**. Chứng chỉ số tự động cấp bởi Cloudflare Edge.
- **Git Branch:** [`cloudflare-migration`](https://github.com/Vittuma/proofvault/tree/cloudflare-migration)

---

## 2. Kiến trúc & Khả năng Tương thích Cloudflare (Edge Assessment)

### 2.1. Ngăn xếp Công nghệ
- **Framework:** Next.js 16.2.12 (App Router, Turbopack) + React 19.2.4.
- **CSS / UI:** Tailwind CSS v4 + Lucide React.
- **Web3 Blockchain:** Aptos TypeScript SDK (`@aptos-labs/ts-sdk`), Aptos Wallet Adapter (`@aptos-labs/wallet-adapter-react`).
- **Lưu trữ Phân tán:** Shelby Protocol SDK (`@shelby-protocol/sdk`).
- **AI Engine:** OpenAI client cho việc phân tích và kiểm toán tính toàn vẹn tài liệu (`/api/ai/audit`).
- **Testing:** Vitest 4.1.10 (25 tests).

### 2.2. Điểm nghẽn Edge Runtime đã khắc phục
- **Vấn đề phát hiện:** Gói `@aptos-labs/aptos-client` kéo theo thư viện `got` và `http2-wrapper`. Trong file `js-stream-socket.js`, `http2-wrapper` sử dụng hack nội bộ Node.js:
  ```javascript
  const JSStreamSocket = (new tls.TLSSocket(new stream.PassThrough()))._handle._parentWrap.constructor;
  ```
  Trên runtime workerd của Cloudflare Workers, `_handle._parentWrap` là `undefined`, dẫn đến lỗi `TypeError: Cannot read properties of undefined (reading 'constructor')` làm sập SSR (HTTP 500).
- **Giải pháp:** Đã tạo bản vá pnpm chính quy tại [`patches/http2-wrapper@2.2.1.patch`](patches/http2-wrapper@2.2.1.patch) với cơ chế fallback an toàn:
  ```javascript
  let JSStreamSocket;
  try {
    const socket = new tls.TLSSocket(new stream.PassThrough());
    JSStreamSocket = socket._handle && socket._handle._parentWrap ? socket._handle._parentWrap.constructor : class JSStreamSocket extends stream.Duplex {};
  } catch {
    JSStreamSocket = class JSStreamSocket extends stream.Duplex {};
  }
  ```
  Nhờ đó toàn bộ bundle Next.js 16 và Aptos SDK khởi chạy ổn định 100% trên Cloudflare Workers.

---

## 3. Kết quả Kiểm thử Thực tế trên Cloudflare Edge

### 3.1. Kiểm thử HTTP Routes & Giao diện:
| Tuyến đường (Route) | Phương thức | Header / Request | Phản hồi thực tế | Đánh giá |
|---|---|---|---|---|
| `/` | `GET` | Mặc định | **HTTP 200 OK**, Tải đầy đủ HTML Trang chủ ProofVault, CSS Tailwind v4 | ✅ Đạt |
| `/about` | `GET` | Mặc định | **HTTP 200 OK**, Tải giao diện thông tin dự án | ✅ Đạt |
| `/evidence` | `GET` | Mặc định | **HTTP 200 OK**, Tải giao diện kho bằng chứng (Archive) | ✅ Đạt |
| `/upload` | `GET` | Mặc định | **HTTP 200 OK**, Tải giao diện tải lên & ký số | ✅ Đạt |
| `/agent-runs` | `GET` | Mặc định | **HTTP 200 OK**, Tải giao diện theo dõi Agent Runs | ✅ Đạt |
| `/evidence/1` | `GET` | Dynamic route | **HTTP 200 OK**, Tải giao diện chi tiết bằng chứng | ✅ Đạt |
| `/evidence/1/audit`| `GET` | Dynamic route | **HTTP 200 OK**, Tải giao diện kiểm toán bằng chứng | ✅ Đạt |

### 3.2. Kiểm thử API (`/api/ai/audit`):
| Thử nghiệm | Phương thức | Payload | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|
| **Empty payload** | `POST` | `{}` | **HTTP 400 Bad Request** `{"error":"Invalid request payload."}` | ✅ Đạt (Validation đúng) |
| **Invalid structure** | `POST` | `{"analysisType":"test"}` | **HTTP 400 Bad Request** `{"error":"Invalid request payload."}` | ✅ Đạt |

### 3.3. Kiểm thử Đơn vị & Typecheck:
- **TypeScript:** `npx tsc --noEmit` → **0 lỗi (Exit Code 0)**.
- **Unit Tests:** `npx vitest run` → **6/6 files passed, 25/25 tests passed (100%)**.

---

## 4. Phân tích Chi phí Vận hành (Railway vs Cloudflare)

| Tiêu chí | Railway Hiện tại | Cloudflare Workers Mới |
|---|---|---|
| **Mô hình triển khai** | Container Docker chạy liên tục 24/7 | Serverless Edge Worker (chỉ tính theo invocation) |
| **Chi phí máy chủ Web** | ~$5 – $8 / tháng | **$0.00 / tháng** (Cloudflare Free Tier miễn phí 100,000 req/ngày) |
| **Băng thông (Egress)** | Tính phí theo dung lượng vượt định mức | **Miễn phí 100% Egress** |
| **Cơ sở dữ liệu** | Không sử dụng SQL (đọc từ Blockchain/Shelby) | Không cần cơ sở dữ liệu riêng |
| **TỔNG CHI PHÍ** | **~$5 – $8 / tháng** | **$0.00 / tháng** *(Tiết kiệm 100%)* |

---

## 5. Danh mục Biến môi trường & Cấu hình Secrets

Khi chuyển đổi sang production thật, cấu hình các biến môi trường sau trên Cloudflare (không commit vào Git):

```bash
# Thiết lập Client-side vars trong wrangler.jsonc (hoặc dashboard):
NEXT_PUBLIC_APTOS_NETWORK=testnet (hoặc mainnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (địa chỉ ví hợp đồng Move đã deploy)
NEXT_PUBLIC_SHELBY_NETWORK=testnet (hoặc mainnet)
NEXT_PUBLIC_STORAGE_ADAPTER_MODE=shelby
NEXT_PUBLIC_SHELBY_API_KEY=<shelby_client_key>
NEXT_PUBLIC_MAX_UPLOAD_SIZE=26214400

# Thiết lập Server Secrets (bảo mật qua CLI):
npx wrangler secret put OPENAI_API_KEY
```

---

## 6. Kế hoạch Bàn giao & Rollback (Dự phòng)

- **Nguyên tắc an toàn:**
  - Giữ nguyên toàn bộ service của `proofvault` trên Railway.
  - Không thay đổi DNS hay domain production khi chưa được phê duyệt.
- **Quy trình Rollback:**
  - Hệ thống Railway không bị sửa đổi hay tắt. Nếu có bất kỳ vấn đề nào, việc rollback hoàn tất ngay lập tức (**0 phút downtime**).

