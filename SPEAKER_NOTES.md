# 🎙️ Ghi Chú Diễn Giả & Kịch Bản Thuyết Trình Thuật Toán Apriori
> Dùng kèm với bộ trình chiếu 16:9 (`apriori_presentation.pptx` hoặc giao diện Web).

---

### Slide 1: Mở Đầu & Khơi Gợi
* **Câu hỏi mở đầu cuốn hút:** *"Làm sao siêu thị và sàn thương mại điện tử đoán trúng món bạn muốn mua tiếp theo giữa hàng triệu sản phẩm?"*
* **Bối cảnh quy mô:** Với hàng triệu giao dịch mỗi ngày, nếu kiểm tra thử mọi combo thì số phép tính lớn hơn cả số nguyên tử trong vũ trụ!
* **Giới thiệu Apriori (1994):** Không cần AI hộp đen phức tạp, chỉ với nguyên lý xác suất thông minh, thuật toán đã giải quyết bài toán gợi ý từ hơn 30 năm trước.
* **Tâm thế tiếp cận:** Hôm nay chúng ta sẽ tìm hiểu bằng trực giác đời thường, đồ họa trực quan và chạy thử mô phỏng thời gian thực.

---

### Slide 2: Huyền Thoại "Bia & Tã Giấy" (The Hook)
* **Kể chuyện tự nhiên:** Chiều thứ Sáu, siêu thị Walmart phát hiện các ông bố mua tã cho con thường tiện tay mua thêm lốc bia xem thể thao cuối tuần.
* **Kinh doanh đột phá:** Chỉ cần chuyển hai quầy hàng lại gần nhau, doanh số cả hai tăng vọt hơn 35%.
* **Chốt ý đắt giá:** Trực giác của chúng ta có thể bỏ sót, nhưng dữ liệu giỏ hàng thì không nói dối!

---

### Slide 3: Cạm Bẫy Bùng Nổ Tổ Hợp ($2^d - 1$)
* **Đặt câu hỏi gợi mở:** *"Tại sao không duyệt mò vét cạn (Brute-force) để kiểm tra toàn bộ combo có thể có?"*
* **Giải thích nguồn gốc $2^d - 1$:** Mỗi sản phẩm có đúng 2 khả năng (Được chọn [1] hoặc Không chọn [0]) $\rightarrow$ Với $d$ món có $2 \times 2 \times \dots = 2^d$ tập con. Trừ đi 1 trường hợp rỗng (không chọn món nào) $\rightarrow$ còn $2^d - 1$ combo cần xét.
* **Chỉ vào phép tính quy mô:** Danh mục 100 món cho ra $\approx 1.26 \times 10^{30}$ combo. Dù siêu máy tính xử lý 1 tỷ combo/giây vẫn cần 40 tỷ năm (gấp 3 lần tuổi vũ trụ)!
* **Chốt giải pháp:** Duyệt mò là bất khả thi. Ta cần Tiên đề phản đơn điệu của Apriori để tỉa nhánh trước 99% tổ hợp vô vọng mà không cần quét đĩa CSDL.

---

