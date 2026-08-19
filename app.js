/**
 * SIMULASI TES HAIRIL - CBT APPLICATION ENGINE
 * 1:1 CAT UI + Fullscreen Mode + Robust Floating Calculator + Mobile Ergonomics
 */

// Global State
const State = {
  examData: null,
  activeSubtest: null,
  activeQuestions: [],
  currentIndex: 0,
  userAnswers: {},
  doubtStatus: {},
  timeRemainingSeconds: 0,
  totalTimeAllocatedSeconds: 0,
  timerInterval: null,
  isFinished: false,
  fontSizeLevel: 'md',
  filterReview: 'all',
  startTime: null,
  endTime: null,
  userData: {
    name: 'MUHAMMAD HAIRIL',
    id: '25-3401-0891-01',
    token: 'HAIRIL-2025'
  }
};

const DOM = {};

/* ==========================================================================
   🧮 CALCULATOR MODULE (DEFINED GLOBALLY FIRST)
   ========================================================================== */
const Calculator = {
  displayEl: null,
  historyEl: null,
  currentExpr: '0',
  historyText: '',
  isCalculated: false,

  init() {
    this.displayEl = document.getElementById('calc-display');
    this.historyEl = document.getElementById('calc-history');

    // Toggle button in header
    if (DOM.btnToggleCalculator) {
      DOM.btnToggleCalculator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Close button in calculator header
    if (DOM.btnCloseCalc) {
      DOM.btnCloseCalc.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Grid button click delegation
    const grid = document.getElementById('calc-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-calc');
        if (!btn) return;
        e.stopPropagation();

        const act = btn.dataset.act;
        const val = btn.dataset.val;

        switch (act) {
          case 'digit':
            this.inputDigit(val);
            break;
          case 'dot':
            this.inputDot();
            break;
          case 'op':
            this.inputOp(val);
            break;
          case 'sign':
            this.toggleSign();
            break;
          case 'sqrt':
            this.sqrt();
            break;
          case 'clear':
            this.clearAll();
            break;
          case 'backspace':
            this.backspace();
            break;
          case 'equal':
            this.calculate();
            break;
        }
      });
    }

    // Desktop dragging
    this.initDrag();

    // Global keyboard numpad support
    document.addEventListener('keydown', (e) => {
      if (!DOM.calcWidget || !DOM.calcWidget.classList.contains('active')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        this.inputDigit(e.key);
      } else if (e.key === '.') {
        this.inputDot();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        this.inputOp(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        this.calculate();
      } else if (e.key === 'Backspace') {
        this.backspace();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    this.updateDisplay();
  },

  toggle() {
    if (!DOM.calcWidget) return;
    const isOpen = DOM.calcWidget.classList.toggle('active');
    if (DOM.btnToggleCalculator) {
      DOM.btnToggleCalculator.classList.toggle('btn-calc-active', isOpen);
    }
  },

  open() {
    if (!DOM.calcWidget) return;
    DOM.calcWidget.classList.add('active');
    if (DOM.btnToggleCalculator) {
      DOM.btnToggleCalculator.classList.add('btn-calc-active');
    }
  },

  close() {
    if (!DOM.calcWidget) return;
    DOM.calcWidget.classList.remove('active');
    if (DOM.btnToggleCalculator) {
      DOM.btnToggleCalculator.classList.remove('btn-calc-active');
    }
  },

  updateDisplay() {
    if (this.displayEl) {
      this.displayEl.textContent = this.currentExpr || '0';
    }
    if (this.historyEl) {
      this.historyEl.textContent = this.historyText || '';
    }
  },

  inputDigit(d) {
    if (this.currentExpr === '0' || this.currentExpr === 'Error' || this.isCalculated) {
      if (d === '(' || d === ')') {
        this.currentExpr = d;
      } else {
        this.currentExpr = d;
      }
      this.isCalculated = false;
    } else {
      if (this.currentExpr.length < 24) {
        this.currentExpr += d;
      }
    }
    this.updateDisplay();
  },

  inputDot() {
    if (this.isCalculated || this.currentExpr === 'Error') {
      this.currentExpr = '0.';
      this.isCalculated = false;
    } else {
      // Find current active number chunk
      const tokens = this.currentExpr.split(/[\+\-\*\/\(\)\s]+/);
      const lastToken = tokens[tokens.length - 1];
      if (!lastToken.includes('.')) {
        this.currentExpr += (lastToken === '' ? '0.' : '.');
      }
    }
    this.updateDisplay();
  },

  inputOp(op) {
    if (this.currentExpr === 'Error') {
      this.currentExpr = '0';
    }
    this.isCalculated = false;

    const lastChar = this.currentExpr.trim().slice(-1);
    if (['+', '-', '*', '/', '%'].includes(lastChar)) {
      this.currentExpr = this.currentExpr.trim().slice(0, -1) + ' ' + op + ' ';
    } else {
      this.currentExpr += ' ' + op + ' ';
    }
    this.updateDisplay();
  },

  toggleSign() {
    if (this.currentExpr === '0' || this.currentExpr === 'Error') return;

    if (this.currentExpr.startsWith('-(') && this.currentExpr.endsWith(')')) {
      this.currentExpr = this.currentExpr.slice(2, -1);
    } else if (this.currentExpr.startsWith('-')) {
      this.currentExpr = this.currentExpr.slice(1);
    } else {
      this.currentExpr = '-(' + this.currentExpr + ')';
    }
    this.isCalculated = false;
    this.updateDisplay();
  },

  sqrt() {
    try {
      const val = this.evaluate(this.currentExpr);
      if (val < 0) {
        this.historyText = `√(${this.currentExpr})`;
        this.currentExpr = 'Error';
      } else {
        const res = Math.round(Math.sqrt(val) * 100000000) / 100000000;
        this.historyText = `√(${this.currentExpr}) =`;
        this.currentExpr = String(res);
      }
    } catch {
      this.currentExpr = 'Error';
    }
    this.isCalculated = true;
    this.updateDisplay();
  },

  clearAll() {
    this.currentExpr = '0';
    this.historyText = '';
    this.isCalculated = false;
    this.updateDisplay();
  },

  backspace() {
    if (this.isCalculated || this.currentExpr === 'Error') {
      this.clearAll();
      return;
    }
    let trimmed = this.currentExpr.trim();
    if (trimmed.length > 1) {
      if (trimmed.endsWith('+ ') || trimmed.endsWith('- ') || trimmed.endsWith('* ') || trimmed.endsWith('/ ')) {
        this.currentExpr = trimmed.slice(0, -2);
      } else {
        this.currentExpr = trimmed.slice(0, -1);
      }
    } else {
      this.currentExpr = '0';
    }
    this.updateDisplay();
  },

  evaluate(expr) {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/%/g, '* 0.01');

    if (!/^[0-9.\s+\-*/()]+$/.test(sanitized)) {
      throw new Error('Invalid characters');
    }

    // Safe mathematical function execution
    const fn = new Function(`'use strict'; return (${sanitized});`);
    const res = fn();
    if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) {
      throw new Error('Math Error');
    }
    return Math.round(res * 100000000) / 100000000;
  },

  calculate() {
    try {
      const raw = this.currentExpr;
      const res = this.evaluate(raw);
      this.historyText = `${raw} =`;
      this.currentExpr = String(res);
      this.isCalculated = true;
    } catch {
      this.historyText = `${this.currentExpr} =`;
      this.currentExpr = 'Error';
      this.isCalculated = true;
    }
    this.updateDisplay();
  },

  initDrag() {
    const header = document.getElementById('calc-header');
    const widget = document.getElementById('calc-widget');
    if (!header || !widget) return;

    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      if (window.innerWidth <= 900) return;
      if (e.target.closest('#btn-close-calc')) return;
      isDragging = true;
      offsetX = e.clientX - widget.getBoundingClientRect().left;
      offsetY = e.clientY - widget.getBoundingClientRect().top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      widget.style.left = `${e.clientX - offsetX}px`;
      widget.style.top = `${e.clientY - offsetY}px`;
      widget.style.bottom = 'auto';
      widget.style.right = 'auto';
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }
};

window.Calculator = Calculator;

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initDOMReferences();
  initEventListeners();
  Calculator.init();
  initFullscreen();
  loadInitialData();
});

