# Tapra — audit token Theme settings

Ngày: 12/10/2026. Baseline local: `main`, commit `83022e7e`.

Nguồn: `/Users/chieutrinh/Documents/GitHub/lh-template-demo/output/Tapra-Style-Guide.html`.

Đây là đề xuất thay đổi, chưa triển khai. Chỉ chọn giá trị phù hợp để thay thế setting đã có. Không thêm nhóm settings, setting ID, section, block, token system hay layout từ trang style guide.

## Điều chỉnh phạm vi theo người dùng

Tên scheme luôn là Scheme 1 / Scheme 2 / Scheme 3 / Scheme 4; Paper/Mist/Navy/Sky bên dưới chỉ mô tả palette tham khảo, không đổi tên trong editor. Giữ nguyên mọi label Theme settings. Người dùng cho phép mở rộng range heading khi cần (ví dụ H1 tới 120px); paragraph nền lấy 16px, tiếp tục dùng Text size có sẵn cho các biến thể. Đây là hướng cho đợt typography sau, thay thế giới hạn đề xuất ban đầu bên dưới.

Đợt thử hiện tại chỉ cập nhật 81 giá trị trong `current.color_schemes`, giữ ID và số scheme. Chưa đổi font, typography, radius hoặc layout. Đã xác nhận Manrope xuất hiện trong font picker Shopify của draft theme. Kiểm tra JSON và phạm vi diff đạt; Theme Check không có lỗi, có 44 warning ở các file khác, không có offense trong settings_data.json. Body/background của Scheme 1–4 lần lượt đạt 5.00 / 5.18 / 8.81 / 6.62:1.

### Typography đã triển khai sau đợt màu

Manrope 500/400/500 cho Heading/Body/Accent; badge Manrope600. Paragraph nền 16px/1.55, giữ sáu Text size hiện có. H1–H6 desktop 120/96/60/36/28/20px, tablet 64/54/34/26/22/20px, mobile 44/40/34/26/22/20px. Heading case Original; preset Tight dùng line-height 0.98/1.05/1.05/1.05/1.10/1.05 và tracking −0.05/−0.03/−0.03/−0.03/−0.03/−0.02em. Preset Normal/Relaxed của heading giữ nguyên. Eyebrow 11px/500, uppercase, leading1.55, Loose tracking0.1em.

Giữ nguyên mọi label, setting ID và option. Chỉ mở max của range Display desktop tới168px, Extra large desktop tới96px. H1 current120 và H2 current96 hợp lệ. Không thêm heading/paragraph role hoặc control.

QA: JSON/schema và diff đạt; Theme Check 0 error, 44 warning (bao gồm cảnh báo complexity tồn tại ở css-variables). Đã xác nhận mapping render trong preview và giá trị trong Theme Editor; ở 390/767/768/1149/1150/1440px không có root overflow ngang, H1/H2 nhận đúng token theo breakpoint. Không thực hiện chỉnh/saved thử các controls khác hoặc QA toàn bộ commerce flow. Shopify CLI watcher vẫn chạy theo yêu cầu preview local. Shopify tự ghi thay đổi vào GitHub qua ba commit 253d0f40, c5dc2ffc, 3bf7da85; local đã đối chiếu nội dung trước khi đồng bộ.

## Kết quả audit

Theme đã có đường dẫn `config/settings_schema.json` → `config/settings_data.json.current` → `snippets/css-variables.liquid` → `assets/critical.css` và component. `layout/theme.liquid` render CSS variables trước stylesheet. Phần lớn thay đổi nhận diện có thể thực hiện trong `settings_data.json.current`; không cần thay schema hoặc CSS.

Style guide chứa ba loại dữ liệu: giá trị từ demo, scale được chuẩn hóa đề xuất, và giá trị sửa contrast đề xuất. Chúng không có cùng mức độ xác nhận. Không coi mọi thông số trong guide là yêu cầu triển khai.

Các phát hiện chính:

- Font hiện tại: Heading Outfit 500, Body Outfit 400, Accent Outfit 500; badge dùng Instrument Sans 600 riêng. Font nhận diện trong guide là Manrope.
- Bốn scheme hiện có phù hợp vai trò sáng / xám / tối / nhấn. Có thể thay giá trị ngay trong `scheme-1..4`, giữ nguyên tham chiếu ở các template.
- Nút hiện tại 16px/500, radius 6px; guide có nút 15px/600 dạng pill. Contract nút của theme dùng min-height và padding ngang, khác padding dọc 12px của demo.
- Typography có H1–H6 sẵn, nhưng H1 desktop tối đa 96px và H2 desktop tối đa 72px. Guide ghi H1 120.96px tại 1440px (max 168px), H2 96px. Không thể nhập nguyên scale chỉ bằng saved settings.
- Heading line-height là các preset: H1/H2 1.1–1.3; H3 1.2–1.4; H4 1.3–1.5; H5/H6 1.4–1.6. Không có 0.98/1.05 theo guide. Tracking heading chỉ 0 hoặc ±0.2px, không có −0.05/−0.03em.
- Body có sáu size token 12/14/16/18/20/24px, không có bảy cấp P1–P7. Body line-height có 1.5/1.6/1.75, không có 1.55.
- Radius có 8/12/16/24/32 và pill, không có 20px. Không nên thêm radius 20 chỉ để đồng nhất guide.
- Có local override màu và radius trong homepage/header/footer. Token global chỉ đổi nơi đang kế thừa.

