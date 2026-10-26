# Chạy thử với Netlify, Neon và Supabase Storage

Code hỗ trợ PostgreSQL online, Supabase Storage qua giao thức S3 và một origin
riêng cho chat. Chưa tạo tài khoản dịch vụ hoặc deploy trong lần thay đổi này.
Chọn đúng gói Free và theo dõi quota; dịch vụ miễn phí có thể tạm dừng khi hết
hạn mức. Không coi hosting miễn phí là cam kết chạy liên tục không giới hạn.

## 1. Tạo các dịch vụ

- Tạo project website trên Netlify Free và ghi lại origin HTTPS, ví dụ
  `https://thanhphong-test.netlify.app`.
- Tạo PostgreSQL riêng trên Neon Free. Dùng URL pooled có `sslmode=require` cho
  `DATABASE_URL`; có thể đặt URL direct trong `DATABASE_MIGRATION_URL` để migrate.
- Tạo project Supabase Free, bucket `website-media` với quyền đọc công khai.
  Chỉ đưa ảnh website vào bucket. Không thêm policy cho phép khách ghi/xóa ảnh.
  Tạo S3 Access Key trong cấu hình Storage, lấy đúng endpoint và region của
  project. Đây là S3 access key, không phải anon key hoặc JWT service role.
- Tạo Turnstile cho hostname website và lấy cặp site key/secret thật.

## 2. Tạo host chat tĩnh riêng

Không nhúng trực tiếp trang Direct Chat Link: nhà cung cấp có thể chặn trang đó
trong iframe. Host tĩnh này chạy SDK nhúng chính thức của tawk.to trên origin
riêng, vẫn giữ khung chat trong website. Host không chứa mật khẩu, database hay
API quản trị. Widget ID là thông tin công khai.

Với Node `22.23.4` và các dependency trong lockfile đã được cài:

```powershell
$env:SERVER_URL = 'https://thanhphong-test.netlify.app'
npm run build:chat
Remove-Item Env:SERVER_URL
```

Upload thư mục `out-chat` lên một project **static** Netlify Free bằng chức năng
deploy thủ công. Ghi lại origin, ví dụ `https://thanhphong-chat-test.netlify.app`.
Phải giữ cả file `_headers` trong thư mục deploy. Nó chỉ cho phép website đã cấu
hình nhúng host chat. Khi đổi domain website, build và deploy lại host chat.

## 3. Cấu hình website trên Netlify

Đặt các biến trong Environment variables, cho cả build và Functions. Không
commit file môi trường, không gửi secret qua chat.

| Biến                     | Giá trị                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `SERVER_URL`             | Origin HTTPS của website                                             |
| `CHAT_FRAME_ORIGIN`      | Origin HTTPS của host chat, khác origin website                      |
| `DATABASE_URL`           | URL PostgreSQL có TLS                                                |
| `DATABASE_MIGRATION_URL` | URL direct cho migration, nếu có                                     |
| `PAYLOAD_SECRET`         | Secret ngẫu nhiên mới, tối thiểu 48 ký tự                            |
| `S3_ENDPOINT`            | `https://PROJECT.storage.supabase.co/storage/v1/s3`                  |
| `S3_REGION`              | Region lấy từ cấu hình S3 của Supabase                               |
| `S3_BUCKET`              | `website-media`                                                      |
| `S3_ACCESS_KEY_ID`       | S3 Access Key ID, chỉ ở máy chủ                                      |
| `S3_SECRET_ACCESS_KEY`   | S3 Secret Access Key, chỉ ở máy chủ                                  |
| `MEDIA_PUBLIC_URL`       | `https://PROJECT.supabase.co/storage/v1/object/public/website-media` |
| `TURNSTILE_SITE_KEY`     | Site key thật của hostname website                                   |
| `TURNSTILE_SECRET_KEY`   | Secret key tương ứng                                                 |

Không đặt đồng thời `S3_*` và `R2_*`. Các cài đặt R2 cũ vẫn được hỗ trợ nếu chưa
chuyển sang Supabase. Local không có cấu hình cloud vẫn lưu ảnh trong `var/media`.
Dữ liệu và ảnh local chưa được tự động chuyển lên online.

Trong admin, giữ Direct Chat Link của tawk.to như trước. Code chuyển widget này
qua host chat riêng. Khi production thiếu `CHAT_FRAME_ORIGIN`, endpoint nhúng
không chạy SDK trên origin ứng dụng; kiểm tra build Netlify cũng từ chối cấu hình.
Local `next dev` vẫn sử dụng cơ chế chat cũ để không gián đoạn công việc.

## 4. Khởi tạo database trước deploy

Tạo `.env.deploy.local` được Git bỏ qua, chứa cấu hình bản thử ở trên, thêm
`OWNER_EMAIL` và `OWNER_PASSWORD` mới dài ít nhất 12 ký tự. Kiểm tra kỹ URL trỏ
đúng database bản thử, sau đó:

```powershell
$env:ENV_FILE = '.env.deploy.local'
$env:NODE_ENV = 'production'
try {
  npm run db:migrate
  if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
  npm run db:init
  if ($LASTEXITCODE -ne 0) { throw 'Initialization failed' }
} finally {
  Remove-Item Env:ENV_FILE
  Remove-Item Env:NODE_ENV
}
```

Migration là bước riêng. Build không tự migrate. Tài khoản và nội dung local
không tự xuất hiện trong database mới. Dùng dữ liệu giả cho bản thử.

## 5. Deploy và xác minh

Netlify website dùng `npm run build:netlify`, publish `.next`, Node `22.23.4`.
Sau deploy, xác minh HTTPS, cookie Secure/HttpOnly, quyền owner/editor, đăng xuất
và đổi tài khoản giữa nhiều tab, upload/đọc ảnh Supabase, form Turnstile thật,
khung chat và gửi/nhận tin giữa khách thử và người phụ trách.

Bật MFA trên GitHub, Netlify và tài khoản tawk.to. Admin tùy biến chưa có MFA.
Tin nhắn được xử lý ở tawk.to, không phải database của website; quota form không
giới hạn được spam chat. Cấu hình chống spam và phân quyền nhân viên tại tawk.to.
Kiểm tra bản deploy có gắn hai edge rule trong `netlify/edge-functions`.

SMTP và scheduler xử lý hàng đợi là cấu hình bổ sung nếu cần thông báo email.
Chuẩn bị sao lưu database, theo dõi quota và lịch dọn rate limit trước khi dùng
cho khách thật. Bộ test local mô phỏng dịch vụ bên ngoài, không thay thế việc
kiểm tra kết nối Supabase, Turnstile và tawk.to thật trên domain bản thử.
