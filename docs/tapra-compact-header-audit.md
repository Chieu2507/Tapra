# Tapra header — Classic / Compact

Nguồn: `/Users/chieutrinh/Downloads/Tapra_demo3_shatter-hero.html`. Ngày 12/10/2026.

## Bản thử đã triển khai

Đã thêm Header style (Classic/Compact), default Classic để tương thích, và bật Compact cho draft Tapra/main. Dùng lại `_header-top`, logo, cart, menu toggle, menu/link-list/mega-menu và các tiện ích; không thêm Theme Block mới. Compact giữ scheme1 và logo Pawvera đã cấu hình, không copy dữ liệu cart giả, menu tĩnh hay glow/countdown từ demo.

Renderer Classic giữ code cũ và dữ liệu block; Single row/Two rows, sticky và transparent controls được giữ nguyên và ẩn khi không phù hợp Compact. Compact nổi16px, width236px khi đóng và tối đa900px khi mở. Homepage overlap được xác định theo mode, không đổi saved setting overlay của Classic. Menu dùng ThemeOverlay và lifecycle menu hiện có; desktop sắp hai vùng category/submenu và mobile dùng Back. Panel có scroll giới hạn viewport, utility blocks chuyển vào panel, có CSS reduced-motion/no-JS fallback.

QA bản thử: Theme Check0 errors/44 warning baseline; JS syntax và diff check PASS. Preview kiểm tra390/767/768/1149/1150/1440px không root overflow ngang. Open/close, submenu, Back, Escape/return focus, outside click và mở cart thật PASS. Đã chọn Classic rồi Compact trong Theme Editor, xác nhận renderer chuyển và Single row/Two rows hiện lại khi Classic. Không save cấu hình test khác. Full no-JS/reduced-motion runtime, long/empty menu, full commerce, tất cả block-select/hide/reorder và locale variants NOT TESTED. Bản thử cần tiếp tục QA khi người dùng chốt hướng visual; không coi đây là release gate toàn theme.

Các phần dưới đây là audit/plan ban đầu; trạng thái “chưa triển khai” trong phần đó áp dụng tại thời điểm audit trước bản thử.

Phạm vi hiện tại: ẩn announcement bằng `disabled: true` trong header-group, giữ dữ liệu để bật lại. Audit source demo và code header Tapra. Chưa triển khai Compact, chưa xác nhận render/tương tác của demo gốc.

## Header trong demo

Đây là navigation `nav#nav.hd`, không phải `header.sh-hero` (hero canvas) hay `header.cp-h` (đầu cart drawer).

| Thành phần | Thông số / hành vi đọc được từ source |
|---|---|
| Vị trí | Fixed, giữa màn hình, top16px + safe-area |
| Đóng | Pill236×48px, radius24px; logo, cart badge, menu toggle |
| Mở | Width min(900px, viewport−24px), radius26px; bar64px; chiều cao =64px + chiều cao body |
| Surface | Nền rgba(3,8,22,.9), blur16px, border trắng10%, shadow0 12px 40px rgba(0,0,0,.38) |
| Desktop menu | Cột danh mục210px, cột panel còn lại, gap28px; chọn bằng hover/focus/click |
| Submenu | Danh mục cấp1 → nhóm cấp2 → link cấp3; panel có 3–4 cột và một featured card |
| Mobile | Demo dùng ≤720px: drill-down; ẩn danh mục khi vào submenu, có nút Back; submenu2 cột |
| Mở/đóng | Width/height/radius600ms, easing cubic-bezier(.76,0,.24,1); đổi panel height350ms |
| Đóng | Menu toggle, click ngoài, click link, Escape; Escape trả focus về opener |
| Menu/cart | Loại trừ nhau: mở menu đóng cart và ngược lại |
| Trang trí | Glow theo pointer, text footer và countdown launch |

## Mapping vào theme hiện có

Theme hiện có `sections/header.liquid`, static `_header-top`, `_header-two-row`, `_header-bottom`, các block logo/menu/search/account/cart/localization. `assets/header.js` quản lý bố cục/sticky/submenu/menu drawer và liên kết `ThemeOverlay`. Cart có controller riêng.

Đề xuất một setting mới tại section Header:

```text
Header style
  Classic (default)
  Compact
```

Giữ các ID/label hiện có. `layout=single_row/two_rows` vẫn là cấu hình số hàng bên trong Classic, không chuyển thành nghĩa Classic/Compact và không đổi tên các option đã lưu. Nếu header hiện chưa có `header_style`, coi là Classic để giữ tương thích.

### Classic

Giữ renderer, dữ liệu block, Single row/Two rows, sticky, overlay và toàn bộ control hiện có. Đổi qua lại không xóa cấu hình Classic.

### Compact

