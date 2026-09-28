# 📊 Khai Phá Luật Kết Hợp & Thuật Toán Apriori (Interactive Presentation Deck & Live Simulator)

Bộ bài thuyết trình và trình mô phỏng thuật toán **Apriori** chuẩn công nghệ hiện đại, được xây dựng hoàn toàn bằng **HTML5, CSS3 và JavaScript thuần (Zero-dependency)**.

Ứng dụng chạy mượt mà ngay trên mọi trình duyệt web chỉ bằng cách mở tệp `index.html` (không cần cài đặt Node.js hay bất kỳ thư viện cồng kềnh nào).

---

## 🌟 Điểm Nổi Bật

### 1. Chuẩn Thuyết Trình Hiện Đại (Modern Market Standard)
- **Triết lý 3Blue1Brown / Apple Keynote**: *Intuition First, Math Second* (Trực giác đi trước, công thức theo sau – Mỗi slide 1 thông điệp cốt lõi).
- **Storytelling cuốn hút**: Mở đầu bằng câu chuyện huyền thoại "Bia & Tã giấy" chiều thứ Sáu tại siêu thị.
- **Trực quan hóa bùng nổ tổ hợp ($2^d$)**: Cho khán giả thấy ngay vì sao duyệt ngây thơ (Brute-Force) thất bại thảm hại, làm nổi bật giá trị cứu tinh của Apriori.
- **Giải mã Bộ Ba Chỉ Số**:
  - **Support**: Tần suất xuất hiện đồng thời (lọc nhiễu).
  - **Confidence**: Độ tin cậy của quy luật (đo độ nhạy khi gợi ý).
  - **Lift**: Tương quan thực chất (> 1 là kéo nhau mua thật sự, tránh ngẫu nhiên).

### 2. Live Simulator Mô Phỏng Thuật Toán Từng Bước (60fps)
- **Quét cơ sở dữ liệu (Database Scan)**: Dòng giao dịch phát sáng và đếm số lần xuất hiện trong thời gian thực.
- **Tỉa nhánh thông minh (Prune Step)**: Hiệu ứng gạch chéo đỏ và loại bỏ ngay lập tức những tập ứng viên có tập con không phổ biến (Anti-monotonicity) mà **không cần quét lại CSDL**.
- **Khai phá luật kết hợp ($A \Rightarrow B$)**: Tự động tính Support, Confidence và Lift cho từng luật, kèm phân loại mức độ giá trị.
- **Điều khiển trực quan**: Thanh trượt điều chỉnh `Min Support (%)` và `Min Confidence (%)`, các nút `Tự động`, `Lùi bước`, `Bước tiếp`, `Đặt lại`, và chọn tốc độ (0.5x, 1x, 1.5x, 2x).

### 3. Bộ 3 Kịch Bản Thực Tế Sẵn Có (Pre-loaded Scenarios)
Nhấn phím `S` hoặc biểu tượng giỏ hàng trên thanh tiêu đề để đổi kịch bản tức thì:
1. **Siêu thị bán lẻ (Market Basket)**: Bánh mì, Bơ, Sữa, Bia, Tã giấy, Trứng.
2. **Cửa hàng Công nghệ (Tech Gear)**: Laptop, Chuột không dây, Bàn phím cơ, Lót chuột, Tai nghe, Cáp Type-C.
3. **Thức ăn nhanh (Fast Food Combo)**: Burger, Khoai tây chiên, Coca, Gà rán, Kem.

### 4. Công Cụ Hỗ Trợ Diễn Giả (Speaker Tools)
- **Ghi chú diễn giả (Speaker Notes)**: Nhấn phím `N` để mở khay gợi ý lời thoại cho từng slide.
- **Tổng quan slide (Overview Grid)**: Nhấn phím `O` để xem danh sách 10 slide và nhảy nhanh đến bất kỳ slide nào.
- **Chuyển nhanh sang Demo**: Nhấn phím `D` để hoán đổi giữa bài thuyết trình và trình mô phỏng.
- **Toàn màn hình**: Nhấn phím `F`.

---

## ⌨️ Bảng Phím Tắt Khi Thuyết Trình

| Phím Tắt | Chức Năng |
| :--- | :--- |
| `→` hoặc `Space` hoặc `PageDown` | Chuyển sang slide tiếp theo |
| `←` hoặc `Backspace` hoặc `PageUp` | Lùi về slide trước |
| `D` | Bật / Tắt chế độ Live Simulator |
| `N` | Mở khay ghi chú diễn giả (Speaker Notes) |
| `O` | Bật bảng tổng quan 10 slide (Overview Grid) |
| `S` | Mở danh sách kịch bản dữ liệu mẫu (Scenario Switcher) |
| `F` | Bật / Tắt chế độ Toàn màn hình (Fullscreen 16:9) |
| `?` hoặc `H` | Mở bảng hướng dẫn phím tắt |
| `ESC` | Đóng các cửa sổ đang mở |

---

## 📂 Cấu Trúc Mã Nguồn

```
apriori-algorithm/
├── index.html              # Trang chủ ứng dụng (Slide Deck + Simulator)
├── README.md               # Tài liệu hướng dẫn sử dụng
├── css/
│   ├── base.css            # Hệ thống màu sắc, Reset, Typography, Ambient Lighting
│   ├── slides.css          # Phong cách Keynote 16:9, Animation chuyển slide, Thẻ chỉ số
│   └── simulator.css       # Giao diện Simulator, Bảng giao dịch, Thẻ ứng viên, Luật kết hợp
└── js/
    ├── datasets.js         # Dữ liệu 3 kịch bản mẫu kèm icon và giao dịch thực tế
    ├── apriori.js          # Core engine: Thuật toán Apriori, Join-Prune, Support, Rules, Lift
    ├── presentation.js     # Điều khiển slide deck, ghi chú diễn giả, phím tắt
    ├── visualizer.js       # Điều phối hoạt họa quét dữ liệu, highlight, tỉa cành, logs
    └── app.js              # Khởi tạo và liên kết các thành phần của ứng dụng
```

---

## 🚀 Hướng Dẫn Sử Dụng
1. Nhấp đúp vào tệp `index.html` hoặc kéo thả vào bất kỳ trình duyệt nào (Google Chrome, Safari, Edge, Firefox).
2. Nhấn phím `F` để đưa bài thuyết trình về tỉ lệ chuẩn 16:9 toàn màn hình.
3. Dùng phím `Space` hoặc mũi tên phải để bắt đầu bài thuyết trình!
