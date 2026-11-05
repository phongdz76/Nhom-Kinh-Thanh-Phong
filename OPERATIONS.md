# Vận hành Thanh Phong

## Bản local trước khi phát hành

Kiểm tra bản local trước khi đẩy lên Git và triển khai. File cấu hình bí mật chỉ
lưu local hoặc trên dịch vụ hosting, không đưa vào commit.

Trên Windows x64, cài PostgreSQL riêng cho dự án để không phụ thuộc Docker/WSL:

```powershell
npm run db:install-native
npm run setup
npm run dev
```

Bộ cài có phiên bản và SHA-512 cố định, nằm ở `var/tools/postgres`, không cài dịch
vụ Windows. Dữ liệu native nằm trong `var/postgres-native`. Chỉ nghe trên
`127.0.0.1:55432`. Nếu database trên cổng này đang chạy, ứng dụng dùng database
đó và không dừng nó. Nếu chưa có database native, lần đầu sẽ tạo database và
chạy migration/khởi tạo tài khoản từ cấu hình local đang có.

Database Docker và native là hai bộ dữ liệu riêng. Bộ cài không xóa/chuyển dữ
liệu Docker. Dùng backup để chuyển dữ liệu nếu cần; không xóa VHDX hay unregister
WSL. Chạy `npm run db:stop-native` để dừng riêng PostgreSQL native của dự án.
Khởi động Windows/Docker vẫn cần nâng Windows lên phiên bản được Docker hỗ trợ;
thay đổi này tránh phụ thuộc WSL khi phát triển, không sửa hệ điều hành.

## Gmail thông báo yêu cầu

Thông tin Gmail đã lưu riêng trong `.env.notifications.local` (Git bỏ qua).
Import nội dung file này vào **Netlify của website chính → Environment variables**,
chọn secret, context Production, scopes Builds/Functions. Không import vào site chat.
Sau đó deploy bản code mới để bật scheduled function `maintenance` mỗi 5 phút.

Các biến: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`,
`LEAD_NOTIFICATION_EMAIL`. Gmail dùng `smtp.gmail.com`, cổng 465 và mật khẩu
ứng dụng. Không dùng mật khẩu đăng nhập Google thường. Đợt này chỉ xác thực SMTP,
không gửi email thử. Nội dung email thật chỉ chứa mã yêu cầu và đường dẫn admin.

Scheduled function dùng khóa PostgreSQL để tránh chạy trùng, xử lý tối đa 2 job
mỗi lượt và dọn tối đa 1000 bộ đếm hết hạn. Chưa cấu hình SMTP thì giữ nguyên hàng
đợi. Lỗi gửi không xóa yêu cầu; kiểm tra `notificationState` trong admin. Đừng bật
thêm worker khác nếu không cần. Có thể tăng tần suất/số job sau khi đo lưu lượng
và thời gian thực thi.

## Backup có mã hóa và kiểm tra khôi phục

Khóa backup lưu trong `.env.backup.local`; đây là khóa mới chỉ dùng backup.
Giữ bản sao khóa ở nơi an toàn độc lập với máy và các file backup. Mất khóa thì
không giải mã được. Không tải file khóa hoặc backup lên thư viện ảnh public.

```powershell
# Tạo snapshot của database và mọi object trong bucket nguồn.
$env:ENV_FILE = '.env.netlify.local'
npm run backup:create
Remove-Item Env:ENV_FILE