## Đợt 1 đề xuất — chỉ thay giá trị hiện có

### Font và typography

| Setting | Hiện tại | Đề xuất | Nguồn / lý do |
|---|---|---|---|
| `type_heading_font` | `outfit_n5` | Manrope 500 | Font guide, giữ weight |
| `type_primary_font` | `outfit_n4` | Manrope 400 | Font guide, giữ weight |
| `type_accent_font` | `outfit_n5` | Manrope 500 | Đồng bộ role Accent |
| `badge_font` | `instrument_sans_n6` | Manrope 600 | Đồng bộ family; giữ weight badge commerce |
| `type_heading_1_case`…`type_heading_5_case` | `capitalize` | `original` | Guide dùng normal case; H6 đã original |
| `type_eyebrow_size` | 14px | 11px | Token guide, schema hỗ trợ |
| `type_eyebrow_case` | original | uppercase | Token guide |
| `type_eyebrow_letter_spacing` | 0.5px | `loose` = 0.08em | Gần 0.1em trong guide; đây là giá trị thích nghi |

Giữ eyebrow weight 500. Giữ body size 16px và leading `normal` = 1.5. Giữ toàn bộ heading size/line-height/tracking trong đợt 1. Font family mới vẫn có thể làm thay đổi xuống dòng; cần kiểm tra khi triển khai.

Tên handle Manrope cần được xác nhận với font picker của theme khi thực hiện, trước khi lưu saved data; không lấy tên Google Fonts làm handle Shopify một cách máy móc.

### Color schemes — giữ nguyên ID

| Role hiện có | Scheme 1: Paper | Scheme 2: Mist | Scheme 3: Navy | Scheme 4: Sky |
|---|---|---|---|---|
| Background hiện tại | #FFFFFF | #F5F5F5 | #181818 | #EBF2FF |
| Background đề xuất | #F4F7FB | #E6EAF0 | #050D24 | #BFE3FF |
| Heading / heading highlight | #0A1530 | #0A1530 | #FFFFFF | #0A1530 |
| Body text | #5D6B85 | **#52617B** | #9FB0D0 | #2D4A78 |
| Component background | #FFFFFF | #DDE3EC | rgba(255,255,255,0.06) | #BFE3FF |
| Primary background / border | #0A1530 | #0A1530 | #FFFFFF | #0A1530 |
| Primary text | #FFFFFF | #FFFFFF | #0A1530 | #FFFFFF |
| Secondary background / border | #BFE3FF | #BFE3FF | #BFE3FF | #FFFFFF |
| Secondary text | #0A1530 | #0A1530 | #0A1530 | #0A1530 |
| Tertiary text | #0A1530 | #0A1530 | #BFE3FF | #0A1530 |
| Accent | #2A5FD6 | #2A5FD6 | #BFE3FF | #2A5FD6 |

Body Mist #52617B là sửa contrast **được đề xuất trong guide**, thay cho màu gốc #5D6B85. Accent #2A5FD6 cũng là đề xuất sửa contrast của guide, thay cho #3B82F6. Việc dùng accent này cho focus và các consumer của `--accent-color` là mapping của theme, không phải một blue CTA mới.

Secondary Sky/Ink là mapping từ variant Sky CTA sang secondary button hiện có; riêng scheme Sky giữ secondary White/Ink để phân biệt với nền. Không thêm variant CTA. Đây là lựa chọn tích hợp, không phải tổ hợp bắt buộc của demo.

Primary/secondary hover background, border và text theo bộ màu default tương ứng trong đợt 1; tertiary hover theo text tương ứng. Giữ hiệu ứng hover đang có. Không suy ra một bộ hover màu mới từ glow trong demo.

Border của scheme Navy có thể thay #CCCCCC → rgba(255,255,255,0.12), đúng guide. Border ở ba scheme sáng chưa có thông số chung trong guide: giữ giá trị hiện tại. Giữ `background_bar`, `variant_overlay`, `shadow`, `sale_price` vì chưa có mapping đủ rõ trong phạm vi này. Giữ default scheme và overlay scheme là scheme-1.

### Buttons, forms và radius