- Shell pill nổi, đóng gọn và mở thành panel trong cùng Header section; không tạo thêm Header section và không dùng CSS template để giả lập.
- Closed bar mặc định: logo → cart → menu toggle. Panel chứa navigation và các tiện ích đang có (search/account/localization) nếu được cấu hình. Không bỏ dữ liệu của các block khi đổi style.
- Menu lấy từ link-list đang chọn trong `_header-menu`; giữ link thật, ba cấp và cấu hình mega-menu tương thích. Không hard-code Shop/Collections/Journal/Support trong demo.
- Dùng logo và cart badge hiện có. Không tự đổi logo Pawvera thành chữ Tapra chỉ vì demo.
- Dùng color scheme section hiện có. Scheme3 phù hợp appearance tối của demo, nhưng không hard-code màu trắng/navy trong mọi scheme. Giữ token typography/icon/focus; shadow/blur chỉ thuộc Compact shell.
- Đóng dùng236px làm kích thước tham khảo, phải phù hợp logo/action thực tế và viewport; logo bị giới hạn chiều rộng hoặc elide theo contract. Không ép nội dung merchant vào width quá nhỏ.
- Mở giới hạn900px và gutter12px mỗi bên; panel có max-height theo viewport và scroll nội bộ khi menu dài.
- Floating shell luôn có thể mở. Classic vẫn dùng Sticky setting hiện tại; các control chỉ có ý nghĩa cho Classic được ẩn ở Compact, giữ saved values.
- Homepage có thể nổi trên Slideshow; ở các trang resource phải có khoảng trống đầu nội dung để không che title/breadcrumb. Việc overlay không được áp bằng margin âm cho toàn bộ trang.
- Dùng mobile boundary767.98px và tablet768–1149.98px của theme. Không đưa breakpoint720px của demo thành device band mới. Panel tablet/wide cần giảm số cột theo không gian nội bộ.
- Desktop: click mở shell; hover/focus/click để chọn category. Mobile: category → submenu → Back. Category có URL cần giữ đường dẫn riêng khỏi nút mở submenu.
- Menu dùng một nguồn dữ liệu; renderer khác được giới hạn theo mode/breakpoint và không tạo ID trùng hoặc một bản menu ẩn vẫn focusable.

Đợt đầu chỉ cần selector style và các control hiện có. Countdown, featured promotional card, tagline và pointer glow là phần phụ riêng; chưa thêm controls hoặc nội dung này khi triển khai shell cơ bản. Glow chỉ nên bổ sung khi chức năng và keyboard QA đã đạt.

## Không bê nguyên JS demo

- Demo cart dùng localStorage `tapra-cart`, giá giả và checkout `#`. Compact chỉ mở cart drawer hiện có của Shopify theme.
- Demo menu không chuyển focus vào panel khi mở; chỉ có aria-hidden và CSS visibility. Cần hidden/inert chính xác, focus entry, focus containment phù hợp overlay, Escape và trả focus ở mọi đường đóng.
- Panel chưa có giới hạn chiều cao viewport; menu dài có thể đi quá đáy. Cần scroll nội bộ và giữ bar/back luôn truy cập được.
- Menu width/height animation có thể gây layout work; chỉ đo khi mở/đổi panel/resize, tránh đo mỗi frame và cần ResizeObserver cho content/font changes.
- Header script demo gắn global listeners/timer và không có teardown cho Shopify editor. Controller Compact phải scope theo section, init/destroy idempotent, xử lý load/unload và block selection.
- Mở menu phải đóng search/cart hiện có, và các overlay khác cũng phải đóng Compact menu; tránh hai focus traps/scroll locks cạnh tranh.
- Reduced motion phải bỏ expand/stagger/glow animation trong Compact controller; không chỉ dựa vào reset CSS toàn trang.
- Khi không có JS, navigation/link vẫn truy cập được; không giữ body menu invisible vô thời hạn.
- Hit area icon trong demo40px; khi tích hợp dùng control/touch contract của theme và kiểm tra target ít nhất44px mà không phá pill.

## Files dự kiến khi triển khai

| File / owner | Thay đổi dự kiến |
|---|---|
| `sections/header.liquid` | Selector Header style, fallback Classic, routing renderer, control visibility |
| `blocks/_header-top.liquid` hoặc snippet shell riêng | Compact shell và các slot; bảo toàn static block ID của Classic |
| `blocks/_header-menu.liquid` / menu snippets | Renderer Compact dùng link-list/mega-menu hiện có, giữ link ba cấp và editor attrs |
| Component CSS riêng | Pill, panel, overflow, responsive và state styles; không đưa vào critical.css |
| `assets/header.js` hoặc controller Compact riêng | Mode-aware init, open/close/category/back, focus, measurements, editor lifecycle |
| `locales/*.schema.json`, `locales/*.json` | Chỉ label mới và accessible UI mới; giữ label cũ |
| `sections/header-group.json` | Khi thử Compact: chọn style/scheme phù hợp; giữ announcement disabled |

Trước implementation cần kiểm tra render path của static block để chọn mở rộng `_header-top` hay shell snippet. Không tạo một bộ logo/menu/cart kernel riêng chỉ để đổi appearance.

## QA cho implementation sau

Classic Single row/Two rows không regression; đổi style rồi đổi lại giữ block data. Compact open/close, menu3 cấp, leaf category link, Back, outside click, Escape, focus entry/return, long/empty menu, viewport thấp, cart/search mutual exclusion, reduced motion, no-JS. Kiểm tra767/768/1149/1150px, overlay homepage và resource-page offset, editor save/reload/load/unload/block select. Không có duplicate listeners, duplicate IDs, focus vào panel ẩn hoặc mất selection khi đổi layout.

Kết luận: nên thêm style Compact vào Header hiện có. Đây là khác biệt về composition + interaction, không chỉ radius/width của Classic. Audit source hoàn tất; QA render/tương tác Compact vẫn NOT TESTED vì chưa triển khai.
