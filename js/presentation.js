/**
 * Presentation Controller
 * Manages 10 modern keynote-style slides, keyboard navigation,
 * progress tracking, speaker notes, and presentation state.
 */

const SPEAKER_NOTES = {
  1: {
    title: "Slide 1: Mở đầu & Khơi gợi",
    points: [
      "Câu hỏi mở đầu cuốn hút: 'Làm sao siêu thị và sàn thương mại điện tử đoán trúng món bạn muốn mua tiếp theo giữa hàng triệu sản phẩm?'",
      "Bối cảnh quy mô: Với hàng triệu giao dịch mỗi ngày, nếu kiểm tra thử mọi combo thì số phép tính lớn hơn cả số nguyên tử trong vũ trụ!",
      "Giới thiệu Apriori (1994): Không cần AI hộp đen phức tạp, chỉ với nguyên lý xác suất thông minh, thuật toán đã giải quyết bài toán gợi ý từ hơn 30 năm trước.",
      "Tâm thế tiếp cận: Hôm nay chúng ta sẽ tìm hiểu bằng trực giác đời thường, đồ họa trực quan và chạy thử mô phỏng thời gian thực."
    ]
  },
  2: {
    title: "Slide 2: Câu chuyện Bia & Tã Giấy (The Hook)",
    points: [
      "Kể tự nhiên: Chiều thứ Sáu, siêu thị Walmart phát hiện các ông bố mua tã cho con thường tiện tay mua thêm lốc bia xem thể thao cuối tuần.",
      "Kinh doanh đột phá: Chỉ cần chuyển hai quầy hàng lại gần nhau, doanh số cả hai tăng vọt hơn 35%.",
      "Chốt ý đắt giá: Trực giác của chúng ta có thể bỏ sót, nhưng dữ liệu giỏ hàng thì không nói dối!"
    ]
  },
  3: {
    title: "Slide 3: Bùng Nổ Tổ Hợp (2^d - 1)",
    points: [
      "Đặt câu hỏi gợi mở: 'Tại sao không duyệt mò vét cạn (Brute-force) để kiểm tra toàn bộ combo có thể có?'",
      "Giải thích nguồn gốc 2^d - 1: Mỗi sản phẩm có đúng 2 khả năng (Được chọn [1] hoặc Không chọn [0]) -> Với d món có 2 × 2 × ... = 2^d tập con. Trừ đi 1 trường hợp rỗng (không chọn món nào) -> còn 2^d - 1 combo cần xét.",
      "Chỉ vào phép tính quy mô: Danh mục 100 món cho ra ~1.26 × 10^30 combo. Dù siêu máy tính xử lý 1 tỷ combo/giây vẫn cần 40 tỷ năm (gấp 3 lần tuổi vũ trụ)!",
      "Chốt giải pháp: Duyệt mò là bất khả thi. Ta cần Tiên đề phản đơn điệu của Apriori để tỉa nhánh trước 99% tổ hợp vô vọng mà không cần quét đĩa CSDL."
    ]
  },
  4: {
    title: "Slide 4: Bộ 3 Thước Đo Vàng & Hệ Thống 3 Lớp Lọc Dữ Liệu",
    points: [
      "Khẳng định nguồn gốc: Bộ 3 công thức này KHÔNG PHẢI tự nghĩ ra một cách ngẫu nhiên, mà được dẫn xuất 100% từ 3 trụ cột của Lý thuyết Xác suất Cổ điển:",
      "1. Support = Xác suất đồng thời P(A ∩ B): Coi mỗi đơn hàng là một phép thử trong không gian mẫu |D|. Tần suất thực nghiệm Supp = σ(A ∪ B)/|D| chính là ước lượng xác suất P(A ∩ B). Chia cho |D| để chuẩn hóa về [0, 1] giúp so sánh công bằng giữa siêu thị 200 đơn (100 đơn là 50%) và sàn Shopee 1 triệu đơn (100 đơn là 0.01% - nhiễu ngẫu nhiên).",
      "2. Confidence = Xác suất có điều kiện Bayes P(B | A): Định nghĩa toán học chuẩn P(B|A) = P(A ∩ B) / P(A). Ta thu hẹp không gian mẫu về biến cố đã xảy ra (khách đã mua A làm mẫu số), đếm ai lấy thêm B làm tử số. Vì P(B|A) ≠ P(A|B) nên sinh ra tính định hướng 1 chiều: Mua Ô tô -> Mua Bảo hiểm (95%), nhưng Mua Bảo hiểm -> Mua Ô tô chỉ 5%.",
      "3. LIFT = Tỷ số kiểm định độc lập thống kê: Theo xác suất, 2 biến cố độc lập khi P(A ∩ B) = P(A) × P(B) <=> P(B|A)/P(B) = 1. Do đó, Lift = Conf / Supp(B) đo mức độ chệch khỏi giả thuyết độc lập: Lift = 1 là độc lập ngẫu nhiên (như Túi Nilon ai cũng lấy, A không có công lao gì); Lift > 1 chứng minh món A thực sự kích cầu kéo doanh số B tăng vọt gấp X lần so với tự nhiên!",
      "Chỉ vào Chú giải ký hiệu ở chân slide: Tra cứu nhanh σ, |D|, chiều gợi ý A ⇒ B hoặc bấm phím K để mở Bảng tra cứu ký hiệu chuẩn."
    ]
  },
  5: {
    title: "Slide 5: Nguyên Lý Apriori & Tiên Đề Phản Đơn Điệu (Anti-monotonicity)",
    points: [
      "Nêu bật Tiên đề cốt lõi: '∀ X ⊆ Y ⇒ Support(Y) ≤ Support(X)'",
      "Định nghĩa rõ ràng hai tập X và Y: X là tập con (ví dụ món đơn {Bia}), Y là tập cha chứa X (ví dụ combo {Bia, Tã}).",
      "Trực giác đời thường chứng minh: Bất kỳ giỏ hàng nào có combo {Bia, Tã} đều bắt buộc phải có Bia. Ngược lại, có người chỉ mua riêng Bia. Vì thế số hóa đơn chứa combo Y không bao giờ vượt quá món con X!",
      "Hệ quả cắt tỉa vàng (Apriori Pruning): Nếu tập con X không đạt min_sup (ví dụ {Trứng} chỉ 1/7 đơn = 14% < 40%), thì chắc chắn mọi combo cha chứa nó ({Trứng, Sữa}, {Trứng, Bia}...) đều bị loại ngay lập tức mà không cần tốn thời gian đọc đĩa CSDL!",
      "Hiệu quả vượt trội: Tiết kiệm ngay hơn 95% công sức tính toán và chi phí I/O đọc ổ cứng."
    ]
  },
  6: {
    title: "Slide 6: Bóc Trần Ảo Giác & Bí Mật Kinh Doanh Của Lift",
    points: [
      "Chỉ vào Bảng vai trò bổ trợ 3 cột bên trái: Tóm tắt nhanh rủi ro nếu thiếu bất kỳ chỉ số nào.",
      "Kể câu chuyện đối chiếu 2 luật bên phải để tạo khoảnh khắc 'Aha!' cho người nghe: Luật ảo Túi Nilon (Conf 90% nhưng vô ích) vs Mỏ vàng Bia & Tã (Conf 35% nhưng Lift 3.5x).",
      "💡 Mẹo giải thích min_sup & min_conf: 'Đây là siêu tham số do con người tự đề ra dựa trên bài toán. Demo 10 đơn thì đặt 40%, nhưng Big Data Shopee hàng triệu đơn thì phải đặt 0.5% - 2% để không bỏ sót mỏ vàng!'",
      "Tuyên ngôn đắt giá: 'Confidence đo xác suất xảy ra, còn LIFT đo hiệu quả kích cầu thực sự. Doanh nghiệp chi tiền cho luật có LIFT cao nhất!'"
    ]
  },
  7: {
    title: "Slide 7: Ghép Cặp & Tỉa Cành (Join & Prune)",
    points: [
      "Giải thích thuật ngữ chuẩn: L_k (Large/Frequent itemsets - tập phổ biến vượt ngưỡng min_sup), C_k (Candidate itemsets - tập ứng viên sinh ra chờ đếm), ⨝ (phép ghép có điều kiện).",
      "Mô tả 2 bước như trò chơi ghép hình thông minh:",
      "Bước 1 (Join): Ghép hai tập L_{k-1} có thứ tự từ điển A → Z trùng nhau đúng (k-2) món đầu để sinh C_k (tránh sinh trùng lặp). Ví dụ: [Bia, Bơ] ⨝ [Bia, Sữa] cùng chung 'Bia' -> sinh ứng viên [Bia, Bơ, Sữa] ∈ C_3.",
      "Bước 2 (Prune): Chưa vội quét CSDL! Kiểm tra checklist 3 tập con 2 món của [Bia, Bơ, Sữa]: [Bia, Bơ] ∈ L_2 (Đạt), [Bia, Sữa] ∈ L_2 (Đạt), nhưng [Bơ, Sữa] ∉ L_2 (Bị loại từ trước).",
      "Chốt hạ: Chỉ cần 1 tập con bị loại, gạch bỏ ngay combo [Bia, Bơ, Sữa] mà không cần quét đĩa CSDL, giúp tiết kiệm hơn 80% - 90% phép duyệt thử."
    ]
  },
  8: {
    title: "Slide 8: Biến Dữ Liệu Thành Doanh Thu & Ứng Dụng Thực Chiến",
    points: [
      "Giải thích công thức sinh luật: Từ tập phổ biến I ∈ L_k, phân rã thành tiền đề A và hệ quả B, kiểm tra Conf ≥ min_conf và Lift > 1.0.",
      "3 Ứng dụng thực chiến tạo doanh thu triệu đô:",
      "1. Bố trí kệ hàng siêu thị (Cross-merchandising): Đặt cạnh nhau trên lối đi chính để tiện tay nhặt thêm.",
      "2. Đóng gói combo & flash sale: Giảm 5% khi mua cả đôi để tăng giá trị đơn hàng trung bình (AOV).",
      "3. Gợi ý thông minh trên E-commerce: Widget 'Thường được mua cùng nhau' khi khách chuẩn bị checkout.",
      "Chiến lược ROI: Kết hợp Lift với biên lợi nhuận của sản phẩm B để tối ưu hóa lợi nhuận ròng."
    ]
  },
  9: {
    title: "Slide 9: Giới thiệu Live Demo",
    points: [
      "Dẫn dắt: 'Nói lý thuyết thế đủ rồi, bây giờ chúng ta hãy xem thuật toán chạy thực tế trên từng dòng dữ liệu.'",
      "Nhấn phím 'D' hoặc bấm nút để chuyển ngay sang màn hình mô phỏng tương tác trực quan."
    ]
  },
  10: {
    title: "Slide 10: Ưu Điểm, Giới Hạn & Kế Thừa (FP-Growth)",
    points: [
      "Đánh giá khách quan: Apriori mở đường cho Data Mining nhưng có 2 điểm nghẽn: đọc đĩa k lần và bùng nổ tập ứng viên C_k.",
      "Giới thiệu bước nhảy vọt FP-Growth (Han et al., 2000): Nén CSDL vào cây FP-Tree qua đúng 2 lần quét, dùng đệ quy chia để trị, hoàn toàn không sinh ứng viên, nhanh hơn 10x - 100x!",
      "💡 Mẹo trả lời Q&A (Nếu hội đồng hỏi tại sao chỉ demo Apriori mà không demo FP-Growth):",
      "➔ 'Mục tiêu của bài này là làm sáng tỏ bản chất toán học của luật kết hợp, triết lý tỉa cành (Anti-monotonicity) và 3 lớp lọc kinh doanh. Apriori là chuẩn mực sư phạm trực quan nhất cho mục tiêu này. FP-Growth là cải tiến tối ưu hóa cấu trúc dữ liệu cho bước tiếp theo.'"
    ]
  },
  11: {
    title: "Slide 11: 3 Bài Học Lớn & Thảo Luận (Key Takeaways)",
    points: [
      "Khắc sâu 3 thông điệp đắt giá trước khi kết thúc:",
      "1. Tư duy thuật toán: Không gian tổ hợp 2^d - 1 là cạm bẫy chết người. Apriori giải quyết bằng cách tỉa cành Anti-monotonicity ngay từ gốc thay vì duyệt vét cạn ngây thơ.",
      "2. Tư duy số liệu: Đừng bao giờ dừng lại ở Confidence (tránh bẫy Túi Nilon). Phải dùng LIFT để kiểm chứng giá trị kích cầu thực tế.",
      "3. Tầm vóc thực tiễn: Hiểu vững Apriori là chìa khóa vàng mở đường vào các Recommender Systems và bước đệm sang thuật toán tối ưu bộ nhớ FP-Growth.",
      "Lời kết: 'Dữ liệu không nói dối — chỉ có cách chúng ta giải mã dữ liệu có đủ thông minh hay không!'",
      "Mời Thầy Cô và các bạn đặt câu hỏi. Sẵn sàng bấm phím 'D' để biểu diễn lại bất kỳ kịch bản nào trên bộ mô phỏng."
    ]
  }
};

