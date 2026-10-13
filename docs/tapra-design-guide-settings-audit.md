# Tapra design guide → Theme settings

Ngày: 13/10/2026. Branch: `codex/spinel-chieutt-dev`.
Nguồn: `/Users/chieutrinh/Downloads/tapra-design-guide.html`, đối chiếu trực tiếp `DEF`, `BTN_DEF`, CSS preview và CSS export trong file. Dùng giá trị mặc định trong file; không lấy các chỉnh sửa chưa export trong browser localStorage. Guide này thay thế các thông số trong bản audit cũ cho phạm vi đã cập nhật bên dưới.

## Đã triển khai

| Phạm vi | Mapping vào theme |
| --- | --- |
| Color schemes | Giữ `scheme-1`…`scheme-5`; đồng bộ Background, Heading, Text, Overlay, Border, Background bar, Component background và toàn bộ màu Primary/Secondary/Tertiary kể cả hover/alpha. Scheme 1 trắng; 2 paper; 3 navy/chữ trắng; 4 sky; 5 navy/chữ sky. |
| Text muted | Thêm color có alpha trong từng scheme → `--text-muted-color` → utility `.text-muted`. Không tự động thay màu nội dung đang có override riêng. |
| Fonts | Heading Manrope 600; Body Manrope 400; Accent Manrope 500. |
| H1–H5 desktop | 72 / 44 / 32 / 26 / 20px. |
| H1–H5 tablet | 60 / 36 / 30 / 26 / 20px. |
| H1–H5 mobile | 48 / 32 / 28 / 24 / 18px. |
| Typography | Heading dùng Normal leading 1.2 / 1.2 / 1.3 / 1.4 / 1.5 và tracking 0. Body 16px, leading 1.5; giữ scale xs→xxl 12/14/16/18/20/24px. Eyebrow 14px/500, uppercase, leading 1.5, tracking `0.12em` = 1.68px. |
| Buttons | Pill, padding ngang 28px trên cả 3 thiết bị, original case, tertiary underline. Giữ font 16px/500 và contract chiều cao desktop48/mobile44 hiện có. |
| Button hover | Thêm lift2px, duration250ms, easing `ease`, shadow Y10px/blur30px/opacity30%, spotlight bật/radius90px, icon-only nudge4px. Dùng primitive `.btn`, `theme-button` và controller `surface-light` hiện có; fast/slow override của từng nút vẫn dùng motion speed riêng. |
| Glass | Theme settings opacity55%, blur14px. Bật bằng `Use theme glass` trên Group hoặc Gallery header Group, cùng renderer `group-content`; background, border, text lấy từ scheme của Group. Tắt mặc định để giữ background/blur đã lưu. Không tự bật cho header, cart hay các Group trong template. |
| Forms | Outline, cao48/44px, pill, padding16px, textarea24px, border1px. Bỏ override nền trắng; Outline lấy Background scheme, Solid lấy Component background; border lấy Heading35%; focus dùng ink/sky qua Accent. Error dùng đỏ phù hợp scheme sáng/tối theo preview. |
| Badges | Sale đỏ `#E02B2B`, Sold out grey `#A9ADB4`, New/Bestseller trắng/chữ ink qua settings có sẵn. |

Settings mới đều có CSS/Liquid consumer; các nhãn mới nằm trong `locales/en.default.schema.json`. Renderer Group giữ contract chung với Gallery header Group. Bundle `assets/deferred-template-components.css` đã build lại bằng script của repo với esbuild có sẵn trong npm cache.

## Khác biệt và giới hạn cần biết

- Guide dùng breakpoint 760/1024px. Theme giữ các breakpoint chung 767.98/1149.98px; áp dụng cùng bộ số desktop/tablet/mobile để không tạo một hệ responsive song song.
- Guide không định nghĩa H6; giữ các giá trị H6 hiện có. Guide không định nghĩa layout/container/section padding; các phần này không thay đổi.
- Scheme 5 trước đây trong theme là nền transparent. Theo guide mới, Scheme 5 có nền navy opaque. Các section đang chọn scheme này sẽ nhận nền mới ở nơi đang kế thừa.
- Glass là chế độ riêng của Group, không thay thế setting blur cục bộ khi chế độ này tắt. Các mặt kính header/cart/lookbook của demo cần integration riêng tại component tương ứng; không coi việc có global controls là đã triển khai những layout đó.
- Hover shadow lấy Accent của scheme (ink trên nền sáng, sky trên nền tối); preview guide lấy navy/sky. Spotlight dùng màu hover background của nút để tiếp tục phản ứng với màu merchant chọn; guide dùng sky cho Primary và trắng cho Secondary. Đây là mapping có chủ ý vào hệ màu theme, không phải bản sao mọi chi tiết demo.
- Chiều cao nút mobile44px, focus offset3px và contract textarea hiện có được giữ; guide preview dùng nút48px, focus offset2px và textarea min-height2.5×field height. Không nhập CSS demo đè lên toàn bộ primitive hiện có.
- New/Bestseller trong guide có ngoại lệ nền transparent ở Scheme1. Theme badges hiện có màu global; giữ mapping global, chưa thêm điều kiện màu theo scheme.
- Sold out trắng trên grey trong guide có contrast thấp (~2.27:1). Giá trị guide đã được giữ để khớp reference; đây là phát hiện P2 của chính guide, không thể kết luận toàn bộ palette đạt AA. Glass contrast phụ thuộc ảnh phía sau, chưa xác nhận trực quan.
- Section/Block có màu, kích thước chữ hoặc CSS override riêng vẫn ưu tiên cấu hình của chúng; cập nhật Theme settings không tự di chuyển các override đó.

## Validation

- PASS: JSON hợp lệ; saved ranges trong schema; ID được giữ; alpha được giữ.
- PASS: 13/13 test của `tapra-design-guide`, `group-wrap`, `heading-scale-sync`, `radius-presets`. Test mới render Liquid thực tế, kiểm tra typography/alpha, giá trị zero và glass opt-in.
- PASS: `node --check assets/surface-light.js`; `git diff --check`; build CSS bundle.
- PASS WITH FOLLOW-UPS: Shopify Theme Check 0 error, 45 warning. Group/Gallery header vẫn vượt ngưỡng khuyến nghị 40 settings (46 sau bổ sung); CSS variables vẫn có cảnh báo complexity. Không thay cấu trúc các primitive ngoài phạm vi để xử lý cảnh báo cũ.
- Baseline: 4 test trong `theme-settings`/`heading-size-sync` đã fail ở HEAD trước thay đổi: selector scheme đã cũ, footer fixture đã cũ, LiquidJS chưa hỗ trợ `content_for` của thumbnail. Failure mới do Group thiếu peer setting đã sửa; `group-wrap` hiện PASS.
- NOT TESTED: Theme Editor save/reload, visual storefront responsive/keyboard/hover/glass. Browser tool từ chối URL `file://` theo policy; không dùng workaround. Không upload/publish theme trong đợt này.

Overall: PASS WITH FOLLOW-UPS cho implementation local; chưa xác nhận visual runtime hoặc release.