### Slide 4: Bộ 3 Thước Đo Vàng & Hệ Thống 3 Lớp Lọc Dữ Liệu
* **Khẳng định nguồn gốc:** Bộ 3 công thức này KHÔNG PHẢI tự nghĩ ra một cách ngẫu nhiên, mà được dẫn xuất 100% từ 3 trụ cột của Lý thuyết Xác suất Cổ điển:
  1. **Support = Xác suất đồng thời $P(A \cap B)$:** Coi mỗi đơn hàng là một phép thử trong không gian mẫu $|D|$. Tần suất thực nghiệm $\text{Supp} = \sigma(A \cup B)/|D|$ chính là ước lượng xác suất $P(A \cap B)$. Chia cho $|D|$ để chuẩn hóa về $[0, 1]$ giúp so sánh công bằng giữa siêu thị 200 đơn (100 đơn là 50%) và sàn Shopee 1 triệu đơn (100 đơn là 0.01% - nhiễu ngẫu nhiên).
  2. **Confidence = Xác suất có điều kiện Bayes $P(B | A)$:** Định nghĩa toán học chuẩn $P(B|A) = P(A \cap B) / P(A)$. Ta thu hẹp không gian mẫu về biến cố đã xảy ra (khách đã mua A làm mẫu số), đếm ai lấy thêm B làm tử số. Vì $P(B|A) \ne P(A|B)$ nên sinh ra tính định hướng 1 chiều: Mua Ô tô $\rightarrow$ Mua Bảo hiểm (95%), nhưng Mua Bảo hiểm $\rightarrow$ Mua Ô tô chỉ 5%.
  3. **LIFT = Tỷ số kiểm định độc lập thống kê:** Theo xác suất, 2 biến cố độc lập khi $P(A \cap B) = P(A) \times P(B) \Leftrightarrow P(B|A)/P(B) = 1$. Do đó, $\text{Lift} = \text{Conf} / \text{Supp}(B)$ đo mức độ chệch khỏi giả thuyết độc lập: $\text{Lift} = 1$ là độc lập ngẫu nhiên (như Túi Nilon ai cũng lấy, A không có công lao gì); $\text{Lift} > 1$ chứng minh món A thực sự kích cầu kéo doanh số B tăng vọt gấp X lần so với tự nhiên!

---

### Slide 5: Nguyên Lý Apriori & Tiên Đề Phản Đơn Điệu (Anti-monotonicity)
* **Nêu bật Tiên đề cốt lõi:** $\forall X \subseteq Y \Rightarrow \text{Support}(Y) \le \text{Support}(X)$
* **Định nghĩa rõ ràng hai tập X và Y:** X là tập con (ví dụ món đơn {Bia}), Y là tập cha chứa X (ví dụ combo {Bia, Tã}).
* **Trực giác đời thường chứng minh:** Bất kỳ giỏ hàng nào có combo {Bia, Tã} đều bắt buộc phải có Bia. Ngược lại, có người chỉ mua riêng Bia. Vì thế số hóa đơn chứa combo Y không bao giờ vượt quá món con X!
* **Hệ quả cắt tỉa vàng (Apriori Pruning):** Nếu tập con X không đạt `min_sup` (ví dụ {Trứng} chỉ $1/7$ đơn $= 14\% < 40\%$), thì chắc chắn mọi combo cha chứa nó ({Trứng, Sữa}, {Trứng, Bia}...) đều bị loại ngay lập tức mà không cần tốn thời gian đọc đĩa CSDL!
* **Hiệu quả vượt trội:** Tiết kiệm ngay hơn 95% công sức tính toán và chi phí I/O đọc ổ cứng.

---

### Slide 6: Bóc Trần Ảo Giác & Bí Mật Kinh Doanh Của Lift
* **Chỉ vào Bảng vai trò bổ trợ 3 cột:** Tóm tắt nhanh rủi ro nếu thiếu bất kỳ chỉ số nào.
* **Kể câu chuyện đối chiếu 2 luật:** Tạo khoảnh khắc "Aha!" cho người nghe: Luật ảo Túi Nilon (Conf 90% nhưng vô ích) vs Mỏ vàng Bia & Tã (Conf 35% nhưng Lift 3.5x).
* **💡 Mẹo giải thích `min_sup` & `min_conf`:** *"Đây là siêu tham số do con người tự đề ra dựa trên bài toán. Demo 10 đơn thì đặt 40%, nhưng Big Data Shopee hàng triệu đơn thì phải đặt 0.5% - 2% để không bỏ sót mỏ vàng!"*
* **Tuyên ngôn đắt giá:** *"Confidence đo xác suất xảy ra, còn LIFT đo hiệu quả kích cầu thực sự. Doanh nghiệp chi tiền cho luật có LIFT cao nhất!"*

---

### Slide 7: Ghép Cặp & Tỉa Cành (Join & Prune)
* **Giải thích thuật ngữ chuẩn:** $L_k$ (Large/Frequent itemsets), $C_k$ (Candidate itemsets), $\bowtie$ (phép ghép có điều kiện).
* **Mô tả 2 bước:**
  * **Bước 1 (Join):** Ghép hai tập $L_{k-1}$ có thứ tự từ điển A $\rightarrow$ Z trùng nhau đúng $(k-2)$ món đầu để sinh $C_k$ (tránh sinh trùng lặp).
  * **Bước 2 (Prune):** Chưa vội quét CSDL! Kiểm tra checklist 3 tập con 2 món của [Bia, Bơ, Sữa]. Chỉ cần 1 tập con bị loại ([Bơ, Sữa] $\notin L_2$), gạch bỏ ngay combo [Bia, Bơ, Sữa] mà không cần quét đĩa CSDL.