class PresentationController {
  constructor() {
    this.slides = [];
    this.currentIndex = 0;
    this.isNotesOpen = false;

    this.cacheElements();
    this.bindEvents();
    this.initSlides();
  }

  cacheElements() {
    this.slidesContainer = document.getElementById('slides-viewport');
    this.slideCounterCurrent = document.getElementById('slide-counter-current');
    this.slideCounterTotal = document.getElementById('slide-counter-total');
    this.progressFill = document.getElementById('slide-progress-fill');
    
    this.btnPrev = document.getElementById('btn-slide-prev');
    this.btnNext = document.getElementById('btn-slide-next');
    this.btnNotes = document.getElementById('btn-toggle-notes');
    this.btnFullscreen = document.getElementById('btn-toggle-fullscreen');
    this.btnOverview = document.getElementById('btn-toggle-overview');
    this.btnHelp = document.getElementById('btn-toggle-help');
    
    this.notesDrawer = document.getElementById('notes-drawer');
    this.notesTitle = document.getElementById('notes-title');
    this.notesContent = document.getElementById('notes-content');
    
    this.overviewModal = document.getElementById('modal-overview');
    this.overviewGrid = document.getElementById('overview-grid');
    this.helpModal = document.getElementById('modal-help');
    this.scenarioModal = document.getElementById('modal-scenario');
    this.glossaryModal = document.getElementById('modal-math-glossary');
    this.exportModal = document.getElementById('modal-export');
    this.btnExport = document.getElementById('btn-toggle-export');
  }

