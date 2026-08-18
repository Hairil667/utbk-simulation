/**
 * SIMULASI TES HAIRIL - CBT APPLICATION ENGINE
 * 1:1 CAT UI + Fullscreen Mode + Floating Calculator + Mobile Ergonomics
 */

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
   🧮 CALCULATOR MODULE
   ========================================================================== */
const Calculator = {
  displayEl: null,
  historyEl: null,
  currentVal: '0',
  prevVal: '',
  operation: null,
  resetNext: false,

  init() {
    this.displayEl = document.getElementById('calc-display');
    this.historyEl = document.getElementById('calc-history');

    DOM.btnToggleCalculator.addEventListener('click', () => this.toggle());
    DOM.btnCloseCalc.addEventListener('click', () => this.close());
    
    // Dragging support on Desktop
    this.initDrag();
  },

  toggle() {
    const isOpen = DOM.calcWidget.classList.toggle('active');
    DOM.btnToggleCalculator.classList.toggle('btn-calc-active', isOpen);
  },

  close() {
    DOM.calcWidget.classList.remove('active');
    DOM.btnToggleCalculator.classList.remove('btn-calc-active');
  },

  updateDisplay() {
    this.displayEl.textContent = this.currentVal;
    this.historyEl.textContent = this.operation && this.prevVal ? `${this.prevVal} ${this.operation}` : '';
  },

  inputDigit(d) {
    if (this.currentVal === '0' || this.resetNext) {
      this.currentVal = d;
      this.resetNext = false;
    } else {
      if (this.currentVal.length < 14) {
        this.currentVal += d;
      }
    }
    this.updateDisplay();
  },

  inputDot() {
    if (this.resetNext) {
      this.currentVal = '0.';
      this.resetNext = false;
    } else if (!this.currentVal.includes('.')) {
      this.currentVal += '.';
    }
    this.updateDisplay();
  },

  toggleSign() {
    if (this.currentVal !== '0') {
      if (this.currentVal.startsWith('-')) {
        this.currentVal = this.currentVal.substring(1);
      } else {
        this.currentVal = '-' + this.currentVal;
      }
      this.updateDisplay();
    }
  },

  inputOp(op) {
    if (this.operation && !this.resetNext) {
      this.calculate();
    }
    this.prevVal = this.currentVal;
    this.operation = op;
    this.resetNext = true;
    this.updateDisplay();
  },

  calculate() {
    if (!this.operation || !this.prevVal) return;
    const a = parseFloat(this.prevVal);
    const b = parseFloat(this.currentVal);
    let result = 0;

    switch (this.operation) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': 
        if (b === 0) {
          this.currentVal = 'Error';
          this.resetNext = true;
          this.operation = null;
          this.updateDisplay();
          return;
        }
        result = a / b;
        break;
      case '%': result = (a * b) / 100; break;
    }

    result = Math.round(result * 100000000) / 100000000;
    this.currentVal = String(result);
    this.prevVal = '';
    this.operation = null;
    this.resetNext = true;
    this.updateDisplay();
  },

  sqrt() {
    const val = parseFloat(this.currentVal);
    if (val < 0) {
      this.currentVal = 'Error';
    } else {
      this.currentVal = String(Math.round(Math.sqrt(val) * 100000000) / 100000000);
    }
    this.resetNext = true;
    this.updateDisplay();
  },

  clearAll() {
    this.currentVal = '0';
    this.prevVal = '';
    this.operation = null;
    this.resetNext = false;
    this.updateDisplay();
  },

  backspace() {
    if (this.currentVal.length > 1) {
      this.currentVal = this.currentVal.slice(0, -1);
    } else {
      this.currentVal = '0';
    }
    this.updateDisplay();
  },

  initDrag() {
    const header = document.getElementById('calc-header');
    const widget = DOM.calcWidget;
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      if (window.innerWidth <= 900) return;
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
    DOM.resultFeedbackText.textContent = `🌟 Luar biasa! Penguasaan materi operasi bilangan Anda sangat matang (Skor: ${scaledScore}/1000).`;
  } else if (scaledScore >= 500) {
    DOM.resultFeedbackText.textContent = `👍 Kerja bagus! Terus asah kecepatan perhitungan dan ketelitian pecahan/desimal (Skor: ${scaledScore}/1000).`;
  } else {
    DOM.resultFeedbackText.textContent = `💪 Tetap semangat! Pelajari kembali pembahasan di bawah untuk memahami konsep dasar yang masih keliru.`;
  }

  renderReviewList();
  showScreen('result');
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
    if (isCorrect) item.classList.add('is-correct');
    else if (isWrong) item.classList.add('is-wrong');
    else item.classList.add('is-empty');

    const statusBadge = isCorrect 
      ? '<span style="color:#2e7d32; font-weight:800;">✓ BENAR</span>'
      : (isEmpty ? '<span style="color:#d97706; font-weight:800;">⚪ DIKOSONGKAN</span>' : '<span style="color:#d32f2f; font-weight:800;">✕ SALAH</span>');

    const categoryText = q.category ? `<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:3px; font-size:0.75rem; margin-right:6px;">${q.category}</span>` : '';

    let optionsHtml = '';
    if (q.options) {
      Object.keys(q.options).sort().forEach(k => {
        let optStyle = "padding: 6px 10px; margin-bottom: 4px; border-radius: 4px; font-size: 0.88rem; background: #f8fafc;";
        if (k === q.correctAnswer) {
          optStyle = "padding: 6px 10px; margin-bottom: 4px; border-radius: 4px; font-size: 0.88rem; background: #dcfce7; color: #166534; font-weight: 700; border: 1px solid #86efac;";
        } else if (k === userAns && !isCorrect) {
          optStyle = "padding: 6px 10px; margin-bottom: 4px; border-radius: 4px; font-size: 0.88rem; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;";
        }
        optionsHtml += `<div style="${optStyle}"><strong>${k}.</strong> ${q.options[k]}</div>`;
      });
    }

    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
        <div>
          ${categoryText}
          <strong style="color:var(--bppp-navy);">Soal Nomor ${idx + 1}</strong>
        </div>
        <div>${statusBadge}</div>
      </div>
      <p style="white-space:pre-line; margin-bottom:10px; font-weight:500;">${q.question}</p>
      <div style="margin-bottom:10px;">${optionsHtml}</div>
      <div class="cat-pembahasan-box">
        <strong style="color:#15375c; display:block; margin-bottom:4px;">💡 Kunci & Pembahasan:</strong>
        <p style="white-space:pre-line;">${q.explanation || 'Pembahasan belum tersedia untuk butir soal ini.'}</p>
      </div>
    `;

    DOM.reviewListContainer.appendChild(item);
  });
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
      subtitle: "Operasi Bilangan: Bilangan Bulat, Pecahan, Persen, Desimal",
      year: "2025 / 2026",
      defaultTimeMinutes: 25
    },
    subtests: [
      {
        id: "pk-lengkap",
        name: "Operasi Bilangan Lengkap (Part 1)",
        timeMinutes: 25,
        questions: [
          {
            id: 1,
            category: "Bilangan Bulat",
            question: "Hasil dari (-20) ÷ 5 adalah...",
            options: { "A": "4", "B": "-4", "C": "-15", "D": "15", "E": "-100" },
            correctAnswer: "B",
            explanation: "(-20) ÷ 5 = -4."
          },
          {
            id: 2,
            category: "Pecahan",
            question: "Hasil dari 3/8 + 2/8 adalah...",
            options: { "A": "5/16", "B": "5/8", "C": "6/8", "D": "1/8", "E": "5/4" },
            correctAnswer: "B",
            explanation: "3/8 + 2/8 = 5/8."
          },
          {
            id: 3,
            category: "Persen",
            question: "Berapakah 30% dari 200?",
            options: { "A": "30", "B": "50", "C": "60", "D": "70", "E": "90" },
            correctAnswer: "C",
            explanation: "30% × 200 = 0,30 × 200 = 60."
          },
          {
            id: 4,
            category: "Desimal",
            question: "Hasil dari 6,4 ÷ 0,2 adalah...",
            options: { "A": "3,2", "B": "32", "C": "0,32", "D": "320", "E": "12,8" },
            correctAnswer: "B",
            explanation: "6,4 ÷ 0,2 = 64 ÷ 2 = 32."
          }
        ]
      }
    ]
  };
  loadExamData(fallback);
}
