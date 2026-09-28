/**
 * Apriori Algorithm Interactive Visualizer
 * Manages step-by-step animation, transaction highlight glow,
 * candidate pruning transitions, and rules presentation.
 */

class AprioriVisualizer {
  constructor() {
    const g = typeof window !== 'undefined' ? window : globalThis;
    const initialPreset = (g.PRESET_DATASETS && g.PRESET_DATASETS.supermarket) 
      ? g.PRESET_DATASETS.supermarket 
      : { transactions: [], itemMeta: {}, defaultMinSupport: 40, defaultMinConfidence: 60, name: 'Mặc định' };
    
    this.originalDataset = this.cloneDataset(initialPreset);
    this.dataset = this.cloneDataset(initialPreset);
    
    this.minSupport = this.dataset.defaultMinSupport || 40;
    this.minConfidence = this.dataset.defaultMinConfidence || 60;
    
    this.traceData = null;
    this.currentStep = -1;
    this.isPlaying = false;
    this.playTimer = null;
    this.speed = 1; // 0.5x, 1x, 1.5x, 2x
    this.candidateStatsMap = new Map();
    this.renderedRules = [];
    this.selectedQuickItems = new Set();
    this.isQuickAddCollapsed = false;

    // Provide global aliases immediately
    if (typeof window !== 'undefined') {
      window.visualizer = this;
      window.simulatorVisualizer = this;
    }

    this.cacheElements();
    this.bindEvents();
    this.initTooltips();
    this.init();
  }

  static getCardId(itemset) {
    return 'cand_' + itemset.map(i => encodeURIComponent(i).replace(/[^a-zA-Z0-9]/g, '_')).join('__');
  }

  cacheElements() {
    // Sliders & Values
    this.minSuppSlider = document.getElementById('min-supp-slider');
    this.minSuppVal = document.getElementById('min-supp-val');
    this.minConfSlider = document.getElementById('min-conf-slider');
    this.minConfVal = document.getElementById('min-conf-val');

    // Controls
    this.btnPlay = document.getElementById('sim-btn-play');
    this.btnNext = document.getElementById('sim-btn-next');
    this.btnPrev = document.getElementById('sim-btn-prev');
    this.btnReset = document.getElementById('sim-btn-reset');
    this.btnEnd = document.getElementById('sim-btn-end');
    this.speedSelect = document.getElementById('sim-speed-select');
    this.stepIndicator = document.getElementById('step-indicator-text');
    this.stepDot = document.getElementById('step-indicator-dot');

    // Display Areas
    this.transactionsList = document.getElementById('transactions-list');
    this.candidatesGrid = document.getElementById('candidates-grid');
    this.frequentPillsContainer = document.getElementById('frequent-pills-container');
    this.rulesList = document.getElementById('rules-list');
    this.logConsole = document.getElementById('log-console');
    this.totalTxBadge = document.getElementById('total-tx-badge');

    // Quick Add Elements
    this.quickAddContainer = document.getElementById('quick-add-container');
    this.btnToggleQuickAdd = document.getElementById('btn-toggle-quick-add');
    this.quickAddToggleIcon = document.getElementById('quick-add-toggle-icon');
    this.quickAddToggleText = document.getElementById('quick-add-toggle-text');
    this.quickAddChipsContainer = document.getElementById('quick-add-chips-container');
    this.btnSubmitQuickAdd = document.getElementById('btn-submit-quick-add');
    this.btnRandomQuickAdd = document.getElementById('btn-random-quick-add');
    this.btnResetDataset = document.getElementById('btn-reset-dataset');
    this.quickAddNextTid = document.getElementById('quick-add-next-tid');
    this.quickAddCountTag = document.getElementById('quick-add-count-tag');
    this.quickAddCustomInput = document.getElementById('quick-add-custom-input');
    this.btnAddCustomItem = document.getElementById('btn-add-custom-item');

    // Tab switcher elements
    this.tabBtnLog = document.getElementById('tab-btn-log');
    this.tabBtnRules = document.getElementById('tab-btn-rules');
    this.tabRulesCountBadge = document.getElementById('tab-rules-count-badge');

    // Inspector Elements & Tooltips
    this.inspectorCard = document.getElementById('step-inspector-card');
    this.inspectorPhaseTitle = document.getElementById('inspector-phase-title');
    this.inspectorKBadge = document.getElementById('inspector-k-badge');
    this.inspectorActionText = document.getElementById('inspector-action-text');
    this.bubbleWhyTitle = document.getElementById('bubble-why-title');
    this.bubbleWhyDetail = document.getElementById('bubble-why-detail');
    this.inspectorMathDisplay = document.getElementById('inspector-math-display');
    this.floatTooltip = document.getElementById('float-tooltip');
  }