---

### Slide 8: Biến Dữ Liệu Thành Doanh Thu & Ứng Dụng Thực Chiến
* **Giải thích công thức sinh luật:** Từ tập phổ biến $I \in L_k$, phân rã thành tiền đề A và hệ quả B, kiểm tra $\text{Conf} \ge \text{min\_conf}$ và $\text{Lift} > 1.0$.
* **3 Ứng dụng thực chiến tạo doanh thu triệu đô:**
  1. **Bố trí kệ hàng siêu thị (Cross-merchandising):** Đặt cạnh nhau trên lối đi chính để tiện tay nhặt thêm.
  2. **Đóng gói combo & flash sale:** Giảm 5% khi mua cả đôi để tăng giá trị đơn hàng trung bình (AOV).
  3. **Gợi ý thông minh trên E-commerce:** Widget *"Thường được mua cùng nhau"* khi khách chuẩn bị checkout.
* **Chiến lược ROI:** Kết hợp Lift với biên lợi nhuận của sản phẩm B để tối ưu hóa lợi nhuận ròng.

---

### Slide 9: Giới Thiệu Live Demo
* **Dẫn dắt:** *"Nói lý thuyết thế đủ rồi, bây giờ chúng ta hãy xem thuật toán chạy thực tế trên từng dòng dữ liệu."*
* Nhấn phím **'D'** hoặc bấm nút để chuyển ngay sang màn hình mô phỏng tương tác trực quan.

---

### Slide 10: Ưu Điểm, Giới Hạn & Kế Thừa (FP-Growth)
* **Đánh giá khách quan:** Apriori mở đường cho Data Mining nhưng có 2 điểm nghẽn: đọc đĩa $k$ lần và bùng nổ tập ứng viên $C_k$.
* **Giới thiệu bước nhảy vọt FP-Growth (Han et al., 2000):** Nén CSDL vào cây FP-Tree qua đúng 2 lần quét, dùng đệ quy chia để trị, hoàn toàn không sinh ứng viên, nhanh hơn 10x - 100x!
* **💡 Mẹo trả lời Q&A (Nếu hội đồng hỏi tại sao demo Apriori mà không demo FP-Growth):**
  ➔ *"Mục tiêu của bài này là làm sáng tỏ bản chất toán học của luật kết hợp, triết lý tỉa cành (Anti-monotonicity) và 3 lớp lọc kinh doanh. Apriori là chuẩn mực sư phạm trực quan nhất cho mục tiêu này. FP-Growth là cải tiến tối ưu hóa cấu trúc dữ liệu cho bước tiếp theo."*

---

### Slide 11: 3 Bài Học Lớn & Thảo Luận (Key Takeaways)
* **Khắc sâu 3 thông điệp đắt giá trước khi kết thúc:**
  1. **Tư duy thuật toán:** Không gian tổ hợp $2^d - 1$ là cạm bẫy chết người. Apriori giải quyết bằng cách tỉa cành Anti-monotonicity ngay từ gốc thay vì duyệt vét cạn ngây thơ.
  2. **Tư duy số liệu:** Đừng bao giờ dừng lại ở Confidence (tránh bẫy Túi Nilon). Phải dùng LIFT để kiểm chứng giá trị kích cầu thực tế.
  3. **Tầm vóc thực tiễn:** Hiểu vững Apriori là chìa khóa vàng mở đường vào các Recommender Systems và bước đệm sang thuật toán tối ưu bộ nhớ FP-Growth.
* **Lời kết:** *"Dữ liệu không nói dối — chỉ có cách chúng ta giải mã dữ liệu có đủ thông minh hay không!"*
* Mời Thầy Cô và các bạn đặt câu hỏi. Sẵn sàng bấm phím **'D'** để biểu diễn lại bất kỳ kịch bản nào trên bộ mô phỏng.
