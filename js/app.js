/**
 * Main Application Bootstrap
 * Connects Presentation Controller, Interactive Visualizer,
 * Scenario Switcher, and View Toggles.
 */

class AppManager {
  constructor() {
    this.currentView = 'presentation'; // 'presentation' | 'simulator'
    this.init();
  }

  init() {
    // Initialize Core Controllers
    window.presentationController = new window.PresentationController();
    window.visualizer = new window.AprioriVisualizer();
    window.simulatorVisualizer = window.visualizer;

    this.cacheElements();
    this.bindEvents();
    this.setupScenarioCards();
  }

  cacheElements() {
    this.tabPresentation = document.getElementById('nav-tab-presentation');
    this.tabSimulator = document.getElementById('nav-tab-simulator');
    this.presentationView = document.getElementById('presentation-view');
    this.simulatorView = document.getElementById('simulator-view');

    this.scenarioModal = document.getElementById('modal-scenario');
    this.btnScenario = document.getElementById('btn-toggle-scenario');
    this.currentScenarioBadge = document.getElementById('current-scenario-badge');
  }

  bindEvents() {
    if (this.tabPresentation) {
      this.tabPresentation.addEventListener('click', () => this.switchView('presentation'));
    }

    if (this.tabSimulator) {
      this.tabSimulator.addEventListener('click', () => this.switchView('simulator'));
    }

    if (this.btnScenario) {
      this.btnScenario.addEventListener('click', () => {
        if (this.scenarioModal) this.scenarioModal.classList.toggle('open');
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close modal on clicking outside card
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    if (viewName === 'presentation') {
      this.presentationView.style.display = 'flex';
      this.simulatorView.style.display = 'none';

      this.tabPresentation.classList.add('active');
      this.tabSimulator.classList.remove('active');
    } else {
      this.presentationView.style.display = 'none';
      this.simulatorView.style.display = 'flex';

      this.tabPresentation.classList.remove('active');
      this.tabSimulator.classList.add('active');
    }
  }

  toggleView() {
    this.switchView(this.currentView === 'presentation' ? 'simulator' : 'presentation');
  }

  setupScenarioCards() {
    const container = document.getElementById('scenario-cards-container');
    if (!container) return;

    container.innerHTML = Object.entries(window.PRESET_DATASETS).map(([key, dataset]) => {
      return `
        <div class="glass-card scenario-select-card" style="cursor: pointer; padding: 1.25rem;" onclick="window.App.selectScenario('${key}')">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <strong style="color: #fff; font-size: 1.05rem;">${dataset.name}</strong>
            <span class="badge badge-frequent">${dataset.transactions.length} giao dịch</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${dataset.description}</p>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${Object.entries(dataset.itemMeta).map(([item, meta]) => 
              `<span class="badge" style="background: rgba(255,255,255,0.06); font-size: 0.7rem;">${meta.icon} ${item}</span>`
            ).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  selectScenario(scenarioKey) {
    if (window.visualizer) {
      window.visualizer.loadDataset(scenarioKey);
    }

    if (this.currentScenarioBadge && window.PRESET_DATASETS[scenarioKey]) {
      this.currentScenarioBadge.textContent = window.PRESET_DATASETS[scenarioKey].name;
    }

    this.closeAllModals();
  }

  closeAllModals() {
    if (this.scenarioModal) this.scenarioModal.classList.remove('open');
    const overview = document.getElementById('modal-overview');
    if (overview) overview.classList.remove('open');
    const help = document.getElementById('modal-help');
    if (help) help.classList.remove('open');
    const notes = document.getElementById('notes-drawer');
    if (notes) notes.classList.remove('open');
  }
}

if (typeof window !== 'undefined') {
  window.AppManager = AppManager;
} else if (typeof globalThis !== 'undefined') {
  globalThis.AppManager = AppManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AppManager };
}

function bootstrapApp() {
  const g = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  if (!g.App) {
    g.App = new AppManager();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
}