# Thay RUN bằng thư mục của bản vừa tạo.
npm run backup:verify -- var/backups/RUN
npm run backup:restore-check -- var/backups/RUN
```

Mỗi file được mã hóa AES-256-GCM với nonce ngẫu nhiên riêng. Manifest cũng mã hóa,
chứa SHA-256 và kích thước plaintext; chỉ ghi khi snapshot DB và sao chép object
đã xong. Lệnh verify kiểm tra xác thực và checksum mọi file. Lệnh restore-check
chỉ chấp nhận PostgreSQL loopback cổng 55432, tạo database tên ngẫu nhiên, khôi
phục snapshot, kiểm tra tham chiếu ảnh rồi xóa đúng database thử vừa tạo. Không
cho phép ghi đè database ứng dụng/production. Ảnh tĩnh `public/images` nằm trong
Git; backup object storage không thay thế bản lưu mã nguồn/release tương ứng.

Cần `pg_dump`/`pg_restore` phiên bản ít nhất bằng server (hoặc Docker với image
PostgreSQL 18). Có thể đặt `PG_DUMP_PATH` và `PG_RESTORE_PATH` trỏ tới bộ client
đã cài. Công cụ native tối giản ở trên chỉ chứa server/initdb/pg_ctl; backup sẽ
dùng Docker nếu chưa cài client riêng. Mật khẩu DB chỉ truyền qua môi trường,
không đưa vào dòng lệnh hoặc log. Backup lưu trong `var/backups`, không vào Git.
Lưu local chưa bảo vệ trước mất máy; cần bản sao độc lập.

### Bật backup ngoài máy hàng ngày

Tạo bucket **private riêng**, ưu tiên tài khoản/lưu trữ độc lập với bucket website.
Đặt thêm `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`,
`BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`. Khi đủ cấu hình, lệnh
backup tự copy bộ file đã mã hóa và manifest cuối cùng lên đích. Cấu hình quyền
bucket tại nhà cung cấp; script không tự đổi quyền bucket. Không tự xóa backup
cũ; đặt retention/lifecycle theo nhu cầu lưu trữ sau khi thử restore.

Workflow `.github/workflows/backup.yml` đã chuẩn bị lịch 03:00 giờ Việt Nam,
nhưng chưa bật khi chưa có nơi lưu độc lập. Trong GitHub Environment
`production-backup`, khai báo secrets/variables đúng tên trong workflow, cùng
khóa giải mã đã lưu. Chạy thủ công trước, xác nhận file ở đích và thử restore,
rồi đặt repository variable `BACKUPS_ENABLED=true`. Workflow không upload dữ
liệu/khóa thành Actions artifacts. Kiểm tra kết quả job hàng ngày.

## SEO và GEO

Trang công khai production có canonical, mô tả, Open Graph, Twitter metadata;
`/robots.txt`, `/sitemap.xml` lấy nội dung đã xuất bản từ database. Admin/API luôn
noindex, local và deploy preview không lập chỉ mục. Đặt
`SITE_INDEXING_ENABLED=false` nếu muốn giữ bản thử production ngoài tìm kiếm.

Dữ liệu có cấu trúc chỉ dùng thông tin đang có. Khi cơ sở vẫn đánh dấu demo,
không công bố địa chỉ/số điện thoại mẫu thành thông tin LocalBusiness. Không tự
bịa đánh giá, giá, giờ mở cửa hoặc địa bàn phục vụ. Chủ cơ sở cần kiểm tra thông
tin liên hệ và thay nội dung mẫu trước khi quảng bá rộng rãi.

Sau phát hành, xác minh quyền sở hữu trong Google Search Console và Bing
Webmaster Tools, gửi sitemap của tên miền chính. Tạo/xác minh Google Business
Profile bằng thông tin thật nếu đủ điều kiện. Các thao tác cần tài khoản chủ sở
hữu chưa được thực hiện tự động. Metadata/schema giúp máy tìm kiếm hiểu nội dung,
không đảm bảo thứ hạng hoặc được nền tảng AI trích dẫn.

## Deploy chỉ sau CI

Lệnh `build:netlify` kiểm tra job `Verify application` thuộc workflow `ci.yml`,
đúng SHA/nhánh và lần chạy hiện tại. CI thất bại, bị hủy, bị skip, API không truy
cập được hoặc chờ hơn 10 phút thì không build release. Next build local không
gọi API GitHub. Không cần thêm token cho repository public hiện tại. Nếu đổi repo
sang private, phải thay cơ chế xác minh bằng credential đọc trạng thái trước
khi deploy; không bỏ bước kiểm tra.

Khi thay schema, tạo/review migration, backup và chạy `npm run db:migrate` bằng
cấu hình phù hợp trước khi deploy thay đổi phụ thuộc schema. CI/deploy không tự
migrate production. Đợt này không đổi schema. Thử rollback trên staging trước
các migration lớn.

## Cảnh báo dependency còn theo dõi

`deepmerge@4.3.1`: GHSA-gcqx-w48m-w2h4, upstream chưa có bản vá tại thời điểm
kiểm tra. Không ép downgrade Payload để làm mất cảnh báo audit. CI vẫn chặn
advisory mức moderate trở lên; bản vá tương thích cần chạy đủ kiểm thử trước khi
áp dụng. Theo dõi https://github.com/advisories/GHSA-gcqx-w48m-w2h4.
