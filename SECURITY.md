# Chuẩn bị chống spam và DDoS trước khi triển khai

Website hiện chưa triển khai. Các thay đổi này chuẩn bị lớp bảo vệ trong mã.
Kiểm tra chức năng trước khi merge được thực hiện trên bản cài sạch và cơ sở dữ
liệu test riêng; việc này không thay thế kiểm toán bảo mật hay xác nhận lớp chống
DDoS của nhà cung cấp. Cấu hình Cloudflare/Netlify production vẫn cần thực hiện
theo hostname, tài khoản và môi trường triển khai thực tế.

## Việc cần làm theo thứ tự

1. Chọn nơi chạy và tên miền chính. Dùng Node `22.23.4` và `npm ci` theo lockfile
   trong môi trường build tin cậy. Không dùng bản node_modules cũ để xác nhận
   các phiên bản phụ thuộc vừa nâng cấp.
2. Tạo widget Cloudflare Turnstile cho đúng hostname, rồi đặt `TURNSTILE_SITE_KEY`
   và `TURNSTILE_SECRET_KEY` vào môi trường máy chủ. Đặt `SERVER_URL` bằng origin
   chính thức. Không dùng khóa dummy của Cloudflare trong bản phát hành; kiểm tra
   production từ chối các khóa test này. Secret không dùng tiền tố NEXT_PUBLIC;
   site key được cung cấp qua
   API cấu hình công khai. Khóa cần có trong môi trường build và runtime tương ứng.
3. Với Netlify, chạy kiểm tra cấu hình bằng `npm run check:production`; lệnh
   `npm run build:netlify` đã nối kiểm tra này trước build. Kiểm tra cả cấu hình
   PostgreSQL/TLS, PAYLOAD_SECRET và R2 mà bộ kiểm tra hiện hành yêu cầu. Migration
   cơ sở dữ liệu là thao tác riêng, không tự động chạy trong build mới này.
4. Chuẩn bị môi trường test cô lập, chạy các kiểm tra bên dưới và xem kết quả trước
   khi triển khai. Sau deploy, người vận hành xác nhận hai rule edge thật sự được
   gắn vào site, HTTPS/canonical hostname hoạt động và header IP đúng từ ingress.
5. Thiết lập lịch dọn counter và kiểm tra chỉ số 403/408/413/429/503, số lead/job
   được tạo, dung lượng DB, tài nguyên và hạn mức sử dụng của nhà cung cấp.
6. Cấu hình chống spam riêng trong tawk.to trước khi bật chat công khai.

## Lớp bảo vệ trong mã

| Lớp                     | Hành vi                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Netlify edge            | Giữ hai rule: API 120 yêu cầu/phút; trang động 300 yêu cầu/phút, theo IP + domain. Kiểm tra method, Origin, Content-Type và dung lượng khai báo trước khi tới ứng dụng.                                                                                                                                                             |
| API theo IP đáng tin    | Form tối đa 3 lần/phút và 10 lần/15 phút. Áp dụng cả URL mã hóa tương đương. Chỉ tin IP ingress Netlify khi NETLIFY=true; không lấy X-Forwarded-For do khách tự chọn.                                                                                                                                                               |
| Xác minh form           | Turnstile được kiểm tra ở máy chủ, bắt buộc đúng hostname và action `consultation`; token quá dài, thiếu, sai hoặc lỗi provider không tạo lead. Production luôn yêu cầu cấu hình, không tự bỏ xác minh khi thiếu key.                                                                                                               |
| Chống bot cơ bản        | Form có ô website bẫy bot thực sự, ngoài luồng tab và công cụ đọc màn hình; máy chủ vẫn kiểm tra schema. Frontend chặn nhiều lần bấm gửi đang chờ.                                                                                                                                                                                  |
| Ngân sách toàn hệ thống | Tối đa 180 lần xác minh/phút; mỗi process chỉ giữ tối đa 8 xác minh đồng thời, timeout 5 giây và không xếp hàng thêm. Giới hạn process không phải quota phân tán. Sau xác minh và kiểm tra sản phẩm: tối đa 60 yêu cầu/phút và 300/giờ trên toàn site. Đây là ngân sách cố định cho cơ sở nhỏ, cần điều chỉnh theo số liệu thực tế. |
| Gửi lặp                 | Cùng nội dung có khoảng chờ 60 giây; cùng số điện thoại tối đa 5 lần/giờ. Counter tính lần được nhận vào bước xử lý, kể cả lỗi ghi DB sau đó; không bảo đảm chống mọi hình thức spam thủ công.                                                                                                                                      |
| Retry an toàn           | Cùng idempotency key và nội dung đã lưu trả lại mã cũ, không cần token mới và không tạo thêm lead/event/job. Hai request đồng thời có thể nhận 429; sau khi request đầu lưu xong, retry cùng key trả mã cũ.                                                                                                                         |
| Dữ liệu gửi chậm/lớn    | Body JSON có deadline tổng 10 giây; upload có 30 giây và giới hạn byte/pixel hiện hành. Có hủy reader khi abort/quá hạn. Các chunk rất nhỏ được đóng gói vào block giới hạn, không tích lũy một object cho từng byte.                                                                                                               |
| Thông báo email         | Chỉ queue sau khi lead được lưu qua các bước trên. Nội dung gửi tới người phụ trách chỉ chứa mã/liên kết. Retry SMTP vẫn có thể gửi lặp sau sự cố, không phải hợp đồng exactly-once.                                                                                                                                                |