function initDOMReferences() {
  DOM.screens = {
    start: document.getElementById('start-screen'),
    exam: document.getElementById('exam-screen'),
    result: document.getElementById('result-screen')
  };

  DOM.startTitle = document.getElementById('start-title');
  DOM.startSubtitle = document.getElementById('start-subtitle');
  DOM.inputToken = document.getElementById('input-token');
  DOM.inputUserName = document.getElementById('input-user-name');
  DOM.inputUserId = document.getElementById('input-user-id');
  DOM.selectSubtest = document.getElementById('select-subtest');
  DOM.subtestCountInfo = document.getElementById('subtest-count-info');
  DOM.inputCustomTime = document.getElementById('input-custom-time');
  DOM.btnResetTime = document.getElementById('btn-reset-time');
  DOM.btnStartExam = document.getElementById('btn-start-exam');
  DOM.fileJsonInput = document.getElementById('file-json-input');
  DOM.loadedFileStatus = document.getElementById('loaded-file-status');
  DOM.dropZone = document.getElementById('drop-zone');

  DOM.examHeaderTitle = document.getElementById('exam-header-title');
  DOM.examHeaderSubtest = document.getElementById('exam-header-subtest');
  DOM.timerBox = document.getElementById('timer-box');
  DOM.timerDisplay = document.getElementById('timer-display');
  DOM.displayUserName = document.getElementById('display-user-name');
  DOM.displayUserId = document.getElementById('display-user-id');
  DOM.btnToggleDaftarSoal = document.getElementById('btn-toggle-daftar-soal');
  DOM.btnFullscreen = document.getElementById('btn-fullscreen');
  DOM.fullscreenIcon = document.getElementById('fullscreen-icon');
  DOM.fullscreenText = document.getElementById('fullscreen-text');
  DOM.btnToggleCalculator = document.getElementById('btn-toggle-calculator');
  DOM.calcWidget = document.getElementById('calc-widget');
  DOM.btnCloseCalc = document.getElementById('btn-close-calc');

  DOM.workspaceContainer = document.getElementById('workspace-container');
  DOM.currentQBadge = document.getElementById('current-q-badge');
  DOM.currentQCategory = document.getElementById('current-q-category');
  DOM.questionText = document.getElementById('question-text');
  DOM.optionsContainer = document.getElementById('options-container');

  DOM.btnPrev = document.getElementById('btn-prev');
  DOM.btnNext = document.getElementById('btn-next');
  DOM.btnFinishTrigger = document.getElementById('btn-finish-trigger');
  DOM.checkboxRagu = document.getElementById('checkbox-ragu');
  DOM.labelRagu = document.getElementById('label-ragu');

  DOM.catSidebar = document.getElementById('cat-sidebar');
  DOM.questionGrid = document.getElementById('question-grid');
  DOM.btnCloseSidebar = document.getElementById('btn-close-sidebar');

  DOM.btnFontSm = document.getElementById('btn-font-sm');
  DOM.btnFontMd = document.getElementById('btn-font-md');
  DOM.btnFontLg = document.getElementById('btn-font-lg');

  DOM.confirmModal = document.getElementById('confirm-modal');
  DOM.modalTotalQ = document.getElementById('modal-total-q');
  DOM.modalAnsweredQ = document.getElementById('modal-answered-q');
  DOM.modalDoubtQ = document.getElementById('modal-doubt-q');
  DOM.modalUnansweredQ = document.getElementById('modal-unanswered-q');
  DOM.modalCheckConfirm = document.getElementById('modal-check-confirm');
  DOM.btnModalCancel = document.getElementById('btn-modal-cancel');
  DOM.btnModalConfirm = document.getElementById('btn-modal-confirm');

  DOM.resultScoreVal = document.getElementById('result-score-val');
  DOM.resultUserMeta = document.getElementById('result-user-meta');
  DOM.resultFeedbackText = document.getElementById('result-feedback-text');
  DOM.statCorrectCount = document.getElementById('stat-correct-count');
  DOM.statWrongCount = document.getElementById('stat-wrong-count');
  DOM.statEmptyCount = document.getElementById('stat-empty-count');
  DOM.statTimeSpent = document.getElementById('stat-time-spent');
  DOM.btnDownloadTxt = document.getElementById('btn-download-txt');
  DOM.btnPrintPdf = document.getElementById('btn-print-pdf');
  DOM.btnDownloadJson = document.getElementById('btn-download-json');
  DOM.listWrongChips = document.getElementById('list-wrong-chips');
  DOM.listEmptyChips = document.getElementById('list-empty-chips');
  DOM.reviewListContainer = document.getElementById('review-list-container');
  DOM.btnRetryTest = document.getElementById('btn-retry-test');
  DOM.btnBackHome = document.getElementById('btn-back-home');
}

function initEventListeners() {
  DOM.btnStartExam.addEventListener('click', handleStartExam);
  DOM.btnPrev.addEventListener('click', () => navigateQuestion(State.currentIndex - 1));
  DOM.btnNext.addEventListener('click', () => navigateQuestion(State.currentIndex + 1));
  DOM.btnFinishTrigger.addEventListener('click', openConfirmModal);

  DOM.checkboxRagu.addEventListener('change', handleToggleDoubt);

  DOM.btnFontSm.addEventListener('click', () => setFontSize('sm'));
  DOM.btnFontMd.addEventListener('click', () => setFontSize('md'));
  DOM.btnFontLg.addEventListener('click', () => setFontSize('lg'));

  DOM.btnToggleDaftarSoal.addEventListener('click', () => {
    DOM.catSidebar.classList.toggle('mobile-open');
  });
  DOM.btnCloseSidebar.addEventListener('click', () => {
    DOM.catSidebar.classList.remove('mobile-open');
  });

  DOM.btnResetTime.addEventListener('click', () => {
    if (State.activeSubtest && State.activeSubtest.timeMinutes) {
      DOM.inputCustomTime.value = State.activeSubtest.timeMinutes;
    } else if (State.examData && State.examData.testInfo && State.examData.testInfo.defaultTimeMinutes) {
      DOM.inputCustomTime.value = State.examData.testInfo.defaultTimeMinutes;
    }
  });

  DOM.selectSubtest.addEventListener('change', handleSubtestSelectionChange);

  DOM.btnModalCancel.addEventListener('click', closeConfirmModal);
  DOM.modalCheckConfirm.addEventListener('change', (e) => {
    DOM.btnModalConfirm.disabled = !e.target.checked;
    DOM.btnModalConfirm.style.opacity = e.target.checked ? '1' : '0.5';
    DOM.btnModalConfirm.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
  });
  DOM.btnModalConfirm.addEventListener('click', handleFinishExam);

  DOM.btnRetryTest.addEventListener('click', resetAndRestartExam);
  DOM.btnBackHome.addEventListener('click', returnToStartScreen);

  // Download & Print Listeners
  if (DOM.btnDownloadTxt) {
    DOM.btnDownloadTxt.addEventListener('click', downloadEvaluationReport);
  }
  if (DOM.btnPrintPdf) {
    DOM.btnPrintPdf.addEventListener('click', () => window.print());
  }
  if (DOM.btnDownloadJson) {
    DOM.btnDownloadJson.addEventListener('click', downloadJsonFile);
  }

  document.querySelectorAll('.btn-filter-review').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-filter-review').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      State.filterReview = e.target.dataset.filter;
      renderReviewList();
    });
  });

  DOM.fileJsonInput.addEventListener('change', handleCustomJsonUpload);
  initDropZone();

  // Keyboard navigation shortcuts
  document.addEventListener('keydown', (e) => {
    if (!DOM.screens.exam.classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (DOM.calcWidget && DOM.calcWidget.classList.contains('active')) return;

    if (e.key === 'ArrowLeft') {
      if (State.currentIndex > 0) navigateQuestion(State.currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      if (State.currentIndex < State.activeQuestions.length - 1) navigateQuestion(State.currentIndex + 1);
    } else if (['1', '2', '3', '4', '5', 'a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E'].includes(e.key)) {
      const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
      const optKey = (map[e.key] || e.key).toUpperCase();
      const currentQ = State.activeQuestions[State.currentIndex];
      if (currentQ && currentQ.options && currentQ.options[optKey]) {
        selectOption(optKey);
      }
    } else if (e.key === 'r' || e.key === 'R') {
      DOM.checkboxRagu.checked = !DOM.checkboxRagu.checked;
      handleToggleDoubt();
    }
  });
}

function initFullscreen() {
  DOM.btnFullscreen.addEventListener('click', toggleFullscreen);

  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
  document.addEventListener('mozfullscreenchange', updateFullscreenUI);
  document.addEventListener('MSFullscreenChange', updateFullscreenUI);
}

function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function updateFullscreenUI() {
  const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
  DOM.fullscreenIcon.textContent = isFull ? '🗗' : '⛶';
  DOM.fullscreenText.textContent = isFull ? 'Keluar' : 'Layar Penuh';
  DOM.btnFullscreen.classList.toggle('btn-calc-active', isFull);
}

/* ==========================================================================
   DATA LOADING & EXAM INITIALIZATION
   ========================================================================== */
function loadInitialData() {
  fetch('questions.json?t=' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      loadExamData(data);
    })
    .catch(err => {
      console.warn('Load questions.json fallback:', err);
      loadFallbackData();
    });
}