  bindEvents() {
    if (this.minSuppSlider) {
      this.minSuppSlider.addEventListener('input', (e) => {
        this.minSupport = parseInt(e.target.value, 10);
        if (this.minSuppVal) this.minSuppVal.textContent = `${this.minSupport}%`;
        this.recompute();
      });
    }

    if (this.minConfSlider) {
      this.minConfSlider.addEventListener('input', (e) => {
        this.minConfidence = parseInt(e.target.value, 10);
        if (this.minConfVal) this.minConfVal.textContent = `${this.minConfidence}%`;
        this.recompute();
      });
    }

    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.stepForward());
    }

    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.stepBackward());
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }

    if (this.btnEnd) {
      this.btnEnd.addEventListener('click', () => this.runToEnd());
    }

    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (e) => {
        this.speed = parseFloat(e.target.value);
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    }

    // Quick Add Handlers
    if (this.btnToggleQuickAdd) {
      this.btnToggleQuickAdd.addEventListener('click', () => this.toggleQuickAdd());
    }

    if (this.btnSubmitQuickAdd) {
      this.btnSubmitQuickAdd.addEventListener('click', () => this.submitQuickAdd());
    }

    if (this.btnRandomQuickAdd) {
      this.btnRandomQuickAdd.addEventListener('click', () => this.randomQuickAdd());
    }

    if (this.btnResetDataset) {
      this.btnResetDataset.addEventListener('click', () => this.resetDatasetToPreset());
    }

    if (this.btnAddCustomItem) {
      this.btnAddCustomItem.addEventListener('click', () => this.handleCustomItemAdd());
    }

    if (this.quickAddCustomInput) {
      this.quickAddCustomInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleCustomItemAdd();
        }
      });
    }

    // Direct binding for right panel tabs (failsafe)
    if (this.tabBtnLog) {
      this.tabBtnLog.addEventListener('click', () => this.switchRightPanelTab('log'));
    }

    if (this.tabBtnRules) {
      this.tabBtnRules.addEventListener('click', () => this.switchRightPanelTab('rules'));
    }
  }

  initTooltips() {
    const tooltip = this.floatTooltip;
    if (!tooltip) return;

    // Hover on Candidate Cards Grid
    if (this.candidatesGrid) {
      this.candidatesGrid.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.itemset-card');
        if (!card) return;
        this.showCandidateTooltip(card, e);
      });

      this.candidatesGrid.addEventListener('mousemove', (e) => {
        if (tooltip.classList.contains('visible')) {
          this.positionTooltip(e);
        }
      });

      this.candidatesGrid.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.itemset-card');
        if (!card || card.contains(e.relatedTarget)) return;
        tooltip.classList.remove('visible');
      });
    }

    // Hover on Rules List
    if (this.rulesList) {
      this.rulesList.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.rule-card');
        if (!card) return;
        this.showRuleTooltip(card, e);
      });

      this.rulesList.addEventListener('mousemove', (e) => {
        if (tooltip.classList.contains('visible')) {
          this.positionTooltip(e);
        }
      });

      this.rulesList.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.rule-card');
        if (!card || card.contains(e.relatedTarget)) return;
        tooltip.classList.remove('visible');
      });
    }
  }

  positionTooltip(e) {
    if (!this.floatTooltip) return;
    const tt = this.floatTooltip;
    const padding = 14;
    let x = e.clientX + padding;
    let y = e.clientY + padding;

    const rect = tt.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) {
      x = e.clientX - rect.width - 12;
    }
    if (y + rect.height > window.innerHeight - 10) {
      y = e.clientY - rect.height - 12;
    }

    tt.style.left = `${Math.max(10, x)}px`;
    tt.style.top = `${Math.max(10, y)}px`;
  }

  showCandidateTooltip(card, e) {
    const tooltip = this.floatTooltip;
    if (!tooltip) return;

    const raw = card.getAttribute('data-itemset');
    let itemset = [];
    try {
      itemset = JSON.parse(decodeURIComponent(raw));
    } catch(err) {}

    const cardId = AprioriVisualizer.getCardId(itemset);
    const stats = this.candidateStatsMap.get(cardId) || {};
    
    const itemsLabel = itemset.map(i => {
      const meta = this.dataset.itemMeta[i] || { icon: '📦' };
      return `${meta.icon} ${i}`;
    }).join(' + ');

    let statusBadge = '';
    let explainerText = '';

    if (card.classList.contains('pruned')) {
      statusBadge = '<span class="badge badge-pruned">✂️ Tỉa nhánh (Pruned)</span>';
      explainerText = stats.reason || 'Tiên đề Apriori: Chứa ít nhất một tập con không thuộc tập phổ biến L vòng trước.';
    } else if (card.classList.contains('frequent')) {
      statusBadge = '<span class="badge badge-frequent">✅ Đạt chuẩn (Frequent)</span>';
      explainerText = `Combo này xuất hiện trong <strong>${stats.count || 0}/${this.dataset.transactions.length}</strong> giỏ hàng (${((stats.ratio || 0) * 100).toFixed(0)}%), vượt qua ngưỡng ${this.minSupport}%.`;
    } else if (stats.tested) {
      statusBadge = '<span class="badge badge-pruned">❌ Không đủ tần số</span>';
      explainerText = `Chỉ xuất hiện ${stats.count || 0}/${this.dataset.transactions.length} lần (${((stats.ratio || 0) * 100).toFixed(0)}%), dưới ngưỡng ${this.minSupport}%. Bị loại khỏi các vòng sau.`;
    } else {
      statusBadge = '<span class="badge badge-candidate">⏳ Đang chờ quét</span>';
      explainerText = 'Tập ứng viên đang nằm trong hàng đợi để quét cơ sở dữ liệu.';
    }

    const tidsText = (stats.matchedTids && stats.matchedTids.length > 0)
      ? stats.matchedTids.map(t => `<span class="tid-badge">${t}</span>`).join(' ')
      : (card.classList.contains('pruned') ? '<em>(Gạch bỏ ngay, không cần quét)</em>' : '<em>(Đang chờ quét)</em>');

    tooltip.innerHTML = `
      <div class="float-tooltip-header">
        <span>${itemsLabel}</span>
        ${statusBadge}
      </div>
      <div class="float-tooltip-body">
        <p style="margin-bottom: 6px;">${explainerText}</p>
        <div style="font-size: 0.75rem; color: var(--text-dim); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span>🛒 Giỏ hàng khớp:</span> ${tidsText}
        </div>
      </div>
      <div class="float-tooltip-footer" style="color: var(--accent-cyan);">
        Support: ${stats.ratio ? (stats.ratio * 100).toFixed(0) + '%' : 'Đang chờ'} (Yêu cầu tối thiểu ≥ ${this.minSupport}%)
      </div>
    `;

    tooltip.classList.add('visible');
    this.positionTooltip(e);
  }

  showRuleTooltip(card, e) {
    const tooltip = this.floatTooltip;
    if (!tooltip || !this.renderedRules) return;

    const idx = parseInt(card.getAttribute('data-rule-idx'), 10);
    const r = this.renderedRules[idx];
    if (!r) return;

    const ant = r.antecedent.map(a => {
      const meta = this.dataset.itemMeta[a] || { icon: '📦' };
      return `${meta.icon} ${a}`;
    }).join(' + ');

    const con = r.consequent.map(c => {
      const meta = this.dataset.itemMeta[c] || { icon: '📦' };
      return `${meta.icon} ${c}`;
    }).join(' + ');

    let liftAssessment = '';
    if (r.lift > 1.25) {
      liftAssessment = `<strong style="color: #34d399;">Kích cầu rất mạnh (+${((r.lift - 1) * 100).toFixed(0)}%):</strong> Khách mua [${r.antecedent.join(', ')}] có xu hướng mua thêm [${r.consequent.join(', ')}] cao hơn hẳn ngẫu nhiên. Rất nên tạo combo hoặc đặt cạnh nhau!`;
    } else if (r.lift >= 1) {
      liftAssessment = `<strong style="color: #38bdf8;">Tương quan độc lập:</strong> Hai món này bán chạy độc lập, hành vi mua [${r.antecedent.join(', ')}] không làm tăng hay giảm nhu cầu mua [${r.consequent.join(', ')}].`;
    } else {
      liftAssessment = `<strong style="color: #f87171;">Tương quan âm (Kỵ nhau):</strong> Khách đã mua [${r.antecedent.join(', ')}] thực chất ÍT mua [${r.consequent.join(', ')}] hơn người bình thường! Không nên bundle chung.`;
    }

    tooltip.innerHTML = `
      <div class="float-tooltip-header">
        <span>[ ${ant} ] ➔ [ ${con} ]</span>
        <span class="badge badge-rule">Lift: ${r.lift.toFixed(2)}</span>
      </div>
      <div class="float-tooltip-body">
        <div style="margin-bottom: 6px; color: #fff;">
          🎯 <strong>Ý nghĩa xác suất:</strong> Khi khách đã có [${r.antecedent.join(', ')}] trong giỏ, xác suất họ lấy tiếp [${r.consequent.join(', ')}] là <strong>${(r.confidence * 100).toFixed(0)}%</strong>.
        </div>
        <div style="font-size: 0.78rem; line-height: 1.45; border-left: 2px solid var(--accent-cyan); padding-left: 6px; margin-top: 4px;">
          💼 <strong>Khuyến nghị kinh doanh:</strong> ${liftAssessment}
        </div>
      </div>
      <div class="float-tooltip-footer" style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim);">
        <span>Supp: ${(r.support * 100).toFixed(0)}%</span>
        <span>Conf: ${(r.confidence * 100).toFixed(0)}%</span>
        <span style="color: #fff; font-weight: 700;">Lift: ${r.lift.toFixed(2)}</span>
      </div>
    `;

    tooltip.classList.add('visible');
    this.positionTooltip(e);
  }

  static sortTransactionsDesc(transactions) {
    if (!Array.isArray(transactions)) return [];
    return [...transactions].sort((a, b) => {
      const matchA = (a.tid || '').match(/^([A-Za-z]+)(\d+)$/);
      const matchB = (b.tid || '').match(/^([A-Za-z]+)(\d+)$/);
      if (matchA && matchB) {
        if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
        return parseInt(matchB[2], 10) - parseInt(matchA[2], 10);
      }
      return (b.tid || '').localeCompare(a.tid || '');
    });
  }

  cloneDataset(source) {
    if (!source) return { transactions: [], itemMeta: {}, defaultMinSupport: 40, defaultMinConfidence: 60, name: 'Mặc định' };
    const sortedTxs = AprioriVisualizer.sortTransactionsDesc(source.transactions || []);
    return {
      ...source,
      itemMeta: { ...source.itemMeta },
      transactions: sortedTxs.map(tx => ({
        tid: tx.tid,
        items: [...tx.items],
        isCustom: !!tx.isCustom
      }))
    };
  }

  getNextTid() {
    const txs = this.dataset.transactions;
    if (!txs || txs.length === 0) return 'T100';
    let maxNum = 0;
    let prefix = 'T';
    for (const tx of txs) {
      const match = tx.tid.match(/^([A-Za-z]+)(\d+)$/);
      if (match) {
        prefix = match[1];
        const num = parseInt(match[2], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    if (maxNum > 0) {
      const step = (maxNum >= 100 && maxNum % 100 === 0) ? 100 : 1;
      return `${prefix}${maxNum + step}`;
    }
    return `T${txs.length + 1}`;
  }

  renderQuickAddChips() {
    if (!this.quickAddChipsContainer) return;
    
    // Collect unique items from current dataset itemMeta & transactions
    const allItemsSet = new Set(Object.keys(this.dataset.itemMeta || {}));
    for (const tx of this.dataset.transactions) {
      for (const item of tx.items) {
        allItemsSet.add(item);
      }
    }
    const allItems = Array.from(allItemsSet);

    this.quickAddChipsContainer.innerHTML = allItems.map(item => {
      const meta = (this.dataset.itemMeta && this.dataset.itemMeta[item]) || { icon: '📦' };
      const isSelected = this.selectedQuickItems.has(item);
      return `
        <div class="quick-chip ${isSelected ? 'selected' : ''}" data-item="${item}" title="Click để thêm/bỏ [${item}] vào giỏ mới">
          <span>${meta.icon}</span>
          <span>${item}</span>
          ${isSelected ? '<span style="font-weight:800; color:#34d399; margin-left: 2px;">✓</span>' : ''}
        </div>
      `;
    }).join('');

    // Bind chip click events
    this.quickAddChipsContainer.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const item = chip.getAttribute('data-item');
        if (this.selectedQuickItems.has(item)) {
          this.selectedQuickItems.delete(item);
        } else {
          this.selectedQuickItems.add(item);
        }
        this.renderQuickAddChips();
      });
    });

    this.updateQuickAddState();
  }

  updateQuickAddState() {
    const nextTid = this.getNextTid();
    if (this.quickAddNextTid) {
      this.quickAddNextTid.textContent = nextTid;
    }
    const count = this.selectedQuickItems.size;
    if (this.quickAddCountTag) {
      this.quickAddCountTag.textContent = `${count} món`;
    }
    if (this.btnSubmitQuickAdd) {
      this.btnSubmitQuickAdd.disabled = false;
      if (count > 0) {
        this.btnSubmitQuickAdd.classList.remove('empty');
        this.btnSubmitQuickAdd.innerHTML = `<span>➕ Thêm Đơn <strong style="font-family: var(--font-mono); font-size: 0.95rem;">${nextTid}</strong> Theo Món Đã Chọn</span> <span class="quick-add-count-tag">${count} món</span>`;
        this.btnSubmitQuickAdd.title = `Thêm ngay giỏ hàng ${nextTid} với ${count} món đã chọn vào đầu CSDL`;
      } else {
        this.btnSubmitQuickAdd.classList.add('empty');
        this.btnSubmitQuickAdd.innerHTML = `<span>➕ Thêm Đơn <strong style="font-family: var(--font-mono); font-size: 0.95rem;">${nextTid}</strong> Theo Món Đã Chọn</span> <span class="quick-add-count-tag">0 món</span>`;
        this.btnSubmitQuickAdd.title = `Vui lòng click chọn ít nhất 1 món ở trên để tạo đơn mới ${nextTid}`;
      }
    }
  }

  toggleQuickAdd() {
    this.isQuickAddCollapsed = !this.isQuickAddCollapsed;
    if (this.quickAddContainer) {
      this.quickAddContainer.classList.toggle('collapsed', this.isQuickAddCollapsed);
    }
    if (this.btnToggleQuickAdd) {
      this.btnToggleQuickAdd.classList.toggle('active', !this.isQuickAddCollapsed);
    }
    if (this.quickAddToggleIcon) {
      this.quickAddToggleIcon.textContent = this.isQuickAddCollapsed ? '➕' : '−';
    }
    if (this.quickAddToggleText) {
      this.quickAddToggleText.textContent = this.isQuickAddCollapsed ? 'Thêm đơn' : 'Thu gọn';
    }
  }

  submitQuickAdd() {
    const items = Array.from(this.selectedQuickItems);
    if (items.length === 0) {
      if (this.quickAddChipsContainer) {
        this.quickAddChipsContainer.classList.remove('shake-highlight');
        void this.quickAddChipsContainer.offsetWidth; // trigger DOM reflow for re-animation
        this.quickAddChipsContainer.classList.add('shake-highlight');
        setTimeout(() => {
          if (this.quickAddChipsContainer) this.quickAddChipsContainer.classList.remove('shake-highlight');
        }, 800);
      }
      this.addLog(`⚠️ Vui lòng click chọn ít nhất 1 món ở danh sách trên (hoặc bấm "🎲 Bốc ngẫu nhiên" bên dưới) để tạo đơn!`, 'warn');
      return;
    }

    const nextTid = this.getNextTid();

    // Insert at the beginning of transactions array (unshift) so it appears immediately on top!
    this.dataset.transactions.unshift({
      tid: nextTid,
      items: items,
      isCustom: true
    });

    this.selectedQuickItems.clear();
    this.init(false); // Preserve log

    this.addLog(`[THÊM ĐƠN] Đã tạo thành công đơn hàng mới ở đầu danh sách <strong>${nextTid}</strong>: {${items.join(', ')}}. CSDL có <strong>${this.dataset.transactions.length}</strong> đơn.`, 'success');

    // Scroll to the top of transaction list
    if (this.transactionsList) {
      this.transactionsList.scrollTop = 0;
    }

    // Highlight and animate newly prepended row
    setTimeout(() => {
      const newRow = document.getElementById(`tx-row-${nextTid}`);
      if (newRow) {
        if (typeof newRow.scrollIntoView === 'function') {
          newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        newRow.classList.add('scanning');
        setTimeout(() => newRow.classList.remove('scanning'), 1500);
      }
    }, 80);
  }

  randomQuickAdd() {
    const allItemsSet = new Set(Object.keys(this.dataset.itemMeta || {}));
    for (const tx of this.dataset.transactions) {
      for (const item of tx.items) {
        allItemsSet.add(item);
      }
    }
    const allItems = Array.from(allItemsSet);
    if (allItems.length === 0) return;

    // Pick 2 to 3 random items
    const numToPick = Math.min(allItems.length, Math.floor(Math.random() * 2) + 2);
    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, numToPick);

    this.selectedQuickItems = new Set(picked);
    this.submitQuickAdd();
  }

  deleteTransaction(tid) {
    if (this.dataset.transactions.length <= 1) {
      alert('Không thể xóa toàn bộ đơn hàng! CSDL cần tối thiểu 1 giao dịch để thuật toán hoạt động.');
      return;
    }
    const idx = this.dataset.transactions.findIndex(t => t.tid === tid);
    if (idx === -1) return;

    const removed = this.dataset.transactions.splice(idx, 1)[0];
    this.init(false); // Preserve log
    this.addLog(`[XÓA ĐƠN] Đã xóa giỏ hàng <strong>${tid}</strong>: {${removed.items.join(', ')}}. CSDL còn <strong>${this.dataset.transactions.length}</strong> đơn.`, 'warn');
  }

  resetDatasetToPreset() {
    this.dataset = this.cloneDataset(this.originalDataset);
    this.selectedQuickItems.clear();
    this.init(false);
    this.addLog(`[ĐẶT LẠI] Đã khôi phục CSDL gốc của kịch bản "${this.dataset.name}" (${this.dataset.transactions.length} đơn).`, 'info');
  }

  handleCustomItemAdd() {
    if (!this.quickAddCustomInput) return;
    const val = this.quickAddCustomInput.value.trim();
    if (!val) {
      this.quickAddCustomInput.focus();
      return;
    }

    if (!this.dataset.itemMeta) this.dataset.itemMeta = {};
    if (!this.dataset.itemMeta[val]) {
      this.dataset.itemMeta[val] = { icon: '✨', category: 'Custom' };
    }
    this.selectedQuickItems.add(val);
    this.quickAddCustomInput.value = '';
    this.renderQuickAddChips();
    this.addLog(`[MÓN MỚI] Đã tạo mặt hàng mới "${val}" và chọn vào giỏ hàng.`, 'info');
  }

  loadDataset(datasetKey) {
    const g = typeof window !== 'undefined' ? window : globalThis;
    if (g.PRESET_DATASETS && g.PRESET_DATASETS[datasetKey]) {
      this.originalDataset = this.cloneDataset(g.PRESET_DATASETS[datasetKey]);
      this.dataset = this.cloneDataset(g.PRESET_DATASETS[datasetKey]);
      this.selectedQuickItems.clear();
      this.minSupport = this.dataset.defaultMinSupport;
      this.minConfidence = this.dataset.defaultMinConfidence;
      
      if (this.minSuppSlider) {
        this.minSuppSlider.value = this.minSupport;
        if (this.minSuppVal) this.minSuppVal.textContent = `${this.minSupport}%`;
      }
      if (this.minConfSlider) {
        this.minConfSlider.value = this.minConfidence;
        if (this.minConfVal) this.minConfVal.textContent = `${this.minConfidence}%`;
      }

      this.init();
    }
  }

  init(clearLogs = true) {
    this.pause();
    this.renderQuickAddChips();
    this.renderTransactions();
    this.recompute(clearLogs);
  }

  recompute(clearLogs = true) {
    this.pause();
    const suppRatio = this.minSupport / 100;
    const confRatio = this.minConfidence / 100;
    const g = typeof window !== 'undefined' ? window : globalThis;

    if (g.AprioriEngine) {
      this.traceData = g.AprioriEngine.buildExecutionTrace(
        this.dataset.transactions,
        suppRatio,
        confRatio
      );
    }

    this.reset(clearLogs);
  }

  reset(clearLogs = true) {
    this.pause();
    this.currentStep = -1;
    this.clearHighlights();
    this.candidateStatsMap.clear();

    if (this.frequentPillsContainer) {
      this.frequentPillsContainer.innerHTML = '<span style="color: var(--text-dim); font-size: 0.8rem;">Chưa có tập phổ biến</span>';
    }
    if (this.rulesList) {
      this.rulesList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem; padding: 1rem;">Các luật kết hợp sẽ xuất hiện khi hoàn thành thuật toán.</div>';
    }
    if (this.tabRulesCountBadge) {
      this.tabRulesCountBadge.textContent = '0';
    }
    if (clearLogs && this.logConsole) {
      this.logConsole.innerHTML = '';
    }
    
    if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = 'KHỞI ĐỘNG THUẬT TOÁN';
    if (this.inspectorKBadge) this.inspectorKBadge.textContent = 'k = 1';
    if (this.inspectorActionText) this.inspectorActionText.textContent = `Sẵn sàng phân tích CSDL "${this.dataset.name}" (${this.dataset.transactions.length} giỏ hàng)`;
    if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = 'Bản chất thuật toán Apriori (Stanford CS246):';
    if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Theo nguyên lý quy nạp từ dưới lên (Bottom-up), Apriori duyệt từng mức combo từ 1 món (C₁) ➔ 2 món (C₂) ➔ ... Bấm <strong>"Tiếp"</strong> hoặc <strong>"Tự động"</strong> để bắt đầu quét!`;
    
    const minSuppCount = Math.ceil((this.minSupport / 100) * this.dataset.transactions.length);
    if (this.inspectorMathDisplay) {
      this.inspectorMathDisplay.innerHTML = `Tổng CSDL: <strong>${this.dataset.transactions.length} giỏ hàng</strong> • Min Support: <strong>${this.minSupport}%</strong> (≥ ${minSuppCount} lần) • Min Confidence: <strong>${this.minConfidence}%</strong>`;
    }
    if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card';
    
    const totalSteps = (this.traceData && this.traceData.trace) ? this.traceData.trace.length : 0;
    if (this.stepIndicator) this.stepIndicator.textContent = `Bước 0 / ${totalSteps}`;
    
    if (this.btnPrev) this.btnPrev.disabled = true;
    if (this.btnNext) this.btnNext.disabled = totalSteps === 0;

    // Immediately render C1 candidate pool so the workbench is lively
    if (this.traceData && this.traceData.trace) {
      const phase1 = this.traceData.trace.find(e => e.type === 'PHASE_START' && e.k === 1);
      if (phase1 && phase1.candidates) {
        this.renderCandidatesGridForLevel(phase1.candidates);
      } else if (this.candidatesGrid) {
        this.candidatesGrid.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem; padding: 1rem;">Nhấn "Tiếp" hoặc "Tự động" để bắt đầu.</div>';
      }
    }

    if (clearLogs) {
      this.switchRightPanelTab('log');
      this.addLog(`Đã tải kịch bản "${this.dataset.name}". Sẵn sàng phân tích.`, 'info');
    }
  }

  renderTransactions(matchedTids = [], activeItems = []) {
    if (!this.transactionsList) return;
    if (this.totalTxBadge) {
      this.totalTxBadge.textContent = `${this.dataset.transactions.length} giao dịch`;
    }

    const activeSet = new Set(activeItems || []);
    const matchedSet = new Set(matchedTids || []);

    this.transactionsList.innerHTML = this.dataset.transactions.map(tx => {
      const isMatched = matchedSet.has(tx.tid);
      const rowClass = isMatched ? 'transaction-row matched' : 'transaction-row';

      const pillsHtml = tx.items.map(item => {
        const meta = this.dataset.itemMeta[item] || { icon: '📦' };
        const isHighlight = activeSet.has(item);
        return `<span class="item-pill ${isHighlight ? 'highlight' : ''}">${meta.icon} ${item}</span>`;
      }).join('');

      return `
        <div class="${rowClass}" id="tx-row-${tx.tid}">
          <span class="tid-badge">${tx.tid}</span>
          <div class="item-pills-container">${pillsHtml}</div>
          ${tx.isCustom ? '<span class="tx-new-tag">MỚI ⭐</span>' : ''}
          ${isMatched ? '<span class="tx-match-tag">✓ Khớp (+1)</span>' : ''}
          <button class="btn-delete-tx" onclick="window.visualizer.deleteTransaction('${tx.tid}')" title="Xóa giỏ hàng ${tx.tid}">✕</button>
        </div>
      `;
    }).join('');
  }

  clearHighlights() {
    this.renderTransactions([], []);
  }

  stepForward() {
    if (!this.traceData || this.currentStep >= this.traceData.trace.length - 1) {
      this.pause();
      return;
    }

    this.currentStep++;
    this.renderCurrentStep(true);
    this.updateNavButtons();
  }

  stepBackward() {
    if (this.currentStep <= 0) {
      this.reset();
      return;
    }

    const target = this.currentStep - 1;
    this.reset();
    for (let i = 0; i <= target; i++) {
      this.currentStep = i;
      this.renderCurrentStep(false);
    }
    this.updateNavButtons();
  }

  runToEnd() {
    this.pause();
    if (!this.traceData || !this.traceData.trace || !this.traceData.trace.length) return;
    const target = this.traceData.trace.length - 1;

    for (let i = 0; i <= target; i++) {
      this.currentStep = i;
      this.renderCurrentStep(i === target);
    }
    this.updateNavButtons();
    this.addLog(`⚡ Đã chạy nhanh đến kết quả cuối cùng. Tìm được ${this.traceData.allFrequent.length} tập phổ biến và ${this.traceData.rules.length} luật kết hợp.`, 'success');
  }

  updateNavButtons() {
    if (!this.traceData || !this.traceData.trace) return;
    const total = this.traceData.trace.length;
    if (this.btnPrev) this.btnPrev.disabled = this.currentStep <= 0;
    if (this.btnNext) this.btnNext.disabled = this.currentStep >= total - 1;
    if (this.stepIndicator) this.stepIndicator.textContent = `Bước ${this.currentStep + 1} / ${total}`;
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.traceData || !this.traceData.trace) return;
    if (this.currentStep >= this.traceData.trace.length - 1) {
      this.reset();
    }
    this.isPlaying = true;
    if (this.btnPlay) {
      this.btnPlay.innerHTML = `<span>⏸</span> Tạm dừng`;
      this.btnPlay.classList.add('sim-btn-primary');
    }

    const interval = Math.max(350, 1400 / this.speed);
    this.playTimer = setInterval(() => {
      if (this.currentStep < this.traceData.trace.length - 1) {
        this.stepForward();
      } else {
        this.pause();
      }
    }, interval);
  }

  pause() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (this.btnPlay) {
      this.btnPlay.innerHTML = `<span>▶</span> Tự động`;
    }
  }

  renderCurrentStep(shouldLog = true) {
    if (!this.traceData || !this.traceData.trace) return;
    const event = this.traceData.trace[this.currentStep];
    if (!event) return;

    if (shouldLog) {
      let logType = 'info';
      if (event.type === 'TEST_CANDIDATE' && event.isFrequent) logType = 'success';
      if (event.type === 'PRUNED_BY_APRIORI') logType = 'warning';
      if (event.type === 'COMPLETE') logType = 'success';
      this.addLog(event.message, logType);
    }

    const totalTx = this.dataset.transactions.length;

    switch (event.type) {
      case 'INIT':
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `GIAI ĐOẠN 0 • KHỞI TẠO CSDL`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `k = 1`;
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Khởi động duyệt ${totalTx} giao dịch`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `Tại sao bắt đầu từ các món đơn lẻ (C₁)?`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Theo giáo trình Stanford CS246, để tìm combo lớn, tiên quyết phải tìm các món đơn lẻ bán chạy. Các món có tần số dưới ngưỡng ở vòng này sẽ bị loại vĩnh viễn khỏi các combo sau.`;
        if (this.inspectorMathDisplay) this.inspectorMathDisplay.innerHTML = `CSDL: <strong>${totalTx} giỏ hàng</strong> • Min Support: <strong>${this.minSupport}%</strong> • Min Conf: <strong>${this.minConfidence}%</strong>`;
        if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card';
        this.clearHighlights();
        break;

      case 'PHASE_START':
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `GIAI ĐOẠN ${event.k} • XÉT CẤP ĐỘ k = ${event.k}`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `C_${event.k}`;
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Chuẩn bị kiểm tra ${event.candidatesCount} tập ứng viên cho C_${event.k}`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `Mục tiêu của cấp độ k = ${event.k}:`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = event.k === 1
          ? `Quét CSDL lần 1 để lọc ra các mặt hàng bán lẻ phổ biến (L₁). Món nào đạt Support ≥ ${this.minSupport}% sẽ vào vòng trong.`
          : `Kiểm tra các combo ${event.k} món. Áp dụng quy tắc tỉa nhánh Apriori trước để tránh lãng phí công sức quét dữ liệu.`;
        if (this.inspectorMathDisplay) this.inspectorMathDisplay.innerHTML = `Tập ứng viên C_${event.k}: <strong>${event.candidatesCount} tập</strong> đang xếp hàng`;
        if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card';
        if (event.candidates) {
          this.renderCandidatesGridForLevel(event.candidates);
        }
        this.clearHighlights();
        break;

      case 'PRUNED_BY_APRIORI':
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `TỈA NHÁNH APRIORI • k = ${event.k}`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `✂️ Tỉa Sớm`;
        const prunedItemsStr = event.itemset.join(', ');
        const failSubStr = event.failingSubset.join(', ');
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Gạch bỏ combo {${prunedItemsStr}} mà KHÔNG CẦN quét CSDL!`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `⚡ Điểm đột phá của Tiên đề Apriori (Anti-monotonicity):`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Quy tắc kinh điển: <em>"Mọi tập con của một tập phổ biến đều phải phổ biến"</em>. Vì tập con <strong>{${failSubStr}}</strong> đã bị loại ở vòng trước (∉ L_${event.k - 1}), nên siêu tập {${prunedItemsStr}} <strong>CHẮC CHẮN</strong> không đạt ngưỡng! Thuật toán loại bỏ ngay lập tức, tiết kiệm hàng triệu phép đọc đĩa.`;
        if (this.inspectorMathDisplay) this.inspectorMathDisplay.innerHTML = `{${failSubStr}} ∉ L_${event.k - 1} ➔ <span class="math-badge-prune">GẠCH BỎ NGAY LẬP TỨC</span>`;
        if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card phase-prune';
        this.addPrunedCard(event.itemset, `Tập con {${failSubStr}} ∉ L_${event.k - 1}`);
        this.clearHighlights();
        break;

      case 'TEST_CANDIDATE':
        const candStr = event.itemset.join(', ');
        const suppPercent = (event.ratio * 100).toFixed(0);
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `QUÉT CƠ SỞ DỮ LIỆU • CẤP ĐỘ k = ${event.k}`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `k = ${event.k}`;
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Đếm tần số combo {${candStr}} trên từng giỏ hàng`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `Quan sát các giỏ hàng phát sáng màu xanh lá bên trái:`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Thuật toán kiểm tra từng giỏ hàng. Chỉ những giỏ chứa <strong>ĐỒNG THỜI</strong> tất cả các món trong {${candStr}} mới được cộng +1 vào bộ đếm.`;
        if (this.inspectorMathDisplay) {
          this.inspectorMathDisplay.innerHTML = event.isFrequent
            ? `Support = ${event.count}/${totalTx} (${suppPercent}%) ≥ ${this.minSupport}% ➔ <span class="math-badge-pass">ĐẠT CHUẨN (Thêm vào L_${event.k})</span>`
            : `Support = ${event.count}/${totalTx} (${suppPercent}%) < ${this.minSupport}% ➔ <span class="math-badge-fail">DƯỚI NGƯỠNG (BỊ LOẠI)</span>`;
        }
        if (this.inspectorCard) this.inspectorCard.className = `step-inspector-card ${event.isFrequent ? 'phase-pass' : 'phase-prune'}`;
        // Mark active evaluating candidate
        document.querySelectorAll('.itemset-card.is-evaluating').forEach(el => el.classList.remove('is-evaluating'));
        const activeCard = document.getElementById(AprioriVisualizer.getCardId(event.itemset));
        if (activeCard) {
          activeCard.classList.add('is-evaluating');
        }
        this.renderTransactions(event.matchedTids, event.itemset);
        this.updateCandidateCard(event);
        this.renderFrequentItemsetsPills();
        break;

      case 'LEVEL_SUMMARY':
        document.querySelectorAll('.itemset-card.is-evaluating').forEach(el => el.classList.remove('is-evaluating'));
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `TỔNG KẾT VÒNG CẤP ĐỘ k = ${event.k}`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `L_${event.k}`;
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Đã tìm thấy ${event.frequentCount} tập phổ biến trong L_${event.k}`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `Ý nghĩa của tập L_${event.k}:`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Các combo này là những sự kết hợp thực sự được khách hàng ưa chuộng và xuất hiện thường xuyên. Chúng là nguyên liệu vàng để sinh ra các luật gợi ý mua kèm (Association Rules).`;
        if (this.inspectorMathDisplay) this.inspectorMathDisplay.innerHTML = `Kết nạp <strong>${event.frequentCount} tập phổ biến</strong> vào danh sách L_${event.k}`;
        if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card phase-pass';
        this.renderFrequentItemsetsPills();
        this.clearHighlights();
        break;

      case 'JOIN_COMPLETE':
        document.querySelectorAll('.itemset-card.is-evaluating').forEach(el => el.classList.remove('is-evaluating'));
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `GHÉP CẶP ỨNG VIÊN • BẬC k = ${event.k}`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `L_${event.k-1} ⨝ L_${event.k-1}`;
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Tự ghép L_${event.k-1} sinh ra ${event.candidates.length} ứng viên mới cho C_${event.k}`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `Kỹ thuật Self-Join (L_{k-1} ⨝ L_{k-1}):`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Chỉ những tập đã vượt qua vòng trước mới được phép kết hợp để tạo ra combo ${event.k} món. Bất kỳ sản phẩm nào bị loại ở vòng trước sẽ không bao giờ xuất hiện ở đây.`;
        if (this.inspectorMathDisplay) this.inspectorMathDisplay.innerHTML = `Sinh thành công: <strong>${event.candidates.length} combo ứng viên</strong> mới`;
        if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card';
        this.renderCandidatesGridForLevel(event.candidates);
        this.clearHighlights();
        break;

      case 'COMPLETE':
        document.querySelectorAll('.itemset-card.is-evaluating').forEach(el => el.classList.remove('is-evaluating'));
        if (this.inspectorPhaseTitle) this.inspectorPhaseTitle.textContent = `HOÀN TẤT THUẬT TOÁN • KHAI PHÁ LUẬT KẾT HỢP`;
        if (this.inspectorKBadge) this.inspectorKBadge.textContent = `🎯 Xong`;
        if (this.inspectorActionText) this.inspectorActionText.textContent = `Tìm thấy ${event.totalFrequent} tập phổ biến & ${event.rules.length} luật kết hợp có ý nghĩa`;
        if (this.bubbleWhyTitle) this.bubbleWhyTitle.textContent = `💡 Bí quyết đọc kết quả & Rê chuột xem chi tiết:`;
        if (this.bubbleWhyDetail) this.bubbleWhyDetail.innerHTML = `Rê chuột vào bất kỳ thẻ ứng viên hoặc thẻ luật bên phải để xem <strong>hộp giải thích nổi (Float Tooltip)</strong> về công thức tính toán và khuyến nghị thương mại (Kích cầu thực sự hay tương quan âm).`;
        if (this.inspectorMathDisplay) this.inspectorMathDisplay.innerHTML = `Tổng kết: <strong>${event.totalFrequent} tập L</strong> • <strong>${event.rules.length} luật kết hợp</strong> (Min Conf ≥ ${this.minConfidence}%)`;
        if (this.inspectorCard) this.inspectorCard.className = 'step-inspector-card phase-pass';
        this.renderFrequentItemsetsPills();
        this.renderRules(event.rules);
        this.switchRightPanelTab('rules');
        this.clearHighlights();
        this.showFinalResultsModal(event);
        break;
    }
  }

  renderCandidatesGridForLevel(candidates) {
    if (!this.candidatesGrid) return;
    this.candidatesGrid.innerHTML = candidates.map(cand => {
      const id = AprioriVisualizer.getCardId(cand);
      const itemsHtml = cand.map(item => {
        const meta = this.dataset.itemMeta[item] || { icon: '📦' };
        return `<span>${meta.icon} ${item}</span>`;
      }).join('');

      return `
        <div class="itemset-card" id="${id}" data-itemset="${encodeURIComponent(JSON.stringify(cand))}" style="cursor: pointer;" title="Rê chuột xem chi tiết">
          <div class="itemset-card-header">
            <div class="itemset-items">${itemsHtml}</div>
            <span class="badge badge-candidate">C_${cand.length}</span>
          </div>
          <div class="itemset-metrics">
            <span>Support: Đang chờ</span>
          </div>
          <div class="itemset-support-bar">
            <div class="itemset-support-fill" style="width: 0%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCandidateCard(event) {
    const cardId = AprioriVisualizer.getCardId(event.itemset);
    let card = document.getElementById(cardId);

    // Save statistics for floating tooltip
    this.candidateStatsMap.set(cardId, {
      itemset: event.itemset,
      count: event.count,
      ratio: event.ratio,
      matchedTids: event.matchedTids,
      isFrequent: event.isFrequent,
      tested: true
    });

    if (!card) {
      const itemsHtml = event.itemset.map(item => {
        const meta = this.dataset.itemMeta[item] || { icon: '📦' };
        return `<span>${meta.icon} ${item}</span>`;
      }).join('');

      const div = document.createElement('div');
      div.className = `itemset-card ${event.isFrequent ? 'frequent' : 'pruned'}`;
      div.id = cardId;
      div.setAttribute('data-itemset', encodeURIComponent(JSON.stringify(event.itemset)));
      div.style.cursor = 'pointer';
      div.innerHTML = `
        <div class="itemset-card-header">
          <div class="itemset-items">${itemsHtml}</div>
          <span class="badge ${event.isFrequent ? 'badge-frequent' : 'badge-pruned'}">${event.isFrequent ? `L_${event.k}` : 'Loại'}</span>
        </div>
        <div class="itemset-metrics">
          <span>${event.count}/${this.dataset.transactions.length} (${(event.ratio * 100).toFixed(0)}%)</span>
          <span>${event.isFrequent ? 'Đạt chuẩn' : 'Dưới ngưỡng'}</span>
        </div>
        <div class="itemset-support-bar">
          <div class="itemset-support-fill" style="width: ${event.ratio * 100}%"></div>
        </div>
      `;
      if (this.candidatesGrid) this.candidatesGrid.prepend(div);
      return;
    }

    card.className = `itemset-card ${event.isFrequent ? 'frequent' : 'pruned'}`;
    card.setAttribute('data-itemset', encodeURIComponent(JSON.stringify(event.itemset)));
    card.style.cursor = 'pointer';

    const badge = card.querySelector('.badge');
    if (badge) {
      badge.className = `badge ${event.isFrequent ? 'badge-frequent' : 'badge-pruned'}`;
      badge.textContent = event.isFrequent ? `L_${event.k}` : 'Loại';
    }

    const metrics = card.querySelector('.itemset-metrics');
    if (metrics) {
      metrics.innerHTML = `
        <span>${event.count}/${this.dataset.transactions.length} (${(event.ratio * 100).toFixed(0)}%)</span>
        <span>${event.isFrequent ? 'Đạt chuẩn' : 'Dưới ngưỡng'}</span>
      `;
    }

    const fill = card.querySelector('.itemset-support-fill');
    if (fill) {
      fill.style.width = `${event.ratio * 100}%`;
    }
  }

  addPrunedCard(itemset, reason) {
    const cardId = AprioriVisualizer.getCardId(itemset);
    let card = document.getElementById(cardId);

    this.candidateStatsMap.set(cardId, {
      itemset: itemset,
      reason: reason,
      pruned: true
    });

    const itemsHtml = itemset.map(item => {
      const meta = this.dataset.itemMeta[item] || { icon: '📦' };
      return `<span>${meta.icon} ${item}</span>`;
    }).join('');

    if (card) {
      card.className = 'itemset-card pruned';
      card.setAttribute('data-itemset', encodeURIComponent(JSON.stringify(itemset)));
      card.style.cursor = 'pointer';
      if (!card.querySelector('.prune-tag')) {
        card.innerHTML += `<div class="prune-tag">✂️ Tỉa sớm: ${reason}</div>`;
      }
    } else {
      const div = document.createElement('div');
      div.className = 'itemset-card pruned';
      div.id = cardId;
      div.setAttribute('data-itemset', encodeURIComponent(JSON.stringify(itemset)));
      div.style.cursor = 'pointer';
      div.innerHTML = `
        <div class="itemset-card-header">
          <div class="itemset-items">${itemsHtml}</div>
          <span class="badge badge-pruned">Tỉa Apriori</span>
        </div>
        <div class="prune-tag">✂️ ${reason}</div>
      `;
      if (this.candidatesGrid) this.candidatesGrid.prepend(div);
    }
  }

  renderFrequentItemsetsPills() {
    if (!this.frequentPillsContainer || !this.traceData) return;

    const frequentFound = [];
    const seen = new Set();
    const maxIdx = Math.min(this.currentStep, this.traceData.trace.length - 1);

    for (let i = 0; i <= maxIdx; i++) {
      const evt = this.traceData.trace[i];
      if (evt.type === 'TEST_CANDIDATE' && evt.isFrequent) {
        const key = evt.itemset.join('__&__');
        if (!seen.has(key)) {
          seen.add(key);
          frequentFound.push(evt);
        }
      }
    }

    if (frequentFound.length === 0) {
      this.frequentPillsContainer.innerHTML = '<span style="color: var(--text-dim); font-size: 0.8rem;">Chưa có tập phổ biến</span>';
      return;
    }

    this.frequentPillsContainer.innerHTML = frequentFound.map(f => {
      const itemsStr = f.itemset.join(', ');
      return `
        <span class="badge badge-frequent" title="Support: ${(f.ratio * 100).toFixed(0)}% (${f.count} lần)">
          {${itemsStr}} <small style="opacity: 0.8;">(${(f.ratio * 100).toFixed(0)}%)</small>
        </span>
      `;
    }).join(' ');
  }

  renderRules(rules) {
    const countBadge = document.getElementById('tab-rules-count-badge');
    if (countBadge) countBadge.textContent = `${rules ? rules.length : 0}`;

    if (!this.rulesList) return;
    this.renderedRules = rules || [];
    if (!rules || rules.length === 0) {
      this.rulesList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">Không có luật nào thỏa mãn ngưỡng Min Confidence. Thử giảm ngưỡng Min Confidence xuống!</div>';
      return;
    }

    // Sort rules robustly by Lift desc, then Confidence desc, then Support desc
    const sortedRules = [...rules].sort((a, b) => {
      const liftDiff = Math.round((b.lift - a.lift) * 10000);
      if (liftDiff !== 0) return liftDiff;
      const confDiff = Math.round((b.confidence - a.confidence) * 10000);
      if (confDiff !== 0) return confDiff;
      return Math.round((b.support - a.support) * 10000);
    });

    this.rulesList.innerHTML = sortedRules.map((r, idx) => {
      let liftClass = 'val-lift-normal';
      let liftTag = 'Độc lập ngẫu nhiên';
      if (r.lift > 1.25) {
        liftClass = 'val-lift-high';
        liftTag = 'Kích cầu mạnh! 🚀';
      } else if (r.lift < 1) {
        liftClass = 'val-lift-low';
        liftTag = 'Tương quan âm ⚠️';
      }

      const antPills = r.antecedent.map(a => {
        const meta = this.dataset.itemMeta[a] || { icon: '📦' };
        return `${meta.icon} ${a}`;
      }).join(' + ');

      const conPills = r.consequent.map(c => {
        const meta = this.dataset.itemMeta[c] || { icon: '📦' };
        return `${meta.icon} ${c}`;
      }).join(' + ');

      return `
        <div class="rule-card" data-rule-idx="${idx}" style="cursor: pointer;" title="Rê chuột xem phân tích chi tiết">
          <div class="rule-formula">
            <span>[ ${antPills} ]</span>
            <span class="rule-arrow">➔</span>
            <span>[ ${conPills} ]</span>
          </div>
          <div class="rule-metrics-row">
            <span>Supp: <strong>${(r.support * 100).toFixed(0)}%</strong></span>
            <span>Conf: <strong style="color: var(--accent-cyan);">${(r.confidence * 100).toFixed(0)}%</strong></span>
            <span>Lift: <strong class="${liftClass}">${r.lift.toFixed(2)}</strong></span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-dim); display: flex; justify-content: space-between;">
            <span>Luật #${idx + 1}</span>
            <span class="${liftClass}">${liftTag}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  showFinalResultsModal(event) {
    const modal = document.getElementById('modal-final-results');
    if (!modal) return;

    // 1. Dataset name & thresholds
    const dsNameEl = document.getElementById('final-modal-dataset-name');
    if (dsNameEl) dsNameEl.textContent = this.dataset.name;

    const threshEl = document.getElementById('final-modal-thresholds');
    if (threshEl) threshEl.textContent = `Ngưỡng: Min Sup ${this.minSupport}% • Min Conf ${this.minConfidence}%`;

    // 2. Counts
    const txEl = document.getElementById('final-modal-tx-count');
    if (txEl) txEl.textContent = this.dataset.transactions.length;

    const freqEl = document.getElementById('final-modal-frequent-count');
    if (freqEl) freqEl.textContent = event.totalFrequent || (this.traceData ? this.traceData.allFrequent.length : 0);

    // Count pruned itemsets
    let prunedCount = 0;
    if (this.traceData && this.traceData.trace) {
      prunedCount = this.traceData.trace.filter(e => e.type === 'PRUNED_BY_APRIORI' || (e.type === 'TEST_CANDIDATE' && !e.isFrequent)).length;
    }
    const prunedEl = document.getElementById('final-modal-pruned-count');
    if (prunedEl) prunedEl.textContent = prunedCount;

    const rulesEl = document.getElementById('final-modal-rules-count');
    const rules = event.rules || (this.traceData ? this.traceData.rules : []);
    if (rulesEl) rulesEl.textContent = rules.length;

    const rulesBadge = document.getElementById('final-modal-rules-badge');
    if (rulesBadge) {
      rulesBadge.textContent = rules.length > 0 ? `Đã tìm thấy ${rules.length} luật` : `0 luật`;
    }

    // 3. Ranked Rules List with Top 3 Highlighted & Tie Handling
    const rulesListEl = document.getElementById('final-modal-rules-list');
    if (rulesListEl) {
      if (rules && rules.length > 0) {
        // Sort primarily by Lift desc (with precision rounding), then Confidence desc, then Support desc
        const sortedRules = [...rules].sort((a, b) => {
          const liftDiff = Math.round((b.lift - a.lift) * 10000);
          if (liftDiff !== 0) return liftDiff;
          const confDiff = Math.round((b.confidence - a.confidence) * 10000);
          if (confDiff !== 0) return confDiff;
          return Math.round((b.support - a.support) * 10000);
        });

        // Compute dense ranking with tie detection
        let currentDenseRank = 1;
        const rankedItems = sortedRules.map((rule, idx) => {
          if (idx > 0) {
            const prev = sortedRules[idx - 1];
            const isTiedWithPrev = Math.abs(rule.lift - prev.lift) < 1e-4 && Math.abs(rule.confidence - prev.confidence) < 1e-4;
            if (!isTiedWithPrev) {
              currentDenseRank += 1;
            }
          }
          const isTied = (idx > 0 && Math.abs(rule.lift - sortedRules[idx - 1].lift) < 1e-4 && Math.abs(rule.confidence - sortedRules[idx - 1].confidence) < 1e-4) ||
            (idx < sortedRules.length - 1 && Math.abs(rule.lift - sortedRules[idx + 1].lift) < 1e-4 && Math.abs(rule.confidence - sortedRules[idx + 1].confidence) < 1e-4);

          return { rule, rank: currentDenseRank, isTied };
        });

        rulesListEl.innerHTML = rankedItems.map(({ rule, rank, isTied }) => {
          const isTopTier = rank <= 3;
          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-standard';
          const pillClass = rank === 1 ? 'rank-pill-1' : rank === 2 ? 'rank-pill-2' : rank === 3 ? 'rank-pill-3' : 'rank-pill-standard';

          let rankLabel = '';
          if (rank === 1) rankLabel = isTied ? '🥇 TOP 1 (Đồng hạng)' : '🥇 TOP 1';
          else if (rank === 2) rankLabel = isTied ? '🥈 TOP 2 (Đồng hạng)' : '🥈 TOP 2';
          else if (rank === 3) rankLabel = isTied ? '🥉 TOP 3 (Đồng hạng)' : '🥉 TOP 3';
          else rankLabel = isTied ? `#${rank} (Đồng hạng)` : `#${rank}`;

          const antStr = rule.antecedent.map(a => {
            const meta = this.dataset.itemMeta[a] || { icon: '📦' };
            return `<span style="display: inline-flex; align-items: center; gap: 3px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); padding: 1px 6px; border-radius: 4px; color: #bae6fd;">${meta.icon} <strong>${a}</strong></span>`;
          }).join(' <span style="color:#94a3b8; font-weight:700;">+</span> ');

          const conStr = rule.consequent.map(c => {
            const meta = this.dataset.itemMeta[c] || { icon: '📦' };
            return `<span style="display: inline-flex; align-items: center; gap: 3px; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.25); padding: 1px 6px; border-radius: 4px; color: #fef08a;">${meta.icon} <strong>${c}</strong></span>`;
          }).join(' <span style="color:#94a3b8; font-weight:700;">+</span> ');

          const liftVal = rule.lift.toFixed(2);
          const confVal = (rule.confidence * 100).toFixed(0);
          const suppVal = (rule.support * 100).toFixed(0);

          let liftColor = '#34d399';
          if (rule.lift < 1.0) liftColor = '#f87171';
          else if (rule.lift < 1.15) liftColor = '#38bdf8';

          // Insight text
          let insightText = '';
          if (isTied && rank === 1) {
            insightText = `💡 <strong>Tương quan 2 chiều hoàn hảo:</strong> Mua [<strong>${rule.antecedent.join(', ')}</strong>] thì 100% mua [<strong>${rule.consequent.join(', ')}</strong>], và ngược lại mua [<strong>${rule.consequent.join(', ')}</strong>] thì 100% mua [<strong>${rule.antecedent.join(', ')}</strong>] (Lift = ${liftVal}x). Cặp bài trùng lý tưởng để đóng gói combo hoặc đặt kệ kề nhau!`;
          } else if (isTopTier) {
            if (rule.lift > 1.25) {
              insightText = `💡 <strong>Kích cầu mạnh:</strong> Khách mua [<strong>${rule.antecedent.join(', ')}</strong>] có tỷ lệ mua thêm [<strong>${rule.consequent.join(', ')}</strong>] vọt lên gấp <strong style="color: #34d399;">${liftVal} lần</strong> so với thông thường (Tin cậy: <strong>${confVal}%</strong>). Rất nên đặt kề nhau hoặc ghép combo ưu đãi!`;
            } else if (rule.lift >= 0.95 && rule.lift <= 1.05) {
              insightText = `⚖️ <strong>Độc lập:</strong> Hai mặt hàng mua ngẫu nhiên tự nhiên (Lift ≈ 1.0), ít ảnh hưởng qua lại.`;
            } else {
              insightText = `📉 <strong>Kỵ nhau:</strong> Lift < 1.0, khách mua món này ít có nhu cầu lấy thêm món kia.`;
            }
          } else {
            insightText = `Quy luật gợi ý bổ trợ: Mua [<strong>${rule.antecedent.join(', ')}</strong>] ➔ gợi ý [<strong>${rule.consequent.join(', ')}</strong>] (Độ tin cậy: ${confVal}%, Tăng: ${liftVal}x).`;
          }

          return `
            <div class="modal-rule-row ${rankClass}">
              <div class="modal-rule-header">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span class="modal-rule-rank-pill ${pillClass}">${rankLabel}</span>
                  <div class="modal-rule-formula">
                    ${antStr}
                    <span style="color: var(--accent-cyan); font-size: 1.1rem; padding: 0 2px;">➔</span>
                    ${conStr}
                  </div>
                </div>
                <div class="modal-rule-metrics">
                  <span class="modal-metric-chip" title="Độ hỗ trợ">Supp: <strong style="color:#fbbf24;">${suppVal}%</strong></span>
                  <span class="modal-metric-chip" title="Độ tin cậy">Conf: <strong style="color:#818cf8;">${confVal}%</strong></span>
                  <span class="modal-metric-chip" style="border-color: ${liftColor}40;" title="Hệ số Lift">Lift: <strong style="color:${liftColor}; font-size: 0.85rem;">${liftVal}x</strong></span>
                </div>
              </div>
              <div class="modal-rule-insight">
                ${insightText}
              </div>
            </div>
          `;
        }).join('');
      } else {
        rulesListEl.innerHTML = `
          <div style="text-align: center; padding: 1.8rem 1rem; color: #94a3b8; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2.2rem; margin-bottom: 6px;">🔍</div>
            <div style="font-weight: 700; color: #fff; font-size: 1.05rem; margin-bottom: 4px;">Không Có Quy Tắc Nào Vượt Ngưỡng</div>
            <div style="font-size: 0.86rem; color: #cbd5e1; max-width: 500px; margin: 0 auto; line-height: 1.5;">
              Với Min Confidence = <strong>${this.minConfidence}%</strong>, không có mối kết hợp nào đạt tiêu chuẩn. Hãy thử kéo thanh trượt <strong>Min Conf</strong> xuống thấp hơn (ví dụ 40% - 50%) để khai phá thêm các quy luật ngầm!
            </div>
          </div>
        `;
      }
    }

    // 4. Next dataset button setup
    const datasetKeys = ['supermarket', 'tech', 'fastfood'];
    const curKey = this.dataset.id || 'supermarket';
    const curIdx = datasetKeys.indexOf(curKey);
    const nextKey = datasetKeys[(curIdx + 1) % datasetKeys.length];
    const g = typeof window !== 'undefined' ? window : globalThis;
    const nextDs = (g.PRESET_DATASETS && g.PRESET_DATASETS[nextKey]) ? g.PRESET_DATASETS[nextKey] : null;

    const nextBtn = document.getElementById('btn-final-modal-next-dataset');
    if (nextBtn && nextDs) {
      nextBtn.textContent = `⏩ Chuyển Sang Kịch Bản Tiếp Theo: ${nextDs.name}`;
      nextBtn.onclick = () => {
        modal.classList.remove('open');
        this.loadDataset(nextKey);
      };
    }

    // Open modal with slight delay for natural finish feel
    setTimeout(() => {
      modal.classList.add('open');
    }, 300);
  }

  addLog(msg, type = 'info') {
    if (!this.logConsole) return;
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span style="opacity: 0.5;">[${time}]</span> ${msg}`;
    this.logConsole.appendChild(entry);
    this.logConsole.scrollTop = this.logConsole.scrollHeight;
  }

  switchRightPanelTab(tabName) {
    const btnLog = document.getElementById('tab-btn-log');
    const btnRules = document.getElementById('tab-btn-rules');
    const paneLog = document.getElementById('pane-execution-log');
    const paneRules = document.getElementById('pane-association-rules');

    if (!btnLog || !btnRules || !paneLog || !paneRules) return;

    if (tabName === 'rules') {
      btnLog.classList.remove('active');
      btnRules.classList.add('active');
      paneLog.style.display = 'none';
      paneRules.style.display = 'flex';
      this.currentRightTab = 'rules';
    } else {
      btnRules.classList.remove('active');
      btnLog.classList.add('active');
      paneRules.style.display = 'none';
      paneLog.style.display = 'flex';
      this.currentRightTab = 'log';
    }
  }

  clearLog() {
    if (this.logConsole) {
      this.logConsole.innerHTML = '';
      this.addLog('Nhật ký đã được làm sạch.', 'info');
    }
  }
}

if (typeof window !== 'undefined') {
  window.AprioriVisualizer = AprioriVisualizer;
} else if (typeof globalThis !== 'undefined') {
  globalThis.AprioriVisualizer = AprioriVisualizer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AprioriVisualizer };
}
