# KẾ HOẠCH CHUYỂN ĐỔI CHÍNH THỨC (CUTOVER PLAN): proofvault

Kế hoạch kỹ thuật chi tiết phục vụ chuyển đổi chính thức (production cutover) cho repository `proofvault` (Next.js 16.2.12 + React 19 + Aptos Move + Shelby Protocol) từ Railway sang Cloudflare Edge Workers.

---

## 1. Backup và Phương Án Khôi Phục
- **Trạng thái Railway hiện tại:** Service `proofvault` trong Railway project `triumphant-determination` đang chạy image container Next.js.
- **Phương án backup:**
  - Git repository được bảo toàn trên branch `main`.
  - Snapshot cấu hình DNS hiện tại của tên miền chính (A record hoặc CNAME trỏ về Railway domain `proofvault-production.up.railway.app`).
  - Toàn bộ dữ liệu chứng cứ gốc được lưu trữ phân tán trên Shelby Protocol và Aptos Blockchain (bất biến, không thể bị xóa hoặc sửa đổi).

---

## 2. Kiểm Tra Điều Kiện Trước Cutover (Pre-Cutover Checklist)
- [ ] Worker trên Cloudflare phản hồi HTTP 200 OK trên toàn bộ 6 trang giao diện chính (`/`, `/about`, `/evidence`, `/upload`, `/agent-runs`, `/evidence/1`).
- [ ] Bộ kiểm thử Vitest đạt **7/7 files passed, 28/28 tests passed (100%)**.
- [ ] Move Smart Contract đã được deploy và kiểm thử hoàn tất trên Aptos Mainnet.
- [ ] Shelby API Key và OpenAI API Key production đã sẵn sàng.
- [ ] Được User phê duyệt chính thức thời điểm cutover.

---

## 3. Các Thay Đổi Cần Thực Hiện
1. Cấu hình địa chỉ Move Contract Mainnet vào `NEXT_PUBLIC_CONTRACT_ADDRESS`.
2. Chuyển `NEXT_PUBLIC_APTOS_NETWORK` và `NEXT_PUBLIC_SHELBY_NETWORK` sang `"mainnet"`.
3. Nạp `OPENAI_API_KEY` và `NEXT_PUBLIC_SHELBY_API_KEY` production vào Cloudflare Secrets.
4. Cấu hình Custom Domain (DNS CNAME) trên Cloudflare Dashboard trỏ về Worker `proofvault`.
5. Tắt service container trên Railway.

---

## 4. Thứ Tự Thực Hiện Các Thao Tác (Execution Order)

```
[Bước 1: Nạp Secrets & Vars] ──> [Bước 2: Deploy Mainnet Build] ──> [Bước 3: Cấu hình DNS CNAME] ──> [Bước 4: Test Ví Thật] ──> [Bước 5: Dừng Railway]
```

1. **Bước 1 — Nạp Secrets & Biến Môi Trường:**
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler secret put NEXT_PUBLIC_SHELBY_API_KEY
   ```
   Cập nhật `wrangler.jsonc` với địa chỉ contract Move trên Mainnet:
   `NEXT_PUBLIC_CONTRACT_ADDRESS: "0x..."`, `NEXT_PUBLIC_APTOS_NETWORK: "mainnet"`.
2. **Bước 2 — Build và Deploy bản Production:**
   ```bash
   npx opennextjs-cloudflare build
   npx wrangler deploy
   ```
3. **Bước 3 — Cấu hình Custom Domain:**
   - Thêm Custom Domain trên Cloudflare Workers: `proofvault.domain.com`.
   - Cloudflare tự động cấp phát chứng chỉ SSL/TLS trong vòng 1-2 phút.
4. **Bước 4 — Kiểm thử Tương tác Thực tế:**
   - Kết nối ví Petra/Pontem trên Mainnet, upload 1 tài liệu chứng cứ mẫu nhỏ, kiểm tra giao dịch xác nhận trên Aptos Explorer và Shelby Explorer.
5. **Bước 5 — Tắt Railway Service:**
   - Dừng service `proofvault` trên Railway để tiết kiệm tài nguyên.

---

## 5. Kiểm Thử Ngay Sau Cutover (Post-Cutover Smoke Tests)
1. **Kiểm tra HTTPS & TLS:** Truy cập URL chính thức, xác nhận SSL TLS 1.3 hợp lệ.
2. **Kiểm tra UI & Assets:** Đảm bảo toàn bộ CSS Tailwind v4 và JS chunks tải từ Cloudflare Edge Cache (HTTP 200).
3. **Kiểm tra Hashing Client:** Chọn file upload, xác nhận SHA-256 được tính toán tức thì trên trình duyệt.
4. **Kiểm tra AI Audit Endpoint:** Gửi yêu cầu audit mẫu, xác nhận phản hồi trả về đúng schema `AuditReport`.

---

## 6. Tiêu Chí Xác Nhận Thành Công
- [ ] Toàn bộ người dùng truy cập domain chính thức đều được Cloudflare Workers phục vụ.
- [ ] Không có lỗi 5xx trong Cloudflare Observability logs.
- [ ] Giao dịch Move trên Aptos Mainnet được ký và ghi nhận thành công.
- [ ] File được lưu trữ và tải về toàn vẹn từ Shelby Protocol.

---

## 7. Điều Kiện Kích Hoạt Rollback
Kích hoạt rollback ngay lập tức nếu:
- Giao diện người dùng bị lỗi crash SSR liên tục (HTTP 500) trên domain chính.
- Aptos Wallet Adapter không thể kết nối hoặc giao dịch ký Move liên tục thất bại do lỗi node RPC.
- Thời gian tải trang vượt quá 10 giây.

---

## 8. Quy Trình Rollback Có Thể Thực Thi (Dưới 3 phút)
1. **Bước 1 — Trỏ lại DNS:** Chuyển bản ghi CNAME của domain trỏ về lại domain Railway: `proofvault-production.up.railway.app`.
2. **Bước 2 — Khởi động lại Railway Service:** Đảm bảo service trên Railway ở trạng thái `Online`.
3. **Bước 3 — Xác nhận lưu lượng:** Truy cập lại domain chính và kiểm tra header phản hồi để xác nhận traffic đã quay về Railway an toàn.

---

## 9. Danh Mục Secrets Cần Cấu Hình (Chỉ tên biến)
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SHELBY_API_KEY`
- `NEXT_PUBLIC_CONTRACT_ADDRESS` *(Public Var)*
- `NEXT_PUBLIC_APTOS_NETWORK` *(Public Var)*
- `NEXT_PUBLIC_SHELBY_NETWORK` *(Public Var)*

---

## 10. Chi Phí và Downtime Dự Kiến
- **Downtime dự kiến:** **0 phút** (DNS CNAME cutover qua Cloudflare Edge không gây gián đoạn kết nối người dùng).
- **Chi phí máy chủ:** **$0.00 / tháng** trên Cloudflare Workers Free Tier. Tiết kiệm 100% chi phí máy chủ web Railway (~$5 – $8/tháng).
- **Chi phí phát sinh bên ngoài:** Phí gas Aptos Mainnet cho giao dịch Move (rất thấp, < $0.001/tx) và phí token OpenAI tùy lượng người dùng audit.