function loadExamData(data) {
  State.examData = data;
  
  if (data.testInfo) {
    DOM.startTitle.textContent = data.testInfo.title || 'SIMULASI TES HAIRIL';
    DOM.startSubtitle.textContent = `${data.testInfo.subtitle || 'Operasi Bilangan'} • Tahun ${data.testInfo.year || '2025/2026'}`;
    if (data.testInfo.defaultTimeMinutes) {
      DOM.inputCustomTime.value = data.testInfo.defaultTimeMinutes;
    }
  }

  populateSubtestDropdown(data);
}

function populateSubtestDropdown(data) {
  DOM.selectSubtest.innerHTML = '';
  
  let totalQuestions = 0;
  if (data.subtests && data.subtests.length > 0) {
    data.subtests.forEach(st => {
      totalQuestions += (st.questions ? st.questions.length : 0);
    });

    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = `⭐ Semua Paket Lengkap (${totalQuestions} Soal)`;
    DOM.selectSubtest.appendChild(optAll);

    data.subtests.forEach((st, idx) => {
      const opt = document.createElement('option');
      opt.value = st.id || `subtest-${idx}`;
      opt.textContent = `${st.name} (${st.questions ? st.questions.length : 0} Soal - ${st.timeMinutes || 15} Menit)`;
      DOM.selectSubtest.appendChild(opt);
    });

    DOM.subtestCountInfo.textContent = `Tersedia ${data.subtests.length} paket latihan dengan total ${totalQuestions} soal.`;
  }
}

function handleSubtestSelectionChange() {
  const selectedId = DOM.selectSubtest.value;
  if (selectedId === 'all') {
    State.activeSubtest = null;
    if (State.examData && State.examData.testInfo && State.examData.testInfo.defaultTimeMinutes) {
      DOM.inputCustomTime.value = State.examData.testInfo.defaultTimeMinutes;
    }
  } else {
    const subtest = State.examData.subtests.find(s => (s.id === selectedId || `subtest-${State.examData.subtests.indexOf(s)}` === selectedId));
    if (subtest) {
      State.activeSubtest = subtest;
      if (subtest.timeMinutes) {
        DOM.inputCustomTime.value = subtest.timeMinutes;
      }
    }
  }
}

function handleCustomJsonUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target.result);
      if (!json.subtests && !json.questions) {
        alert('Format JSON tidak valid. Harus memiliki properti "subtests" atau "questions".');
        return;
      }
      
      let structuredJson = json;
      if (json.questions && !json.subtests) {
        structuredJson = {
          testInfo: json.testInfo || { title: "SIMULASI TES HAIRIL (KUSTOM)", subtitle: file.name, year: "2025/2026", defaultTimeMinutes: 20 },
          subtests: [
            { id: "custom-1", name: "Paket Soal Kustom", timeMinutes: json.timeMinutes || 20, questions: json.questions }
          ]
        };
      }

      loadExamData(structuredJson);
      DOM.loadedFileStatus.style.display = 'block';
      DOM.loadedFileStatus.textContent = `✓ Berhasil memuat: ${file.name}`;
    } catch (err) {
      alert('Gagal membaca file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function initDropZone() {
  DOM.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.style.borderColor = '#1976d2';
    DOM.dropZone.style.background = '#e2e8f0';
  });

  DOM.dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    DOM.dropZone.style.borderColor = '#94a3b8';
    DOM.dropZone.style.background = '#f1f5f9';
  });

  DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.style.borderColor = '#94a3b8';
    DOM.dropZone.style.background = '#f1f5f9';
    if (e.dataTransfer.files.length > 0) {
      DOM.fileJsonInput.files = e.dataTransfer.files;
      handleCustomJsonUpload({ target: DOM.fileJsonInput });
    }
  });
}

/* ==========================================================================
   EXAM FLOW & WORKSPACE
   ========================================================================== */
function handleStartExam() {
  State.userData.name = DOM.inputUserName.value.trim() || 'MUHAMMAD HAIRIL';
  State.userData.id = DOM.inputUserId.value.trim() || '25-3401-0891-01';
  State.userData.token = DOM.inputToken.value.trim() || 'HAIRIL-2025';

  const selectedSubtestId = DOM.selectSubtest.value;
  State.activeQuestions = [];

  if (selectedSubtestId === 'all') {
    State.examData.subtests.forEach(st => {
      if (st.questions) {
        st.questions.forEach(q => {
          State.activeQuestions.push({
            ...q,
            subtestName: st.name
          });
        });
      }
    });
    DOM.examHeaderSubtest.textContent = 'Operasi Bilangan (Paket Lengkap)';
  } else {
    const subtest = State.examData.subtests.find(s => (s.id === selectedSubtestId || `subtest-${State.examData.subtests.indexOf(s)}` === selectedSubtestId));
    if (subtest && subtest.questions) {
      State.activeQuestions = subtest.questions.map(q => ({
        ...q,
        subtestName: subtest.name
      }));
      DOM.examHeaderSubtest.textContent = subtest.name;
    }
  }

  if (State.activeQuestions.length === 0) {
    alert('Tidak ada soal yang tersedia pada paket ini.');
    return;
  }

  // Set user custom time
  const customMinutes = parseInt(DOM.inputCustomTime.value, 10) || 20;
  State.totalTimeAllocatedSeconds = customMinutes * 60;
  State.timeRemainingSeconds = State.totalTimeAllocatedSeconds;

  // Initialize answer states
  State.userAnswers = {};
  State.doubtStatus = {};
  State.currentIndex = 0;
  State.isFinished = false;
  State.startTime = new Date();

  // Populate Header profile
  DOM.displayUserName.textContent = State.userData.name;
  DOM.displayUserId.textContent = State.userData.id;

  // Switch Screen
  showScreen('exam');

  // Build grid & load first question
  buildQuestionGrid();
  loadQuestion(0);

  // Start Timer
  startTimer();
}