Cloudflare yêu cầu xác minh token ở máy chủ; token dùng một lần và hết hạn sau
5 phút. Ứng dụng không lưu token trong hồ sơ khách hàng và không cache kết quả
Siteverify theo khóa do khách chọn. Sau mỗi lần gửi, giao diện lấy token mới;
retry của bản ghi đã lưu được giải quyết bằng idempotency của ứng dụng.
[Tài liệu xác minh Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Trong development, nếu chưa cấu hình cả hai key thì widget không được yêu cầu.
Cấu hình một phần sẽ báo chưa sẵn sàng. Điều này không tắt yêu cầu CAPTCHA trong
production. CSP đã cho phép frame của Turnstile; script được truyền nonce của
trang theo [hướng dẫn CSP của Cloudflare](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).

## Chống DDoS ở nơi triển khai

Rate limit trong ứng dụng không hấp thụ được tấn công làm nghẽn đường truyền.
Với Netlify, có lớp chống DDoS mặc định của nền tảng; cần xác nhận rule của bản
deploy và theo dõi hạn mức/tài nguyên. Rate limit của Netlify có thể trễ tới 10 giây
sau khi vượt ngưỡng; hai rule trong mã phù hợp giới hạn hai rule của gói Free,
không giả định đã có thêm WAF hoặc rule theo UI.
[Bảo vệ nền tảng](https://docs.netlify.com/manage/security/secure-access-to-sites/overview/),
[rate limit và cách xác nhận rule](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).

Nếu chọn VPS/Docker, đặt CDN/WAF hoặc dịch vụ chống DDoS trước origin, dùng TLS
và firewall origin theo kiến trúc proxy thực tế. Phải cấu hình danh tính IP theo
ingress được kiểm soát; không đặt NETLIFY=true để giả lập proxy và không tin tùy
ý các header forwarding. Lớp IP hiện tại không tự hỗ trợ mọi reverse proxy VPS.
Đây là phần cần hoàn thiện theo nền tảng đã chọn, không có cấu hình firewall/DNS
thật nào được đổi trong phiên làm việc này.

## Dọn bộ đếm

`npm run security:cleanup` xóa tối đa 1000 counter mỗi lượt, chỉ những counter
đã hết hạn hơn một giờ. Query dùng khóa SKIP LOCKED và kiểm tra lại điều kiện hết
hạn; không xóa lead hoặc dữ liệu liên hệ. `jobs:run` cũng dọn trước khi xử lý email,
kể cả lúc chưa bật SMTP; worker hiện có gọi lượt chạy mỗi phút.
Nếu dọn counter lỗi, worker ghi thông báo chung và vẫn xử lý thông báo email;
lệnh dọn riêng trả exit code lỗi để hệ thống giám sát phát hiện.

Với môi trường serverless, cần lịch tác vụ riêng chạy từ worker tin cậy hoặc cơ
chế scheduler của nơi triển khai. Không mở endpoint công khai để chạy job đặc
quyền. Theo dõi số counter mới và số xóa để đặt lịch phù hợp.

## Tin nhắn chat tawk.to

Tin nhắn chat đi trực tiếp tới tawk.to. Rule API, CAPTCHA của form và quota email
ở đây không giới hạn được API của nhà cung cấp chat hoặc liên hệ qua Zalo.

- Bật Pre-Chat Form với thông tin liên hệ cần thiết. Đây là bước thu thập thông
  tin trước chat, không phải bằng chứng sở hữu số điện thoại hay CAPTCHA.
- Dùng Ban List/ban IP với nguồn spam đã xác định. Xem xét ảnh hưởng tới người
  dùng dùng chung IP; không giả định IP ban chặn được bot đổi IP.
- Theo dõi Inbox/Spam, hạn chế thông báo hoặc trả lời tự động không cần thiết.
  Nếu còn spam lớn, làm việc với tawk.to về biện pháp ở phía dịch vụ.

[Pre-Chat Form](https://help.tawk.to/article/using-the-pre-chat-form),
[chặn người gửi](https://help.tawk.to/article/banning-a-visitor).

## Xác minh trước phát hành

Các test mới bao gồm token sai hostname/action, bẫy bot, quota gửi dồn, gửi trùng,
retry đã lưu, body quá lớn/chờ vô hạn/abort và ghép chunk.

Trong môi trường test riêng với database/tài khoản giả, chạy `npm run check`,
`npm run test:setup`, build với `NEXT_DIST_DIR=.next-verify` và Playwright.
Playwright có fixture riêng mô phỏng script và Siteverify; không gọi Cloudflare
thật. Fixture được nạp rõ ràng chỉ cho server con của Playwright, từ thư mục tests;
không có biến môi trường bypass trong mã production. Fixture chỉ kiểm thử luồng
ứng dụng, không xác minh thuật toán/khả năng chống bot hay tính dùng một lần của
Cloudflare. Phải kiểm tra cấu hình widget thật trong môi trường thử được quản lý
trước khi phát hành; không dùng fixture test làm cấu hình production.

Đợt xác minh ngày 26/10/2026: `npm run check` đạt (lint, định dạng, kiến trúc,
TypeScript và 45 unit test). Bản cài sạch đã chạy migration/seed trên database
`thanhphong_test` và build production thành công với Node `22.23.4`, Next.js
`16.4.3`, Payload `3.92.0`. `npm audit --audit-level=moderate` không còn cảnh báo
tại thời điểm kiểm tra. Override `esbuild` chỉ áp dụng cho nhánh phụ thuộc cũ
`@esbuild-kit/core-utils`; migration được kiểm tra để xác nhận tương thích.
CI sạch trên Linux đã đạt toàn bộ cài đặt, quét secret/lịch sử Git, audit,
`npm run check`, chuẩn bị database test, build và Playwright cho commit
`aa0f745`. Bộ trình duyệt gồm 34 test về API, đăng nhập/phân quyền, form, upload,
chat, quản trị, bản đồ và điều hướng.
[Kết quả CI ngày 26/10/2026](https://github.com/phongdz76/Nhom-Kinh-Thanh-Phong/actions/runs/40330598498).

File môi trường, khóa dịch vụ, dữ liệu/media cục bộ, log, cache, build, trace và
báo cáo test được giữ ngoài Git. CI tạo riêng tài khoản và khóa test tạm thời;
không tải artifact chứa credentials hoặc dữ liệu khách hàng lên GitHub.

## Bổ sung trước bản chạy thử

Luồng admin hiện thay toàn bộ snapshot khi làm mới, xóa dữ liệu riêng khi mất
phiên và bỏ các phản hồi cũ sau khi phiên thay đổi. Đăng nhập/đăng xuất dùng điều
hướng toàn trang; BroadcastChannel chỉ truyền tín hiệu thay đổi phiên giữa các
tab, không truyền token hoặc dữ liệu khách. Tab được khôi phục từ bộ nhớ trình
duyệt kiểm tra lại phiên. Login, logout và đổi mật khẩu được tuần tự hóa theo
tài khoản bằng advisory lock trong PostgreSQL để tránh ghi đè danh sách phiên.

Chat production dùng `CHAT_FRAME_ORIGIN` riêng với SDK nhúng tawk.to. Website
kiểm tra cả origin và cửa sổ gửi postMessage; iframe có sandbox. Endpoint nhúng
cũ chỉ phục vụ HTML ở development, chuyển hướng tới host riêng khi đã cấu hình,
và từ chối chạy SDK cùng origin trong production khi thiếu cấu hình. Host tĩnh
được tạo bằng `npm run build:chat`; phải deploy cả `_headers` để giới hạn origin
được phép nhúng. Local development giữ cơ chế cũ để tiếp tục kiểm tra widget.

Lưu ảnh hỗ trợ Supabase Storage qua `S3_*`, giữ khóa ở máy chủ. Migration
`20261026_163958_cloud_media` thêm cột metadata `_objectkey` mà adapter cloud cần;
không đổi dữ liệu ảnh đang lưu. Cần chạy migration trước khi dùng bản mới.

Các kiểm thử hồi quy bổ sung ở `tests/session.spec.ts`, `tests/storage.spec.ts`
và `tests/chat.spec.ts` kiểm tra đổi tài khoản, hết phiên, đăng xuất nhiều tab,
phản hồi cũ, phiên đồng thời, upload cloud giả lập và ranh giới origin của chat.
Tài khoản admin tùy biến chưa có MFA. Cấu hình dịch vụ thật, gửi/nhận tin chat và
upload Supabase trên domain triển khai vẫn phải xác minh khi có tài khoản/khóa.
Xem [hướng dẫn triển khai](DEPLOYMENT.md).