  initSlides() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    if (this.slideCounterTotal) {
      this.slideCounterTotal.textContent = this.slides.length;
    }
    this.buildOverviewGrid();
    this.goToSlide(0);
  }

  bindEvents() {
    // Buttons
    if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prevSlide());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextSlide());
    if (this.btnNotes) this.btnNotes.addEventListener('click', () => this.toggleNotes());
    if (this.btnFullscreen) this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    if (this.btnOverview) this.btnOverview.addEventListener('click', () => this.toggleOverview());
    if (this.btnHelp) this.btnHelp.addEventListener('click', () => this.toggleHelp());
    if (this.btnExport) this.btnExport.addEventListener('click', () => this.toggleExportModal());

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Do not trigger if typing inside an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
        case 'PageDown':
          e.preventDefault();
          this.nextSlide();
          break;

        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prevSlide();
          break;

        case 'Home':
          e.preventDefault();
          this.goToSlide(0);
          break;

        case 'End':
          e.preventDefault();
          this.goToSlide(this.slides.length - 1);
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          this.toggleFullscreen();
          break;

        case 'n':
        case 'N':
          e.preventDefault();
          this.toggleNotes();
          break;

        case 'o':
        case 'O':
          e.preventDefault();
          this.toggleOverview();
          break;

        case '?':
        case 'h':
        case 'H':
          e.preventDefault();
          this.toggleHelp();
          break;

        case 'd':
        case 'D':
          e.preventDefault();
          if (window.App) window.App.toggleView();
          break;

        case 's':
        case 'S':
          e.preventDefault();
          this.toggleScenarioModal();
          break;

        case 'k':
        case 'K':
          e.preventDefault();
          this.toggleGlossaryModal();
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          this.toggleExportModal();
          break;

        case 'Escape':
          this.closeAllModals();
          break;
      }
    });

    // Touch Swipe Gestures for Mobile
    const touchTarget = this.slidesContainer || document.querySelector('.slides-viewport') || document.querySelector('.slide-stage');
    if (touchTarget) {
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;

      touchTarget.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      }, { passive: true });

      touchTarget.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
          const touchEndX = e.changedTouches[0].clientX;
          const touchEndY = e.changedTouches[0].clientY;
          const deltaX = touchEndX - touchStartX;
          const deltaY = touchEndY - touchStartY;
          const elapsedTime = Date.now() - touchStartTime;

          // Check if swipe is predominantly horizontal and meets distance threshold
          const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
          const isFastOrLong = Math.abs(deltaX) >= 45 || (Math.abs(deltaX) >= 30 && elapsedTime < 300);

          if (isHorizontalSwipe && isFastOrLong) {
            if (deltaX < 0) {
              // Swiped left -> Next slide
              this.nextSlide();
            } else {
              // Swiped right -> Previous slide
              this.prevSlide();
            }
          }
        }
      }, { passive: true });
    }
  }

  goToSlide(index) {
    if (index < 0 || index >= this.slides.length) return;

    this.slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev');
      if (i < index) {
        slide.classList.add('prev');
      } else if (i === index) {
        slide.classList.add('active');
      }
    });

    this.currentIndex = index;
    this.updateUI();
    this.updateNotes();
    this.closeModal(this.overviewModal);
  }

  nextSlide() {
    if (this.currentIndex < this.slides.length - 1) {
      this.goToSlide(this.currentIndex + 1);
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.goToSlide(this.currentIndex - 1);
    }
  }

  updateUI() {
    if (this.slideCounterCurrent) {
      this.slideCounterCurrent.textContent = this.currentIndex + 1;
    }

    if (this.progressFill) {
      const pct = ((this.currentIndex + 1) / this.slides.length) * 100;
      this.progressFill.style.width = `${pct}%`;
    }

    if (this.btnPrev) this.btnPrev.disabled = this.currentIndex === 0;
    if (this.btnNext) this.btnNext.disabled = this.currentIndex === this.slides.length - 1;

    // Update active state in overview modal
    const cards = document.querySelectorAll('.overview-card');
    cards.forEach((card, i) => {
      if (i === this.currentIndex) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  updateNotes() {
    const slideNum = this.currentIndex + 1;
    const noteData = SPEAKER_NOTES[slideNum];

    if (!noteData) {
      this.notesTitle.textContent = `Slide ${slideNum}`;
      this.notesContent.innerHTML = '<p>Không có ghi chú đặc biệt cho slide này.</p>';
      return;
    }

    this.notesTitle.innerHTML = `<span>🎙️</span> ${noteData.title}`;
    this.notesContent.innerHTML = `
      <ul>
        ${noteData.points.map(pt => `<li>${pt}</li>`).join('')}
      </ul>
    `;
  }

  toggleNotes() {
    this.isNotesOpen = !this.isNotesOpen;
    if (this.notesDrawer) {
      this.notesDrawer.classList.toggle('open', this.isNotesOpen);
    }
    if (this.btnNotes) {
      this.btnNotes.classList.toggle('active', this.isNotesOpen);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  toggleOverview() {
    if (!this.overviewModal) return;
    this.overviewModal.classList.toggle('open');
  }

  toggleHelp() {
    if (!this.helpModal) return;
    this.helpModal.classList.toggle('open');
  }

  toggleScenarioModal() {
    if (!this.scenarioModal) return;
    this.scenarioModal.classList.toggle('open');
  }

  toggleGlossaryModal() {
    if (!this.glossaryModal) return;
    this.glossaryModal.classList.toggle('open');
  }

  toggleExportModal() {
    if (!this.exportModal) return;
    this.exportModal.classList.toggle('open');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('open');
  }

  closeAllModals() {
    if (this.overviewModal) this.overviewModal.classList.remove('open');
    if (this.helpModal) this.helpModal.classList.remove('open');
    if (this.scenarioModal) this.scenarioModal.classList.remove('open');
    if (this.glossaryModal) this.glossaryModal.classList.remove('open');
    if (this.exportModal) this.exportModal.classList.remove('open');
    if (this.isNotesOpen) this.toggleNotes();
  }

  buildOverviewGrid() {
    if (!this.overviewGrid) return;
    this.overviewGrid.innerHTML = this.slides.map((slide, i) => {
      const titleEl = slide.querySelector('.slide-title');
      const tagEl = slide.querySelector('.slide-tag');
      const titleText = titleEl ? titleEl.textContent.trim() : `Slide ${i + 1}`;
      const tagText = tagEl ? tagEl.textContent.trim() : `Phần ${i + 1}`;

      return `
        <div class="overview-card ${i === 0 ? 'active' : ''}" onclick="window.presentationController.goToSlide(${i})">
          <div class="overview-card-num">${tagText} • #${i + 1}</div>
          <div class="overview-card-title">${titleText}</div>
        </div>
      `;
    }).join('');
  }
}

// Global helper: Toggle Formula Rationale Drawer on Slide 4
window.toggleFormulaWhy = function(id) {
  const drawer = document.getElementById(`formula-why-${id}`);
  const icon = document.getElementById(`why-icon-${id}`);
  if (!drawer) return;
  const isHidden = drawer.style.display === 'none' || getComputedStyle(drawer).display === 'none';
  if (isHidden) {
    drawer.style.display = 'block';
    if (icon) icon.textContent = '▲';
  } else {
    drawer.style.display = 'none';
    if (icon) icon.textContent = '▼';
  }
};

if (typeof window !== 'undefined') {
  window.PresentationController = PresentationController;
} else if (typeof globalThis !== 'undefined') {
  globalThis.PresentationController = PresentationController;
}

