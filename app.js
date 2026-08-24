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
  DOM.masteryBarsContainer = document.getElementById('mastery-bars-container');
  DOM.masteryDiagnosisBox = document.getElementById('mastery-diagnosis-box');
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
    DOM.examHeaderSubtest.textContent = 'Penalaran Umum (Paket Lengkap)';
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

  // Populate Subtest Mastery Chart & Mistake Breakdown
  populateSubtestMasteryChart();
  populateMistakeAnalysis();

  renderReviewList();
  showScreen('result');
}

function populateSubtestMasteryChart() {
  if (!DOM.masteryBarsContainer || !DOM.masteryDiagnosisBox) return;

  DOM.masteryBarsContainer.innerHTML = '';
  DOM.masteryDiagnosisBox.innerHTML = '';

  const categories = {};

  State.activeQuestions.forEach((q, idx) => {
    const catName = q.category || q.subtestName || 'Penalaran Umum';
    if (!categories[catName]) {
      categories[catName] = {
        total: 0,
        correct: 0,
        wrong: 0,
        empty: 0
      };
    }
    categories[catName].total++;

    const userAns = State.userAnswers[idx];
    if (userAns === undefined || userAns === null) {
      categories[catName].empty++;
    } else if (userAns === q.correctAnswer) {
      categories[catName].correct++;
    } else {
      categories[catName].wrong++;
    }
  });

  const catKeys = Object.keys(categories);
  if (catKeys.length === 0) return;

  let highestCat = null;
  let lowestCat = null;
  let highestPct = -1;
  let lowestPct = 101;

  catKeys.forEach(catName => {
    const data = categories[catName];
    const pct = Math.round((data.correct / data.total) * 100);

    if (pct > highestPct) {
      highestPct = pct;
      highestCat = catName;
    }
    if (pct < lowestPct) {
      lowestPct = pct;
      lowestCat = catName;
    }

    let levelClass = 'med';
    let badgeText = '👍 Cukup Paham';
    if (pct >= 80) {
      levelClass = 'high';
      badgeText = '🌟 Sangat Paham';
    } else if (pct < 50) {
      levelClass = 'low';
      badgeText = '⚠️ Perlu Pendalaman';
    }

    const row = document.createElement('div');
    row.className = 'mastery-bar-row';
    row.innerHTML = `
      <div class="mastery-bar-header">
        <div>
          <span>${catName}</span>
          <span style="font-size: 0.78rem; font-weight: 500; color: #64748b; margin-left: 6px;">(${data.correct}/${data.total} Benar)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="mastery-badge ${levelClass}">${badgeText}</span>
          <span style="font-size: 0.95rem; font-weight: 800; color: #0f172a; min-width: 40px; text-align: right;">${pct}%</span>
        </div>
      </div>
      <div class="mastery-bar-track">
        <div class="mastery-bar-fill ${levelClass}" style="width: 0%;"></div>
      </div>
    `;

    DOM.masteryBarsContainer.appendChild(row);

    setTimeout(() => {
      const fillEl = row.querySelector('.mastery-bar-fill');
      if (fillEl) {
        fillEl.style.width = `${pct}%`;
      }
    }, 150);
  });

  // Populate Diagnosis Banner
  const strongCard = document.createElement('div');
  strongCard.className = 'diagnosis-card strong';
  strongCard.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; margin-bottom: 4px; font-size: 0.88rem;">
      <span>🏆 Subtes Paling Dikuasai:</span>
    </div>
    <div style="font-size: 0.92rem; font-weight: 700; color: #166534; margin-bottom: 2px;">
      ${highestCat} (${highestPct}%)
    </div>
    <div style="font-size: 0.78rem; color: #15803d;">
      Pertahankan akurasi dan kecepatan Anda pada tipe soal ini!
    </div>
  `;

  const weakCard = document.createElement('div');
  weakCard.className = 'diagnosis-card weak';
  weakCard.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; margin-bottom: 4px; font-size: 0.88rem;">
      <span>⚠️ Subtes Perlu Peningkatan:</span>
    </div>
    <div style="font-size: 0.92rem; font-weight: 700; color: #991b1b; margin-bottom: 2px;">
      ${lowestCat} (${lowestPct}%)
    </div>
    <div style="font-size: 0.78rem; color: #b91c1c;">
      Fokuskan latihan mandiri dan tinjau kembali konsep pembahasan pada subtes ini.
    </div>
  `;

  DOM.masteryDiagnosisBox.appendChild(strongCard);
  DOM.masteryDiagnosisBox.appendChild(weakCard);
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

  // Calculate mastery per subtest / category for report
  const catReport = {};
  State.activeQuestions.forEach((q, idx) => {
    const cName = q.category || q.subtestName || 'Penalaran Umum';
    if (!catReport[cName]) catReport[cName] = { total: 0, correct: 0 };
    catReport[cName].total++;
    if (State.userAnswers[idx] === q.correctAnswer) {
      catReport[cName].correct++;
    }
  });

  text += `================================================================================\n`;
  text += `📊 ANALISIS TINGKAT PENGUASAAN SUBTES (DIAGNOSTIK):\n`;
  text += `================================================================================\n`;
  Object.keys(catReport).forEach(cName => {
    const cData = catReport[cName];
    const cPct = Math.round((cData.correct / cData.total) * 100);
    const statusLabel = cPct >= 80 ? 'SANGAT PAHAM ★★★' : (cPct >= 50 ? 'CUKUP PAHAM ★★' : 'PERLU PENDALAMAN ⚠️');
    text += `• ${cName.padEnd(25)} : ${cPct}% (${cData.correct}/${cData.total} Benar) [${statusLabel}]\n`;
  });
  text += `\n`;

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
  fetch('questions.json')
    .then(r => r.json())
    .then(d => loadExamData(d))
    .catch(() => {
      console.log('Using embedded default 40 questions');
    });
}