function showScreen(screenKey) {
  Object.keys(DOM.screens).forEach(k => {
    DOM.screens[k].classList.remove('active');
  });
  DOM.screens[screenKey].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildQuestionGrid() {
  DOM.questionGrid.innerHTML = '';
  State.activeQuestions.forEach((q, idx) => {
    const box = document.createElement('button');
    box.className = 'cat-num-box';
    box.id = `grid-box-${idx}`;
    box.textContent = idx + 1;
    box.title = `Lompat ke Soal Nomor ${idx + 1}`;
    
    box.addEventListener('click', () => {
      navigateQuestion(idx);
      if (window.innerWidth <= 900) {
        DOM.catSidebar.classList.remove('mobile-open');
      }
    });

    DOM.questionGrid.appendChild(box);
  });
  updateGridStatus();
}

function updateGridStatus() {
  State.activeQuestions.forEach((q, idx) => {
    const box = document.getElementById(`grid-box-${idx}`);
    if (!box) return;

    box.className = 'cat-num-box';
    const isAnswered = State.userAnswers[idx] !== undefined && State.userAnswers[idx] !== null;
    const isDoubt = State.doubtStatus[idx] === true;
    const isCurrent = idx === State.currentIndex;

    if (isCurrent) box.classList.add('is-current');
    if (isAnswered) box.classList.add('is-answered');
    if (isDoubt) box.classList.add('is-doubt');

    let tag = box.querySelector('.mini-tag');
    if (isAnswered) {
      if (!tag) {
        tag = document.createElement('span');
        tag.className = 'mini-tag';
        box.appendChild(tag);
      }
      tag.textContent = State.userAnswers[idx];
    } else if (tag) {
      tag.remove();
    }
  });
}

function loadQuestion(index) {
  State.currentIndex = index;
  const q = State.activeQuestions[index];
  if (!q) return;

  DOM.currentQBadge.textContent = `SOAL NOMOR: ${index + 1}`;

  // Category Tag
  if (q.category) {
    DOM.currentQCategory.style.display = 'inline-block';
    DOM.currentQCategory.textContent = q.category;
  } else {
    DOM.currentQCategory.style.display = 'none';
  }

  DOM.questionText.textContent = q.question;

  DOM.optionsContainer.innerHTML = '';
  const currentAnswer = State.userAnswers[index];

  if (q.options) {
    const keys = Object.keys(q.options).sort();
    keys.forEach(key => {
      const row = document.createElement('div');
      row.className = 'cat-option-row';
      if (currentAnswer === key) {
        row.classList.add('active-selected');
      }

      row.innerHTML = `
        <div class="cat-option-circle">${key}</div>
        <div class="cat-option-content">${q.options[key]}</div>
      `;

      row.addEventListener('click', () => selectOption(key));
      DOM.optionsContainer.appendChild(row);
    });
  }

  // Doubt checkbox state
  DOM.checkboxRagu.checked = !!State.doubtStatus[index];
  DOM.labelRagu.classList.toggle('is-checked', !!State.doubtStatus[index]);

  // Nav buttons state
  DOM.btnPrev.disabled = (index === 0);
  
  const isLast = (index === State.activeQuestions.length - 1);
  if (isLast) {
    DOM.btnNext.style.display = 'none';
    DOM.btnFinishTrigger.style.display = 'flex';
  } else {
    DOM.btnNext.style.display = 'flex';
    DOM.btnFinishTrigger.style.display = 'none';
  }

  updateGridStatus();
}

function navigateQuestion(newIndex) {
  if (newIndex >= 0 && newIndex < State.activeQuestions.length) {
    loadQuestion(newIndex);
  }
}

function selectOption(optionKey) {
  State.userAnswers[State.currentIndex] = optionKey;
  
  const rows = DOM.optionsContainer.querySelectorAll('.cat-option-row');
  const keys = Object.keys(State.activeQuestions[State.currentIndex].options).sort();
  rows.forEach((row, idx) => {
    if (keys[idx] === optionKey) {
      row.classList.add('active-selected');
    } else {
      row.classList.remove('active-selected');
    }
  });

  updateGridStatus();
}

function handleToggleDoubt() {
  State.doubtStatus[State.currentIndex] = DOM.checkboxRagu.checked;
  DOM.labelRagu.classList.toggle('is-checked', DOM.checkboxRagu.checked);
  updateGridStatus();
}

function setFontSize(level) {
  State.fontSizeLevel = level;
  DOM.workspaceContainer.className = `cat-main-card font-${level}`;

  DOM.btnFontSm.classList.toggle('active', level === 'sm');
  DOM.btnFontMd.classList.toggle('active', level === 'md');
  DOM.btnFontLg.classList.toggle('active', level === 'lg');
}

/* ==========================================================================
   TIMER CONTROLLER
   ========================================================================== */
function startTimer() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  updateTimerDisplay();

  State.timerInterval = setInterval(() => {
    State.timeRemainingSeconds--;
    updateTimerDisplay();

    if (State.timeRemainingSeconds <= 0) {
      clearInterval(State.timerInterval);
      alert('⏱️ Waktu ujian Anda telah habis! Sistem akan mengumpulkan jawaban secara otomatis.');
      handleFinishExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const totalSec = Math.max(0, State.timeRemainingSeconds);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  DOM.timerDisplay.textContent = 
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (totalSec <= 180 && totalSec > 0) {
    DOM.timerBox.classList.add('warning-pulse');
  } else {
    DOM.timerBox.classList.remove('warning-pulse');
  }
}

/* ==========================================================================
   CONFIRMATION MODAL & FINISH EXAM
   ========================================================================== */
function openConfirmModal() {
  const total = State.activeQuestions.length;
  let answered = 0;
  let doubt = 0;

  for (let i = 0; i < total; i++) {
    if (State.userAnswers[i] !== undefined && State.userAnswers[i] !== null) {
      answered++;
    }
    if (State.doubtStatus[i]) {
      doubt++;
    }
  }

  DOM.modalTotalQ.textContent = total;
  DOM.modalAnsweredQ.textContent = answered;
  DOM.modalDoubtQ.textContent = doubt;
  DOM.modalUnansweredQ.textContent = total - answered;

  DOM.modalCheckConfirm.checked = false;
  DOM.btnModalConfirm.disabled = true;
  DOM.btnModalConfirm.style.opacity = '0.5';
  DOM.btnModalConfirm.style.cursor = 'not-allowed';

  DOM.confirmModal.classList.add('active');
}

function closeConfirmModal() {
  DOM.confirmModal.classList.remove('active');
}

function handleFinishExam() {
  closeConfirmModal();
  if (State.timerInterval) clearInterval(State.timerInterval);
  State.isFinished = true;
  State.endTime = new Date();

  // Close calculator if open
  Calculator.close();

  // Calculate score and breakdown
  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;

  State.activeQuestions.forEach((q, idx) => {
    const userAns = State.userAnswers[idx];
    if (userAns === undefined || userAns === null) {
      emptyCount++;
    } else if (userAns === q.correctAnswer) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const total = State.activeQuestions.length;
  const scaledScore = total > 0 ? Math.round((correctCount / total) * 1000) : 0;
  const timeSpentSec = State.totalTimeAllocatedSeconds - State.timeRemainingSeconds;
  const spentMinutes = Math.floor(timeSpentSec / 60);
  const spentSeconds = timeSpentSec % 60;

  // Populate Result Screen
  DOM.resultScoreVal.textContent = scaledScore;
  DOM.resultUserMeta.textContent = `Peserta: ${State.userData.name} | No: ${State.userData.id}`;
  DOM.statCorrectCount.textContent = correctCount;
  DOM.statWrongCount.textContent = wrongCount;
  DOM.statEmptyCount.textContent = emptyCount;
  DOM.statTimeSpent.textContent = `${spentMinutes}m ${spentSeconds}s`;

  if (scaledScore >= 750) {
    DOM.resultFeedbackText.textContent = `🌟 Luar biasa! Penguasaan materi Penalaran Umum Anda sangat matang (Skor: ${scaledScore}/1000).`;
  } else if (scaledScore >= 500) {
    DOM.resultFeedbackText.textContent = `👍 Kerja bagus! Terus asah kecepatan analisis pola dan hubungan (Skor: ${scaledScore}/1000).`;
  } else {
    DOM.resultFeedbackText.textContent = `💪 Tetap semangat! Pelajari kembali nomor-nomor yang salah pada pembahasan di bawah.`;
  }

  // Populate Mistake Analysis Chips (Soal Salah & Kosong)
  populateMistakeAnalysis();

  renderReviewList();
  showScreen('result');
}

function populateMistakeAnalysis() {
  if (!DOM.listWrongChips || !DOM.listEmptyChips) return;

  DOM.listWrongChips.innerHTML = '';
  DOM.listEmptyChips.innerHTML = '';

  let wrongFound = 0;
  let emptyFound = 0;

  State.activeQuestions.forEach((q, idx) => {
    const userAns = State.userAnswers[idx];
    const isCorrect = (userAns === q.correctAnswer);
    const isEmpty = (userAns === undefined || userAns === null);
    const isWrong = (!isEmpty && !isCorrect);

    if (isWrong) {
      wrongFound++;
      const chip = document.createElement('button');
      chip.className = 'mistake-chip';
      chip.type = 'button';
      chip.innerHTML = `❌ No. ${idx + 1} (Jwb: ${userAns} ➔ Kunci: ${q.correctAnswer})`;
      chip.title = `Klik untuk melihat pembahasan Soal No. ${idx + 1}`;
      chip.addEventListener('click', () => {
        scrollToReviewItem(idx);
      });
      DOM.listWrongChips.appendChild(chip);
    } else if (isEmpty) {
      emptyFound++;
      const chip = document.createElement('button');
      chip.className = 'empty-chip';
      chip.type = 'button';
      chip.innerHTML = `⚪ No. ${idx + 1} (Kunci: ${q.correctAnswer})`;
      chip.title = `Klik untuk melihat pembahasan Soal No. ${idx + 1}`;
      chip.addEventListener('click', () => {
        scrollToReviewItem(idx);
      });
      DOM.listEmptyChips.appendChild(chip);
    }
  });

  if (wrongFound === 0) {
    DOM.listWrongChips.innerHTML = '<span style="font-size: 0.82rem; color: #166534; font-weight: 700;">🎉 Hebat! Tidak ada jawaban yang salah.</span>';
  }

  if (emptyFound === 0) {
    DOM.listEmptyChips.innerHTML = '<span style="font-size: 0.82rem; color: #166534; font-weight: 700;">✓ Semua soal telah dijawab.</span>';
  }
}

function scrollToReviewItem(idx) {
  // Ensure filter includes this question
  const targetFilterBtn = document.querySelector('.btn-filter-review[data-filter="all"]');
  if (targetFilterBtn) {
    document.querySelectorAll('.btn-filter-review').forEach(b => b.classList.remove('active'));
    targetFilterBtn.classList.add('active');
    State.filterReview = 'all';
    renderReviewList();
  }

  setTimeout(() => {
    const el = document.getElementById(`review-item-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 3px #ef4444';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 2000);
    }
  }, 100);
}

function renderReviewList() {
  DOM.reviewListContainer.innerHTML = '';

  State.activeQuestions.forEach((q, idx) => {
    const userAns = State.userAnswers[idx];
    const isCorrect = (userAns === q.correctAnswer);
    const isEmpty = (userAns === undefined || userAns === null);
    const isWrong = (!isEmpty && !isCorrect);

    if (State.filterReview === 'correct' && !isCorrect) return;
    if (State.filterReview === 'wrong' && !isWrong) return;
    if (State.filterReview === 'empty' && !isEmpty) return;

    const item = document.createElement('div');
    item.className = 'cat-review-item';
    item.id = `review-item-${idx}`;

    if (isCorrect) item.classList.add('is-correct');
    else if (isWrong) item.classList.add('is-wrong');
    else item.classList.add('is-empty');

    const statusBadge = isCorrect 
      ? '<span style="color:#2e7d32; font-weight:800; background:#dcfce7; padding:3px 8px; border-radius:4px; border:1px solid #86efac;">✓ BENAR</span>'
      : (isEmpty ? '<span style="color:#d97706; font-weight:800; background:#fef3c7; padding:3px 8px; border-radius:4px; border:1px solid #fde68a;">⚪ DIKOSONGKAN</span>' : '<span style="color:#d32f2f; font-weight:800; background:#fee2e2; padding:3px 8px; border-radius:4px; border:1px solid #fca5a5;">❌ SALAH</span>');

    const categoryText = q.category ? `<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:3px; font-size:0.75rem; font-weight:700; margin-right:6px;">${q.category}</span>` : '';

    let optionsHtml = '';
    if (q.options) {
      Object.keys(q.options).sort().forEach(k => {
        let optStyle = "padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; font-size: 0.9rem; background: #f8fafc; border: 1px solid #cbd5e1;";
        let marker = "";

        if (k === q.correctAnswer) {
          optStyle = "padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; font-size: 0.9rem; background: #dcfce7; color: #166534; font-weight: 700; border: 1.5px solid #22c55e;";
          marker = " <span style='font-size:0.8rem; color:#166534;'>(KUNCI JAWABAN BENAR)</span>";
        }
        
        if (k === userAns) {
          if (!isCorrect) {
            optStyle = "padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; font-size: 0.9rem; background: #fee2e2; color: #991b1b; font-weight: 700; border: 1.5px solid #ef4444;";
            marker = " <span style='font-size:0.8rem; color:#991b1b;'>(JAWABAN ANDA - SALAH)</span>";
          } else {
            marker = " <span style='font-size:0.8rem; color:#166534;'>(JAWABAN ANDA - BENAR ✓)</span>";
          }
        }

        optionsHtml += `<div style="${optStyle}"><strong>${k}.</strong> ${q.options[k]}${marker}</div>`;
      });
    }

    const answerSummary = isEmpty
      ? `<div style="background:#fffbeb; padding:6px 10px; border-radius:4px; font-size:0.85rem; color:#92400e; margin-bottom:8px; border:1px solid #fde68a;"><strong>Status:</strong> Anda tidak menjawab soal ini • Kunci benar adalah <strong>[ ${q.correctAnswer} ]</strong></div>`
      : (isCorrect
        ? `<div style="background:#f0fdf4; padding:6px 10px; border-radius:4px; font-size:0.85rem; color:#166534; margin-bottom:8px; border:1px solid #bbf7d0;"><strong>Status:</strong> Jawaban Anda <strong>[ ${userAns} ]</strong> Tepat ✓</div>`
        : `<div style="background:#fef2f2; padding:6px 10px; border-radius:4px; font-size:0.85rem; color:#991b1b; margin-bottom:8px; border:1px solid #fecaca;"><strong>Status:</strong> Anda menjawab <strong>[ ${userAns} ]</strong> • Jawaban yang benar adalah <strong>[ ${q.correctAnswer} ]</strong></div>`);

    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1.5px solid #e2e8f0; padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:6px;">
          ${categoryText}
          <strong style="color:var(--bppp-navy); font-size:0.95rem;">Soal Nomor ${idx + 1}</strong>
        </div>
        <div>${statusBadge}</div>
      </div>

      ${answerSummary}

      <p style="white-space:pre-line; margin-bottom:12px; font-weight:500; font-size:0.95rem; line-height:1.6;">${q.question}</p>
      <div style="margin-bottom:12px;">${optionsHtml}</div>
      
      <div class="cat-pembahasan-box">
        <strong style="color:#15375c; display:block; margin-bottom:4px; font-size:0.92rem;">💡 Pembahasan Lengkap:</strong>
        <p style="white-space:pre-line; line-height:1.6;">${q.explanation || 'Pembahasan belum tersedia untuk butir soal ini.'}</p>
      </div>
    `;

    DOM.reviewListContainer.appendChild(item);
  });
}

/* ==========================================================================
   📥 DOWNLOAD EVALUATION REPORT & FILE SOAL
   ========================================================================== */
function downloadEvaluationReport() {
  const total = State.activeQuestions.length;
  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;
  const wrongList = [];
  const emptyList = [];

  State.activeQuestions.forEach((q, idx) => {
    const userAns = State.userAnswers[idx];
    if (userAns === undefined || userAns === null) {
      emptyCount++;
      emptyList.push({ no: idx + 1, key: q.correctAnswer, category: q.category || 'Penalaran' });
    } else if (userAns === q.correctAnswer) {
      correctCount++;
    } else {
      wrongCount++;
      wrongList.push({ no: idx + 1, userAns: userAns, key: q.correctAnswer, category: q.category || 'Penalaran' });
    }
  });

  const scaledScore = total > 0 ? Math.round((correctCount / total) * 1000) : 0;
  const timeSpentSec = State.totalTimeAllocatedSeconds - State.timeRemainingSeconds;
  const spentMinutes = Math.floor(timeSpentSec / 60);
  const spentSeconds = timeSpentSec % 60;
  const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });

  let text = `================================================================================\n`;
  text += `               LAPORAN HASIL EVALUASI SIMULASI TES HAIRIL\n`;
  text += `                 SISTEM UJIAN CAT - PENALARAN UMUM (TPS)\n`;
  text += `================================================================================\n\n`;

  text += `IDENTITAS PESERTA:\n`;
  text += `• Nama Peserta     : ${State.userData.name}\n`;
  text += `• Nomor Peserta    : ${State.userData.id}\n`;
  text += `• Sesi Token       : ${State.userData.token}\n`;
  text += `• Subtes / Materi  : ${DOM.examHeaderSubtest ? DOM.examHeaderSubtest.textContent : 'Penalaran Umum'}\n`;
  text += `• Waktu Ujian      : ${nowStr}\n`;
  text += `• Durasi Pengerjaan: ${spentMinutes} Menit ${spentSeconds} Detik\n\n`;

  text += `RINGKASAN HASIL EVALUASI:\n`;
  text += `--------------------------------------------------------------------------------\n`;
  text += `★ SKOR AKHIR       : ${scaledScore} / 1000\n`;
  text += `• Total Soal       : ${total}\n`;
  text += `• Jawaban Benar    : ${correctCount} Soal\n`;
  text += `• Jawaban Salah    : ${wrongCount} Soal\n`;
  text += `• Dikosongkan      : ${emptyCount} Soal\n`;
  text += `--------------------------------------------------------------------------------\n\n`;

  text += `================================================================================\n`;
  text += `📌 BAGIAN 1: DAFTAR TEMPAT KESALAHAN & SOAL YANG PERLU DIPELAJARI KEMBALI\n`;
  text += `================================================================================\n`;

  if (wrongList.length === 0 && emptyList.length === 0) {
    text += `(Sempurna! Anda menjawab semua soal dengan benar 100%)\n\n`;
  } else {
    if (wrongList.length > 0) {
      text += `\n❌ DAFTAR SOAL YANG SALAH (${wrongList.length} Soal):\n`;
      wrongList.forEach(w => {
        text += `  • Soal Nomor ${w.no} [${w.category}] : Jawaban Anda '${w.userAns}' (SALAH) -> Kunci Benar '${w.key}'\n`;
      });
    }

    if (emptyList.length > 0) {
      text += `\n⚪ DAFTAR SOAL YANG DIKOSONGKAN (${emptyList.length} Soal):\n`;
      emptyList.forEach(e => {
        text += `  • Soal Nomor ${e.no} [${e.category}] : Tidak Dijawab -> Kunci Benar '${e.key}'\n`;
      });
    }
    text += `\n`;
  }

  text += `================================================================================\n`;
  text += `📖 BAGIAN 2: RINCIAN SELURUH SOAL, KUNCI JAWABAN & PEMBAHASAN LENGKAP\n`;
  text += `================================================================================\n\n`;

  State.activeQuestions.forEach((q, idx) => {
    const userAns = State.userAnswers[idx];
    const isCorrect = (userAns === q.correctAnswer);
    const isEmpty = (userAns === undefined || userAns === null);
    const statusText = isCorrect ? 'BENAR ✓' : (isEmpty ? 'DIKOSONGKAN ⚪' : 'SALAH ❌');

    text += `--------------------------------------------------------------------------------\n`;
    text += `SOAL NOMOR ${idx + 1} [${q.category || 'Penalaran'}] — Status: ${statusText}\n`;
    text += `--------------------------------------------------------------------------------\n`;
    text += `Pertanyaan:\n${q.question}\n\n`;

    if (q.options) {
      text += `Pilihan Jawaban:\n`;
      Object.keys(q.options).sort().forEach(k => {
        let tag = "";
        if (k === q.correctAnswer) tag += " [KUNCI BENAR]";
        if (k === userAns) tag += " [JAWABAN ANDA]";
        text += `  ${k}. ${q.options[k]}${tag}\n`;
      });
    }

    text += `\n`;
    text += `• Jawaban Anda    : ${userAns ? userAns : '(Tidak dijawab)'}\n`;
    text += `• Kunci Jawaban   : ${q.correctAnswer}\n`;
    text += `\n💡 PEMBAHASAN:\n${q.explanation || 'Pembahasan tidak tersedia.'}\n\n`;
  });

  text += `================================================================================\n`;
  text += `                 AKHIR LAPORAN EVALUASI SIMULASI TES HAIRIL\n`;
  text += `================================================================================\n`;

  // Trigger Download
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Hasil_Simulasi_Tes_Hairil_${State.userData.name.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJsonFile() {
  const dataToExport = State.examData || {
    testInfo: { title: "SIMULASI TES HAIRIL", year: "2025/2026" },
    subtests: [{ id: "pu-pola-hubungan", questions: State.activeQuestions }]
  };

  const jsonStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bank_Soal_Tes_Hairil.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetAndRestartExam() {
  handleStartExam();
}

function returnToStartScreen() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  showScreen('start');
}

/* Fallback Offline Data */
function loadFallbackData() {
  const fallback = {
    testInfo: {
      title: "SIMULASI TES HAIRIL",
      subtitle: "Penalaran Umum (TPS) - Pola dan Hubungan",
      year: "2025 / 2026",
      defaultTimeMinutes: 30
    },
    subtests: [
      {
        id: "pu-pola-a",
        name: "Paket A: Pola dan Hubungan (20 Soal)",
        category: "Penalaran Umum",
        subcategory: "Pola dan Hubungan",
        timeMinutes: 30,
        questions: [
          {
            id: 1,
            category: "Pola Angka",
            question: "Perhatikan barisan bilangan berikut:\n3,  7,  11,  15,  19,  ...\n\nBilangan yang tepat untuk melanjutkan barisan tersebut adalah...",
            options: { "A": "21", "B": "22", "C": "23", "D": "24", "E": "25" },
            correctAnswer: "C",
            explanation: "Pola barisan adalah penjumlahan konstan (+4): 19 + 4 = 23."
          },
          {
            id: 2,
            category: "Pola Hubungan Objek",
            question: "DOKTER : STETOSKOP = KOKI : ...",
            options: { "A": "Restoran", "B": "Pisau Masak", "C": "Makanan", "D": "Celemek", "E": "Pelayan" },
            correctAnswer: "B",
            explanation: "Hubungan profesi dan alat kerja utamanya: Dokter memakai stetoskop, Koki memakai pisau masak."
          },
          {
            id: 3,
            category: "Pola Angka",
            question: "Perhatikan deret angka berikut:\n2,  6,  18,  54,  ...\n\nAngka yang paling tepat untuk mengisi kelanjutan deret di atas adalah...",
            options: { "A": "108", "B": "144", "C": "152", "D": "162", "E": "172" },
            correctAnswer: "D",
            explanation: "Pola barisan adalah perkalian konstan (x3): 54 x 3 = 162."
          },
          {
            id: 4,
            category: "Pola Hubungan Hirarki",
            question: "DETIK : MENIT = MENIT : ...",
            options: { "A": "Waktu", "B": "Arloji", "C": "Jam", "D": "Hari", "E": "Kalender" },
            correctAnswer: "C",
            explanation: "Hubungan satuan ukuran waktu ke tingkat berikutnya: 60 detik = 1 menit, 60 menit = 1 jam."
          },
          {
            id: 5,
            category: "Pola Pasangan Bilangan",
            question: "Perhatikan pola hubungan pasangan bilangan berikut:\n(2 -> 5),  (4 -> 9),  (7 -> 15),  (10 -> ...)\n\nBilangan yang tepat untuk melengkapi pasangan terakhir adalah...",
            options: { "A": "19", "B": "20", "C": "21", "D": "22", "E": "23" },
            correctAnswer: "C",
            explanation: "Pola hubungan: y = 2x + 1. Untuk x = 10 -> (10 x 2) + 1 = 21."
          },
          {
            id: 6,
            category: "Pola Deret Fibonacci",
            question: "Diberikan barisan bilangan sebagai berikut:\n1,  2,  3,  5,  8,  13,  21,  ...\n\nNilai bilangan selanjutnya pada barisan tersebut adalah...",
            options: { "A": "29", "B": "31", "C": "34", "D": "36", "E": "42" },
            correctAnswer: "C",
            explanation: "Pola deret Fibonacci (jumlah 2 suku sebelumnya): 13 + 21 = 34."
          },
          {
            id: 7,
            category: "Pola Sebab-Akibat",
            question: "KEMARAU : KEKERINGAN = HUJAN LEBAT : ...",
            options: { "A": "Payung", "B": "Mendung", "C": "Banjir", "D": "Dingin", "E": "Petir" },
            correctAnswer: "C",
            explanation: "Kemarau menyebabkan kekeringan, hujan lebat menyebabkan banjir."
          },
          {
            id: 8,
            category: "Pola Deret Berselang",
            question: "Perhatikan deret angka berselang berikut:\n5,  12,  8,  15,  11,  18,  14,  ...\n\nAngka yang tepat untuk mengisi posisi selanjutnya adalah...",
            options: { "A": "17", "B": "19", "C": "21", "D": "23", "E": "25" },
            correctAnswer: "C",
            explanation: "Larik posisi genap bertambah 3 secara teratur: 12, 15, 18, 21."
          },
          {
            id: 9,
            category: "Pola Operasi Bangun",
            question: "Pada sebuah segitiga pertama, angka di ketiga sudutnya adalah 4 (kiri), 5 (kanan), dan 3 (bawah) dengan angka di tengah bernilai 23.\n\nJika pada segitiga kedua berlaku pola operasi yang sama dengan angka sudut 6 (kiri), 7 (kanan), dan 5 (bawah), maka angka di bagian tengah segitiga kedua adalah...",
            options: { "A": "37", "B": "42", "C": "45", "D": "47", "E": "52" },
            correctAnswer: "D",
            explanation: "Tengah = (Sudut Kiri x Sudut Kanan) + Sudut Bawah = (6 x 7) + 5 = 42 + 5 = 47."
          },
          {
            id: 10,
            category: "Pola Hubungan Bahan Baku",
            question: "KAYU : MEJA = GANDUM : ...",
            options: { "A": "Ladang", "B": "Roti", "C": "Beras", "D": "Petani", "E": "Oven" },
            correctAnswer: "B",
            explanation: "Kayu adalah bahan baku meja; Gandum adalah bahan baku roti."
          },
          {
            id: 11,
            category: "Pola Huruf Bertingkat",
            question: "Perhatikan pola barisan huruf berikut:\nB,  D,  G,  K,  P,  ...\n\nHuruf selanjutnya yang tepat untuk melengkapi barisan di atas adalah...",
            options: { "A": "T", "B": "U", "C": "V", "D": "W", "E": "X" },
            correctAnswer: "C",
            explanation: "Lompatan alfabet bertingkat (+2, +3, +4, +5, +6): P (16) + 6 = V (22)."
          },
          {
            id: 12,
            category: "Pola Matriks / Tabel",
            question: "Perhatikan susunan bilangan pada tabel berikut:\nBaris 1 :  3    7   ->  20\nBaris 2 :  5    6   ->  22\nBaris 3 :  4    9   ->  ?\n\nJika pola hubungan bilangan pada setiap baris adalah sama, nilai pengganti tanda tanya (?) adalah...",
            options: { "A": "24", "B": "25", "C": "26", "D": "28", "E": "30" },
            correctAnswer: "C",
            explanation: "Hasil = (Kolom 1 + Kolom 2) x 2. Baris 3: (4 + 9) x 2 = 13 x 2 = 26."
          },
          {
            id: 13,
            category: "Pola Hubungan Kompleks",
            question: "PILIHAN GANDA : UJIAN : NILAI = ... : ... : ...",
            options: {
              "A": "Suara : Pemilu : Pemenang",
              "B": "Pensil : Kertas : Tulisan",
              "C": "Bahan : Resep : Masakan",
              "D": "Roda : Sepeda : Kecepatan",
              "E": "Pertandingan : Wasit : Skor"
            },
            correctAnswer: "A",
            explanation: "Pilihan ganda digunakan dalam Ujian untuk menghasilkan Nilai; Suara digunakan dalam Pemilu untuk menentukan Pemenang."
          },
          {
            id: 14,
            category: "Pola Bangun Segiempat",
            question: "Diberikan bangun segiempat dengan 4 angka di setiap sudutnya (A=kiri atas, B=kanan atas, C=kiri bawah, D=kanan bawah) dan angka di tengahnya:\n• Bangun 1: Sudut (8, 5, 4, 3) -> Tengah = 28\n• Bangun 2: Sudut (9, 6, 5, 4) -> Tengah = 34\n• Bangun 3: Sudut (10, 7, 6, 5) -> Tengah = ?\n\nBerdasarkan pola tersebut, nilai tengah pada Bangun 3 adalah...",
            options: { "A": "36", "B": "38", "C": "40", "D": "42", "E": "44" },
            correctAnswer: "C",
            explanation: "Tengah = (A x B) - (C x D). Bangun 3: (10 x 7) - (6 x 5) = 70 - 30 = 40."
          },
          {
            id: 15,
            category: "Pola Alfanumerik",
            question: "Perhatikan pola kombinasi angka dan huruf berikut:\n2A,  5C,  10F,  17J,  ...\n\nPasangan angka dan huruf berikutnya yang tepat adalah...",
            options: { "A": "24N", "B": "25N", "C": "26O", "D": "26P", "E": "27O" },
            correctAnswer: "C",
            explanation: "Angka: 17 + 9 = 26. Huruf: J (10) + 5 = O (15). Hasil = 26O."
          },
          {
            id: 16,
            category: "Pola Deret Majemuk",
            question: "Perhatikan barisan bilangan berikut:\n3,  4,  8,  9,  18,  19,  38,  ...\n\nBilangan yang tepat untuk melanjutkan deret tersebut adalah...",
            options: { "A": "39", "B": "40", "C": "76", "D": "77", "E": "78" },
            correctAnswer: "A",
            explanation: "Pola operasi bergantian (+1, x2): 38 + 1 = 39."
          },
          {
            id: 17,
            category: "Pola Diagram Relasi",
            question: "Diberikan tiga diagram lingkaran dengan pola bilangan terpusat:\n• Diagram 1: Angka Luar (14, 6, 2) -> Pusat = 10\n• Diagram 2: Angka Luar (25, 15, 4) -> Pusat = 10\n• Diagram 3: Angka Luar (36, 18, 6) -> Pusat = ?\n\nJika aturan operasi bilangan pada ketiga diagram adalah sama, nilai pusat pada Diagram 3 adalah...",
            options: { "A": "7", "B": "8", "C": "9", "D": "10", "E": "12" },
            correctAnswer: "C",
            explanation: "Pusat = (Angka 1 + Angka 2) / Angka 3. Diagram 3: (36 + 18) / 6 = 54 / 6 = 9."
          },
          {
            id: 18,
            category: "Pola Sebab-Akibat Ganda",
            question: "VIRUS : INFEKSI : VAKSIN = ... : ... : ...",
            options: {
              "A": "Api : Kebakaran : Alat Pemadam",
              "B": "Air : Banjir : Hujan",
              "C": "Polusi : Udara : Masker",
              "D": "Bakteri : Sakit : Dokter",
              "E": "Minyak : Licin : Sabun"
            },
            correctAnswer: "A",
            explanation: "Virus menyebabkan infeksi yang dicegah dengan vaksin; Api menyebabkan kebakaran yang dipadamkan dengan alat pemadam."
          },
          {
            id: 19,
            category: "Pola Huruf Dua Arah",
            question: "Diberikan deret huruf berikut:\nA,  Z,  C,  X,  F,  U,  J,  ...\n\nHuruf yang paling tepat untuk mengisi posisi berikutnya adalah...",
            options: { "A": "P", "B": "Q", "C": "R", "D": "S", "E": "T" },
            correctAnswer: "B",
            explanation: "Larik genap mundur: Z (26) -2 -> X (24) -3 -> U (21) -4 -> Q (17)."
          },
          {
            id: 20,
            category: "Pola Operasi Silang Analitis",
            question: "Diberikan dua diagram susunan bilangan dengan pola operasi identik:\n• Diagram A: Empat bilangan di sudutnya adalah 7, 4, 3, dan 5 dengan angka pusat bernilai 43 (didapat dari perkalian silang: [7 x 4] + [3 x 5] = 28 + 15 = 43).\n\nJika pada Diagram B memiliki angka sudut 8, 6, 4, dan 5 dengan aturan pola yang sama, maka angka di pusat Diagram B adalah...",
            options: { "A": "62", "B": "64", "C": "66", "D": "68", "E": "72" },
            correctAnswer: "D",
            explanation: "Pusat = (Sudut 1 x Sudut 2) + (Sudut 3 x Sudut 4) = (8 x 6) + (4 x 5) = 48 + 20 = 68."
          }
        ]
      },
      {
        id: "pu-pola-b",
        name: "Paket B: Pola dan Hubungan Serupa (20 Soal Baru)",
        category: "Penalaran Umum",
        subcategory: "Pola dan Hubungan",
        timeMinutes: 30,
        questions: [
          {
            id: 1,
            category: "Pola Angka",
            question: "Perhatikan barisan bilangan berikut:\n4,  9,  14,  19,  24,  ...\n\nBilangan yang tepat untuk melanjutkan barisan tersebut adalah...",
            options: { "A": "27", "B": "28", "C": "29", "D": "30", "E": "31" },
            correctAnswer: "C",
            explanation: "Pola barisan adalah pertambahan tetap (+5): 24 + 5 = 29."
          },
          {
            id: 2,
            category: "Pola Hubungan Objek",
            question: "PENULIS : LAPTOP = PELUKIS : ...",
            options: { "A": "Galeri", "B": "Kuas", "C": "Kanvas", "D": "Patung", "E": "Pameran" },
            correctAnswer: "B",
            explanation: "Penulis memakai laptop untuk mengetik; Pelukis memakai kuas untuk melukis."
          },
          {
            id: 3,
            category: "Pola Angka",
            question: "Perhatikan deret angka berikut:\n3,  12,  48,  192,  ...\n\nAngka yang paling tepat untuk mengisi kelanjutan deret tersebut adalah...",
            options: { "A": "576", "B": "648", "C": "724", "D": "768", "E": "812" },
            correctAnswer: "D",
            explanation: "Pola geometri perkalian konstan (x4): 192 x 4 = 768."
          },
          {
            id: 4,
            category: "Pola Hubungan Hirarki",
            question: "HARI : MINGGU = BULAN : ...",
            options: { "A": "Abad", "B": "Dasawarsa", "C": "Tahun", "D": "Musim", "E": "Dekade" },
            correctAnswer: "C",
            explanation: "7 hari membentuk 1 minggu, 12 bulan membentuk 1 tahun."
          },
          {
            id: 5,
            category: "Pola Pasangan Bilangan",
            question: "Perhatikan pola hubungan pasangan bilangan berikut:\n(3 -> 7),  (5 -> 11),  (8 -> 17),  (12 -> ...)\n\nBilangan yang tepat untuk melengkapi pasangan terakhir adalah...",
            options: { "A": "23", "B": "24", "C": "25", "D": "26", "E": "27" },
            correctAnswer: "C",
            explanation: "Pola hubungan: y = 2x + 1. Untuk x = 12 -> (12 x 2) + 1 = 25."
          },
          {
            id: 6,
            category: "Pola Deret Fibonacci",
            question: "Diberikan barisan bilangan sebagai berikut:\n2,  3,  5,  8,  13,  21,  34,  ...\n\nNilai bilangan selanjutnya pada barisan tersebut adalah...",
            options: { "A": "47", "B": "51", "C": "55", "D": "58", "E": "62" },
            correctAnswer: "C",
            explanation: "Pola Fibonacci (penjumlahan 2 suku sebelumnya): 21 + 34 = 55."
          },
          {
            id: 7,
            category: "Pola Sebab-Akibat",
            question: "GEMPA BUMI : TSUNAMI = GUNUNG MELETUS : ...",
            options: { "A": "Lahar Panas", "B": "Hujan Es", "C": "Angin Topan", "D": "Gempa Dangkal", "E": "Banjir Bandang" },
            correctAnswer: "A",
            explanation: "Gempa bumi memicu tsunami; Letusan gunung api menghasilkan lahar panas."
          },
          {
            id: 8,
            category: "Pola Deret Berselang",
            question: "Perhatikan deret angka berselang berikut:\n6,  20,  10,  24,  14,  28,  18,  ...\n\nAngka yang tepat untuk mengisi posisi suku selanjutnya adalah...",
            options: { "A": "22", "B": "28", "C": "30", "D": "32", "E": "34" },
            correctAnswer: "D",
            explanation: "Larik posisi genap bertambah 4 konstan: 20, 24, 28, 32."
          },
          {
            id: 9,
            category: "Pola Operasi Bangun",
            question: "Pada sebuah segitiga pertama, angka di ketiga sudutnya adalah 5 (kiri), 4 (kanan), dan 6 (bawah) dengan angka di tengah bernilai 26.\n\nJika pada segitiga kedua berlaku pola operasi yang sama dengan angka sudut 7 (kiri), 8 (kanan), dan 9 (bawah), maka angka di bagian tengah segitiga kedua adalah...",
            options: { "A": "59", "B": "63", "C": "65", "D": "67", "E": "72" },
            correctAnswer: "C",
            explanation: "Tengah = (Sudut Kiri x Sudut Kanan) + Sudut Bawah = (7 x 8) + 9 = 56 + 9 = 65."
          },
          {
            id: 10,
            category: "Pola Hubungan Bahan Baku",
            question: "KELAPA SAWIT : MINYAK GORENG = BIJI KOPI : ...",
            options: { "A": "Minuman Kopi", "B": "Kebun", "C": "Cangkir", "D": "Kafe", "E": "Gula" },
            correctAnswer: "A",
            explanation: "Kelapa sawit diolah menjadi minyak goreng; Biji kopi diolah menjadi minuman kopi."
          },
          {
            id: 11,
            category: "Pola Huruf Bertingkat",
            question: "Perhatikan pola barisan huruf berikut:\nC,  E,  H,  L,  Q,  ...\n\nHuruf selanjutnya yang tepat untuk melengkapi barisan di atas adalah...",
            options: { "A": "U", "B": "V", "C": "W", "D": "X", "E": "Y" },
            correctAnswer: "C",
            explanation: "Lompatan alfabet (+2, +3, +4, +5, +6): Q (17) + 6 = W (23)."
          },
          {
            id: 12,
            category: "Pola Matriks / Tabel",
            question: "Perhatikan susunan bilangan pada tabel berikut:\nBaris 1 :  4    6   ->  30\nBaris 2 :  5    7   ->  36\nBaris 3 :  6    8   ->  ?\n\nJika pola hubungan bilangan pada setiap baris adalah sama, nilai pengganti tanda tanya (?) adalah...",
            options: { "A": "38", "B": "40", "C": "42", "D": "44", "E": "48" },
            correctAnswer: "C",
            explanation: "Hasil = (Kolom 1 + Kolom 2) x 3. Baris 3: (6 + 8) x 3 = 14 x 3 = 42."
          },
          {
            id: 13,
            category: "Pola Hubungan Kompleks",
            question: "KERTAS SUARA : PILKADA : BUPATI = ... : ... : ...",
            options: {
              "A": "Formulir : Sidang : Hakim",
              "B": "Tiket : Bioskop : Film",
              "C": "Surat Suara : Pilpres : Presiden",
              "D": "Rapor : Sekolah : Guru",
              "E": "Kwitansi : Toko : Kasir"
            },
            correctAnswer: "C",
            explanation: "Kertas suara di Pilkada untuk memilih Bupati; Surat suara di Pilpres untuk memilih Presiden."
          },
          {
            id: 14,
            category: "Pola Bangun Segiempat",
            question: "Diberikan bangun segiempat dengan 4 angka di setiap sudutnya (A=kiri atas, B=kanan atas, C=kiri bawah, D=kanan bawah) dan angka di tengahnya:\n• Bangun 1: Sudut (7, 6, 5, 2) -> Tengah = 32\n• Bangun 2: Sudut (8, 7, 6, 3) -> Tengah = 38\n• Bangun 3: Sudut (9, 8, 7, 4) -> Tengah = ?\n\nBerdasarkan pola tersebut, nilai tengah pada Bangun 3 adalah...",
            options: { "A": "40", "B": "42", "C": "44", "D": "46", "E": "48" },
            correctAnswer: "C",
            explanation: "Tengah = (A x B) - (C x D). Bangun 3: (9 x 8) - (7 x 4) = 72 - 28 = 44."
          },
          {
            id: 15,
            category: "Pola Alfanumerik",
            question: "Perhatikan pola kombinasi angka dan huruf berikut:\n3B,  6D,  11G,  18K,  ...\n\nPasangan angka dan huruf berikutnya yang tepat adalah...",
            options: { "A": "25O", "B": "26O", "C": "27P", "D": "27Q", "E": "28P" },
            correctAnswer: "C",
            explanation: "Angka: 18 + 9 = 27. Huruf: K (11) + 5 = P (16). Hasil = 27P."
          },
          {
            id: 16,
            category: "Pola Deret Majemuk",
            question: "Perhatikan barisan bilangan berikut:\n4,  6,  12,  14,  28,  30,  60,  ...\n\nBilangan yang tepat untuk melanjutkan deret tersebut adalah...",
            options: { "A": "62", "B": "64", "C": "120", "D": "122", "E": "124" },
            correctAnswer: "A",
            explanation: "Pola operasi bergantian (+2, x2): 60 + 2 = 62."
          },
          {
            id: 17,
            category: "Pola Diagram Relasi",
            question: "Diberikan tiga diagram lingkaran dengan pola bilangan terpusat:\n• Diagram 1: Angka Luar (18, 12, 3) -> Pusat = 10\n• Diagram 2: Angka Luar (30, 20, 5) -> Pusat = 10\n• Diagram 3: Angka Luar (42, 28, 7) -> Pusat = ?\n\nJika aturan operasi bilangan pada ketiga diagram adalah sama, nilai pusat pada Diagram 3 adalah...",
            options: { "A": "8", "B": "9", "C": "10", "D": "11", "E": "12" },
            correctAnswer: "C",
            explanation: "Pusat = (Angka 1 + Angka 2) / Angka 3. Diagram 3: (42 + 28) / 7 = 70 / 7 = 10."
          },
          {
            id: 18,
            category: "Pola Sebab-Akibat Ganda",
            question: "BATERAI LEMAH : GADGET MATI : CHARGER = ... : ... : ...",
            options: {
              "A": "Bahan Bakar Habis : Mobil Mogok : SPBU",
              "B": "Lapar : Makan : Piring",
              "C": "Mengantuk : Tidur : Kasur",
              "D": "Hujan : Basah : Jas Hujan",
              "E": "Lampu Mati : Gelap : Lilin"
            },
            correctAnswer: "A",
            explanation: "Baterai lemah membuat gadget mati dan diisi ulang dengan charger; Bahan bakar habis membuat mobil mogok dan diisi ulang di SPBU."
          },
          {
            id: 19,
            category: "Pola Huruf Dua Arah",
            question: "Diberikan deret huruf berikut:\nB,  Y,  D,  W,  G,  T,  K,  ...\n\nHuruf yang paling tepat untuk mengisi posisi berikutnya adalah...",
            options: { "A": "N", "B": "O", "C": "P", "D": "Q", "E": "R" },
            correctAnswer: "C",
            explanation: "Larik genap mundur: Y (25) -2 -> W (23) -3 -> T (20) -4 -> P (16)."
          },
          {
            id: 20,
            category: "Pola Operasi Silang Analitis",
            question: "Diberikan dua diagram susunan bilangan dengan pola operasi identik:\n• Diagram A: Empat bilangan di sudutnya adalah 6, 5, 4, dan 3 dengan angka pusat bernilai 42 (didapat dari perkalian silang: [6 x 5] + [4 x 3] = 30 + 12 = 42).\n\nJika pada Diagram B memiliki angka sudut 9, 7, 5, dan 6 dengan aturan pola yang sama, maka angka di pusat Diagram B adalah...",
            options: { "A": "83", "B": "88", "C": "91", "D": "93", "E": "97" },
            correctAnswer: "D",
            explanation: "Pusat = (Sudut 1 x Sudut 2) + (Sudut 3 x Sudut 4) = (9 x 7) + (5 x 6) = 63 + 30 = 93."
          }
        ]
      }
    ]
  };
  loadExamData(fallback);
}