| Setting | Hiện tại | Đề xuất | Ghi chú |
|---|---|---|---|
| `button_radius_style` | radius_6 | pill | Pill đã có; CSS 1000px tương đương hình học radius999 trong guide |
| `button_font_size`, `button_font_size_mobile` | 16px | 15px | Guide |
| `button_font_weight` | 500 | 600 | Guide |
| `button_padding_inline_desktop/tablet/mobile` | 24px | 22px | Guide |
| `button_*_text_case` | capitalize | original | Ba variant hiện có |
| `input_radius_style` | radius_6 | radius_12 | Control12 là scale đề xuất trong guide |
| `textarea_radius_style` | radius_6 | radius_12 | Cùng role form |
| `radius_tags` | square | radius_8 | Tag gốc 8px |
| `radius_badges_subheadings` | pill | radius_8 | Thích nghi shape nhãn; không đổi màu/status badge |
| `radius_drawers`, `radius_bottom_sheets` | radius_8 | radius_24 | Panel24 là scale đề xuất trong guide |

Giữ button height 48px desktop / 44px mobile, input height 48px / 44px, input style outline, padding input 16px và disabled opacity 60%. Không dùng opacity35 của disabled checkout demo cho mọi nút. Không sửa width của icon button thành 44px toàn bộ: icon button/nav hiện dùng token height button, đổi sẽ ảnh hưởng nhiều consumer.

Giữ `radius_media_containers=radius_16` và media radius product card hiện tại. Guide đề xuất card20 nhưng schema không hỗ trợ; không tự đổi thành 24px cho tất cả ảnh/card. Giữ swatch, variant, navigation radius hiện tại.

### Layout

Chỉ đề xuất `max_page_width: 1680 → 1600px`, lấy cap từ guide. Giữ margin desktop/tablet/mobile 40/30/16px. Container 88% của demo không tương đương cấu trúc px-margin hiện tại, nên không ép lề 86.4px desktop / 23.4px mobile vào settings.

Giữ mọi section padding, gap, grid, breakpoint và composition. Guide 96/64px có thể phù hợp một số section hiện tại nhưng không phải token global để thay toàn bộ section.

## Không chọn trong đợt 1

- H1/H2 và toàn bộ scale heading: cần kiểm tra vai trò trên layout thực tế. Homepage có 12 entry dùng `xl` và 1 entry dùng `display` trong JSON; thống kê bao gồm cả section không nằm trong `order`. Nâng đồng loạt có thể làm heading hiện tại tăng mạnh và đổi bố cục.
- H3/H4/H5/H6 của guide (60/36/28/20 desktop; 34/26/22/20 mobile) nằm trong range hiện có, nhưng việc nhập chúng phải đi cùng kiểm tra role, không chỉ vì slider cho phép. Đợt 1 giữ size hiện tại.
- Paragraph P1–P7, line-height 1.55 và heading tracking theo em: cần mở rộng/chỉnh contract nếu triển khai chính xác, vượt phạm vi thay giá trị sẵn có.
- Radius20, spacing scale mới, glow, glass blur, shadow hệ thống và motion shatter/reveal: không tạo token/setting mới.
- Product-card style, ratio, alignment, quick add/view, variants, price, badge trạng thái: guide chưa cung cấp mapping commerce đủ rõ.
- Logo, ảnh, nội dung Torvex/Pawvera/Peeko còn trong template: đây là chuyển nội dung/branding khác, chưa thuộc audit token.

## Local overrides cần ghi nhận

Đợt 1 không sửa template JSON hoặc section-group JSON. Vì vậy các vị trí sau có thể giữ màu cũ:

- Header announcement background #333333; header divider #DBD9D9.
- Footer-bottom background #333333; footer newsletter input background #4D4D4D; menu và một số text footer ép #FFFFFF.
- Collection content group background #FAFAFA; testimonial card background #FFFFFF, location text #BCBAC8.
- Countdown background #B31F1F; nhãn sản phẩm background #448432.
- Quantity selector ép background #FFFFFF, text #181818 và border #E6E6E6.
- Collection/image/product blocks có radius riêng như radius_16 hoặc square; không tự nhận radius global mới.

Nếu sau này cần đồng bộ những vị trí này, chỉnh từng setting local bằng token/giá trị phù hợp hoặc trả về inherit. Không xóa hàng loạt override; màu countdown/status có ý nghĩa riêng.

## Phạm vi file và kiểm chứng

Đợt 1 dự kiến chỉ sửa `config/settings_data.json.current`. Không sửa `presets`, schema, CSS variables, CSS foundation, locale hay template.

Đã kiểm tra source/schema, các giá trị saved current, mapping Liquid, CSS consumers và local overrides trong homepage/header/footer. Chưa kiểm tra trực tiếp giá trị Theme settings trên Shopify; baseline là Git local, có thể khác nếu merchant đã lưu sau commit này.

Theme Editor / storefront QA: NOT TESTED trong audit này. Chưa chạy Theme Check vì không thay code theme. Khi triển khai: xác nhận font handle, kiểm tra mọi giá trị hợp lệ với schema, contrast của cặp màu thực tế, font wrapping, primary/secondary/tertiary, form, drawer, product card ở 767/768/1149/1150px và editor save/reload. Do theme liên kết GitHub, push sau triển khai sẽ đồng bộ draft theme.

Trạng thái: có phương án thay token bằng contract hiện có; cần QA khi triển khai. Audit này chỉ thêm tài liệu đề xuất, chưa commit/push hay sửa Shopify.
