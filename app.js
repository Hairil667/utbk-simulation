/**
 * SIMULASI UTBK - SNBT ENGINE (Sistem CAT)
 * Core Logic: Timer, State Management, Question Navigation, Scoring & Review
 */

// Global State
const State = {
  examData: null,
  activeQuestions: [],
  currentIndex: 0,
  userAnswers: {}, // { [index]: { selected: 'A'|'B'|..., doubt: boolean } }
  timerInterval: null,
  totalSeconds: 0,
  remainingSeconds: 0,
  timeSpentSeconds: 0,
  fontSize: 'md', // 'sm' | 'md' | 'lg'
  examActive: false,
  userProfile: {
    name: 'PESERTA UTBK 2025',
    id: '25-3401-0891'
  }
};

// DOM Elements Cache
const DOM = {
  // Screens
  startScreen: document.getElementById('start-screen'),
  examScreen: document.getElementById('exam-screen'),
  resultScreen: document.getElementById('result-screen'),
  
  // Start Screen Elements
  startTitle: document.getElementById('start-title'),
  startSubtitle: document.getElementById('start-subtitle'),
  inputUserName: document.getElementById('input-user-name'),
  inputUserId: document.getElementById('input-user-id'),
  selectSubtest: document.getElementById('select-subtest'),
  subtestCountInfo: document.getElementById('subtest-count-info'),
  inputCustomTime: document.getElementById('input-custom-time'),
  btnResetTime: document.getElementById('btn-reset-time'),
  fileJsonInput: document.getElementById('file-json-input'),
  loadedFileStatus: document.getElementById('loaded-file-status'),
  btnStartExam: document.getElementById('btn-start-exam'),

  // Exam Screen Elements
  examHeaderTitle: document.getElementById('exam-header-title'),
  examHeaderSubtest: document.getElementById('exam-header-subtest'),
  timerBox: document.getElementById('timer-box'),
  timerDisplay: document.getElementById('timer-display'),
  displayUserName: document.getElementById('display-user-name'),
  displayUserId: document.getElementById('display-user-id'),
  displaySubtestBadge: document.getElementById('display-subtest-badge'),

  // Workspace
  currentQBadge: document.getElementById('current-q-badge'),
  currentQSubtest: document.getElementById('current-q-subtest'),
  workspaceContainer: document.getElementById('workspace-container'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  btnFinishTrigger: document.getElementById('btn-finish-trigger'),
  checkboxRagu: document.getElementById('checkbox-ragu'),
  labelRagu: document.getElementById('label-ragu'),

  // Font Size
  btnFontSm: document.getElementById('btn-font-sm'),
  btnFontMd: document.getElementById('btn-font-md'),
  btnFontLg: document.getElementById('btn-font-lg'),

  // Sidebar
  catSidebar: document.getElementById('cat-sidebar'),
  questionGrid: document.getElementById('question-grid'),
  btnCloseSidebar: document.getElementById('btn-close-sidebar'),
  btnMobileSidebarToggle: document.getElementById('btn-mobile-sidebar-toggle'),
  mobileAnsweredCount: document.getElementById('mobile-answered-count'),
  mobileTotalCount: document.getElementById('mobile-total-count'),

  // Modal
  confirmModal: document.getElementById('confirm-modal'),
  modalTotalQ: document.getElementById('modal-total-q'),
  modalAnsweredQ: document.getElementById('modal-answered-q'),
  modalDoubtQ: document.getElementById('modal-doubt-q'),
  modalUnansweredQ: document.getElementById('modal-unanswered-q'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalConfirm: document.getElementById('btn-modal-confirm'),

  // Result Screen Elements
  resultUserMeta: document.getElementById('result-user-meta'),
  resultScoreVal: document.getElementById('result-score-val'),
  resultFeedbackText: document.getElementById('result-feedback-text'),
  statCorrectCount: document.getElementById('stat-correct-count'),
  statWrongCount: document.getElementById('stat-wrong-count'),
  statEmptyCount: document.getElementById('stat-empty-count'),
  statTimeSpent: document.getElementById('stat-time-spent'),
  reviewListContainer: document.getElementById('review-list-container'),
  btnRetryTest: document.getElementById('btn-retry-test'),
  btnBackHome: document.getElementById('btn-back-home')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

/**
 * Fetch default questions and setup initial UI
 */
async function initApp() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) throw new Error('Gagal memuat bank soal bawaan');
    const data = await response.json();
    loadExamData(data);
  } catch (error) {
    console.warn('Gagal fetch otomatis questions.json, gunakan fallback data lokal:', error);
    // Fallback data jika dibuka secara local file:/// tanpa web server
    loadFallbackData();
  }
}

/**
 * Load and parse exam data object
 */
function loadExamData(data) {
  State.examData = data;
  
  if (data.testInfo) {
    DOM.startTitle.textContent = data.testInfo.title || 'SIMULASI UTBK - SNBT';
    DOM.startSubtitle.textContent = `${data.testInfo.subtitle || 'BPPP'} • Tahun ${data.testInfo.year || '2025'}`;
    if (data.testInfo.defaultTimeMinutes) {
      DOM.inputCustomTime.value = data.testInfo.defaultTimeMinutes;
    }
  }

  // Populate subtest options in dropdown
  DOM.selectSubtest.innerHTML = '';
  
  // Option: Semua Subtes (Paket Lengkap)
  let totalAllQuestions = 0;
  let totalAllTime = 0;

  if (Array.isArray(data.subtests)) {
    data.subtests.forEach(sub => {
      totalAllQuestions += (sub.questions || []).length;
      totalAllTime += (sub.timeMinutes || 15);
    });

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = `Semua Subtes (Total ${totalAllQuestions} Soal)`;
    DOM.selectSubtest.appendChild(allOption);

    data.subtests.forEach((sub, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      opt.textContent = `${sub.name} (${(sub.questions || []).length} Soal - ${sub.timeMinutes || 15} Menit)`;
      DOM.selectSubtest.appendChild(opt);
    });
  } else if (Array.isArray(data.questions)) {
    // Support flat questions structure
    totalAllQuestions = data.questions.length;
    const opt = document.createElement('option');
    opt.value = 'flat';
    opt.textContent = `Paket Soal (${totalAllQuestions} Soal)`;
    DOM.selectSubtest.appendChild(opt);
  }

  updateSubtestCountInfo();
}

/**
 * Update time and question count when subtest selection changes
 */
function updateSubtestCountInfo() {
  if (!State.examData) return;

  const val = DOM.selectSubtest.value;
  if (val === 'all') {
    let qCount = 0;
    let recTime = State.examData.testInfo?.defaultTimeMinutes || 0;
    
    if (State.examData.subtests) {
      State.examData.subtests.forEach(s => {
        qCount += (s.questions || []).length;
        if (!State.examData.testInfo?.defaultTimeMinutes) {
          recTime += (s.timeMinutes || 15);
        }
      });
    }
    DOM.subtestCountInfo.textContent = `Total: ${qCount} Soal. Durasi standar: ${recTime || 20} menit.`;
    DOM.inputCustomTime.value = recTime || 20;
  } else if (val === 'flat') {
    const qCount = State.examData.questions?.length || 0;
    DOM.subtestCountInfo.textContent = `Total: ${qCount} Soal.`;
  } else {
    const subIdx = parseInt(val, 10);
    const sub = State.examData.subtests[subIdx];
    if (sub) {
      const count = (sub.questions || []).length;
      DOM.subtestCountInfo.textContent = `Subtes "${sub.name}": ${count} Soal. Durasi standar: ${sub.timeMinutes || 15} menit.`;
      DOM.inputCustomTime.value = sub.timeMinutes || 15;
    }
  }
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Subtest selection change
  DOM.selectSubtest.addEventListener('change', updateSubtestCountInfo);

  // Reset time button
  DOM.btnResetTime.addEventListener('click', updateSubtestCountInfo);

  // File Upload (Custom JSON)
  DOM.fileJsonInput.addEventListener('change', handleFileUpload);

  // Drag & drop support
  const dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--utbk-blue)';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#94a3b8';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#94a3b8';
    if (e.dataTransfer.files.length > 0) {
      processJSONFile(e.dataTransfer.files[0]);
    }
  });

  // Start Exam Button
  DOM.btnStartExam.addEventListener('click', startExam);

  // Navigation Buttons
  DOM.btnPrev.addEventListener('click', () => {
    if (State.currentIndex > 0) {
      jumpToQuestion(State.currentIndex - 1);
    }
  });

  DOM.btnNext.addEventListener('click', () => {
    if (State.currentIndex < State.activeQuestions.length - 1) {
      jumpToQuestion(State.currentIndex + 1);
    }
  });

  // Ragu-ragu checkbox & container
  DOM.checkboxRagu.addEventListener('change', (e) => {
    toggleDoubt(e.target.checked);
  });

  // Finish Trigger
  DOM.btnFinishTrigger.addEventListener('click', showFinishModal);

  // Modal Buttons
  DOM.btnModalCancel.addEventListener('click', hideFinishModal);
  DOM.btnModalConfirm.addEventListener('click', () => {
    hideFinishModal();
    finishExam(false);
  });

  // Font Size Resizer
  DOM.btnFontSm.addEventListener('click', () => setFontSize('sm'));
  DOM.btnFontMd.addEventListener('click', () => setFontSize('md'));
  DOM.btnFontLg.addEventListener('click', () => setFontSize('lg'));

  // Mobile Sidebar Drawer
  DOM.btnMobileSidebarToggle.addEventListener('click', () => {
    DOM.catSidebar.classList.add('mobile-open');
  });
  DOM.btnCloseSidebar.addEventListener('click', () => {
    DOM.catSidebar.classList.remove('mobile-open');
  });

  // Result Screen Actions
  DOM.btnRetryTest.addEventListener('click', () => {
    startExam();
  });
  DOM.btnBackHome.addEventListener('click', () => {
    showScreen('start');
  });

  // Review Filter Buttons
  document.querySelectorAll('.review-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.review-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderReview(e.target.dataset.filter);
    });
  });

  // Keyboard Shortcuts (Arrow Left/Right, 1-5 for A-E)
  window.addEventListener('keydown', (e) => {
    if (!State.examActive) return;
    
    // Ignore when typing inside input
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'ArrowLeft' && State.currentIndex > 0) {
      jumpToQuestion(State.currentIndex - 1);
    } else if (e.key === 'ArrowRight' && State.currentIndex < State.activeQuestions.length - 1) {
      jumpToQuestion(State.currentIndex + 1);
    } else if (['a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E'].includes(e.key)) {
      selectOption(e.key.toUpperCase());
    } else if (e.key.toLowerCase() === 'r') {
      const curState = State.userAnswers[State.currentIndex]?.doubt || false;
      toggleDoubt(!curState);
    }
  });
}

/**
 * Handle custom JSON file upload
 */
function handleFileUpload(e) {
  if (e.target.files && e.target.files[0]) {
    processJSONFile(e.target.files[0]);
  }
}

function processJSONFile(file) {
  if (!file.name.endsWith('.json')) {
    alert('Harap pilih file dengan ekstensi .json');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!parsed.subtests && !parsed.questions) {
        throw new Error('Format JSON tidak sesuai: harus memiliki array "subtests" atau "questions"');
      }
      loadExamData(parsed);
      DOM.loadedFileStatus.style.display = 'block';
      DOM.loadedFileStatus.textContent = `✓ Berhasil memuat: ${file.name}`;
    } catch (err) {
      alert('Gagal membaca file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/**
 * Start Exam Engine
 */
function startExam() {
  if (!State.examData) {
    alert('Bank soal belum siap. Silakan tunggu atau unggah JSON soal.');
    return;
  }

  // 1. Get User Profile
  State.userProfile.name = DOM.inputUserName.value.trim() || 'PESERTA UTBK 2025';
  State.userProfile.id = DOM.inputUserId.value.trim() || '25-3401-0891';

  DOM.displayUserName.textContent = State.userProfile.name;
  DOM.displayUserId.textContent = State.userProfile.id;

  // 2. Prepare Active Questions list
  const chosenSubtest = DOM.selectSubtest.value;
  State.activeQuestions = [];

  if (chosenSubtest === 'all') {
    if (State.examData.subtests) {
      State.examData.subtests.forEach(sub => {
        (sub.questions || []).forEach(q => {
          State.activeQuestions.push({
            ...q,
            subtestName: sub.name
          });
        });
      });
    } else if (State.examData.questions) {
      State.activeQuestions = [...State.examData.questions];
    }
    DOM.displaySubtestBadge.textContent = 'Semua Subtes';
  } else if (chosenSubtest === 'flat') {
    State.activeQuestions = [...(State.examData.questions || [])];
    DOM.displaySubtestBadge.textContent = 'Simulasi Soal';
  } else {
    const subIdx = parseInt(chosenSubtest, 10);
    const sub = State.examData.subtests[subIdx];
    if (sub) {
      State.activeQuestions = (sub.questions || []).map(q => ({
        ...q,
        subtestName: sub.name
      }));
      DOM.displaySubtestBadge.textContent = sub.name;
    }
  }

  if (State.activeQuestions.length === 0) {
    alert('Tidak ada soal pada kategori yang dipilih.');
    return;
  }

  // 3. Reset Answers & Status
  State.userAnswers = {};
  for (let i = 0; i < State.activeQuestions.length; i++) {
    State.userAnswers[i] = {
      selected: null,
      doubt: false
    };
  }

  // 4. Time Setup
  let customMinutes = parseInt(DOM.inputCustomTime.value, 10);
  if (isNaN(customMinutes) || customMinutes < 1) customMinutes = 20;
  
  State.totalSeconds = customMinutes * 60;
  State.remainingSeconds = State.totalSeconds;
  State.timeSpentSeconds = 0;

  // 5. Switch to Exam Screen
  State.currentIndex = 0;
  State.examActive = true;
  showScreen('exam');

  // 6. Render UI
  renderQuestion(0);
  renderQuestionGrid();
  updateSidebarCounters();

  // 7. Start Countdown Timer
  startTimer();
}

/**
 * Start & Manage Countdown Timer
 */
function startTimer() {
  if (State.timerInterval) clearInterval(State.timerInterval);

  updateTimerDisplay();

  State.timerInterval = setInterval(() => {
    State.remainingSeconds--;
    State.timeSpentSeconds++;

    updateTimerDisplay();

    // Warning state when under 3 minutes (180s)
    if (State.remainingSeconds <= 180) {
      DOM.timerBox.classList.add('timer-warning');
    } else {
      DOM.timerBox.classList.remove('timer-warning');
    }

    // Time's up!
    if (State.remainingSeconds <= 0) {
      clearInterval(State.timerInterval);
      State.remainingSeconds = 0;
      updateTimerDisplay();
      alert('⏰ WAKTU UJIAN TELAH HABIS!\nJawaban Anda akan otomatis dikumpulkan dan dinilai.');
      finishExam(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const h = Math.floor(State.remainingSeconds / 3600);
  const m = Math.floor((State.remainingSeconds % 3600) / 60);
  const s = State.remainingSeconds % 60;

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  DOM.timerDisplay.textContent = `${hh}:${mm}:${ss}`;
}

/**
 * Render Question at specific index
 */
function renderQuestion(index) {
  State.currentIndex = index;
  const qData = State.activeQuestions[index];
  if (!qData) return;

  // Header badges
  DOM.currentQBadge.textContent = `SOAL NO. ${index + 1}`;
  DOM.currentQSubtest.textContent = qData.subtestName || State.examData.testInfo?.title || 'UTBK';
  DOM.examHeaderSubtest.textContent = qData.subtestName || 'Simulasi CBT';

  // Question Text
  DOM.questionText.textContent = qData.question || 'Pertanyaan tidak tersedia.';

  // Render Options A, B, C, D, E
  DOM.optionsContainer.innerHTML = '';
  const currentAnswer = State.userAnswers[index]?.selected;

  if (qData.options) {
    const keys = Object.keys(qData.options);
    keys.forEach(key => {
      const optionVal = qData.options[key];
      const isSelected = currentAnswer === key;

      const optEl = document.createElement('div');
      optEl.className = `option-item ${isSelected ? 'selected' : ''}`;
      optEl.dataset.key = key;

      optEl.innerHTML = `
        <div class="option-radio">${key}</div>
        <div class="option-text">${escapeHtml(optionVal)}</div>
      `;

      optEl.addEventListener('click', () => {
        selectOption(key);
      });

      DOM.optionsContainer.appendChild(optEl);
    });
  }

  // Ragu-ragu state
  const isDoubt = State.userAnswers[index]?.doubt || false;
  DOM.checkboxRagu.checked = isDoubt;
  if (isDoubt) {
    DOM.labelRagu.classList.add('active');
  } else {
    DOM.labelRagu.classList.remove('active');
  }

  // Navigation buttons state
  DOM.btnPrev.disabled = (index === 0);

  const isLast = (index === State.activeQuestions.length - 1);
  if (isLast) {
    DOM.btnNext.style.display = 'none';
    DOM.btnFinishTrigger.style.display = 'inline-flex';
  } else {
    DOM.btnNext.style.display = 'inline-flex';
    DOM.btnFinishTrigger.style.display = 'none';
  }

  // Scroll content to top
  document.getElementById('workspace-content').scrollTop = 0;

  // Update active item in sidebar
  updateActiveGridButton(index);
}

/**
 * Select multiple choice option
 */
function selectOption(key) {
  if (!State.userAnswers[State.currentIndex]) {
    State.userAnswers[State.currentIndex] = { selected: null, doubt: false };
  }

  State.userAnswers[State.currentIndex].selected = key;

  // Highlight option visually
  document.querySelectorAll('.option-item').forEach(el => {
    if (el.dataset.key === key) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });

  // Update grid button
  updateSingleGridButton(State.currentIndex);
  updateSidebarCounters();
}

/**
 * Toggle Ragu-ragu (Doubt) status
 */
function toggleDoubt(checked) {
  if (!State.userAnswers[State.currentIndex]) {
    State.userAnswers[State.currentIndex] = { selected: null, doubt: false };
  }

  State.userAnswers[State.currentIndex].doubt = checked;
  DOM.checkboxRagu.checked = checked;

  if (checked) {
    DOM.labelRagu.classList.add('active');
  } else {
    DOM.labelRagu.classList.remove('active');
  }

  updateSingleGridButton(State.currentIndex);
  updateSidebarCounters();
}

/**
 * Jump to specific question
 */
function jumpToQuestion(index) {
  if (index < 0 || index >= State.activeQuestions.length) return;
  renderQuestion(index);
  // Auto close mobile drawer if open
  DOM.catSidebar.classList.remove('mobile-open');
}

/**
 * Render Right Sidebar Question Grid
 */
function renderQuestionGrid() {
  DOM.questionGrid.innerHTML = '';

  State.activeQuestions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'grid-btn';
    btn.dataset.index = idx;
    btn.id = `grid-btn-${idx}`;

    btn.addEventListener('click', () => {
      jumpToQuestion(idx);
    });

    DOM.questionGrid.appendChild(btn);
    updateSingleGridButton(idx);
  });

  updateActiveGridButton(State.currentIndex);
}

/**
 * Update single grid button state
 */
function updateSingleGridButton(index) {
  const btn = document.getElementById(`grid-btn-${index}`);
  if (!btn) return;

  const ans = State.userAnswers[index];
  const isAnswered = Boolean(ans && ans.selected);
  const isDoubt = Boolean(ans && ans.doubt);

  btn.className = 'grid-btn';
  btn.innerHTML = `${index + 1}`;

  if (isDoubt) {
    btn.classList.add('doubt');
  }
  if (isAnswered) {
    btn.classList.add('answered');
    const tag = document.createElement('span');
    tag.className = 'selected-tag';
    tag.textContent = ans.selected;
    btn.appendChild(tag);
  }

  if (index === State.currentIndex) {
    btn.classList.add('current');
  }
}

function updateActiveGridButton(index) {
  document.querySelectorAll('.grid-btn').forEach(btn => {
    btn.classList.remove('current');
  });
  const currentBtn = document.getElementById(`grid-btn-${index}`);
  if (currentBtn) currentBtn.classList.add('current');
}

function updateSidebarCounters() {
  let answered = 0;
  const total = State.activeQuestions.length;

  for (let i = 0; i < total; i++) {
    if (State.userAnswers[i]?.selected) answered++;
  }

  DOM.mobileAnsweredCount.textContent = answered;
  DOM.mobileTotalCount.textContent = total;
}

/**
 * Font Size Controls
 */
function setFontSize(size) {
  State.fontSize = size;
  DOM.workspaceContainer.className = `cat-workspace font-size-${size}`;

  DOM.btnFontSm.classList.toggle('active', size === 'sm');
  DOM.btnFontMd.classList.toggle('active', size === 'md');
  DOM.btnFontLg.classList.toggle('active', size === 'lg');
}

/**
 * Finish Modal Handling
 */
function showFinishModal() {
  let answered = 0;
  let doubt = 0;
  let unanswered = 0;
  const total = State.activeQuestions.length;

  for (let i = 0; i < total; i++) {
    const ans = State.userAnswers[i];
    if (ans && ans.selected) {
      answered++;
      if (ans.doubt) doubt++;
    } else {
      unanswered++;
    }
  }

  DOM.modalTotalQ.textContent = total;
  DOM.modalAnsweredQ.textContent = answered;
  DOM.modalDoubtQ.textContent = doubt;
  DOM.modalUnansweredQ.textContent = unanswered;

  DOM.confirmModal.classList.add('active');
}

function hideFinishModal() {
  DOM.confirmModal.classList.remove('active');
}

/**
 * Finish Exam & Calculate Score
 */
function finishExam(isAutoTimeout = false) {
  State.examActive = false;
  if (State.timerInterval) clearInterval(State.timerInterval);

  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;
  const total = State.activeQuestions.length;

  for (let i = 0; i < total; i++) {
    const q = State.activeQuestions[i];
    const userSelected = State.userAnswers[i]?.selected;

    if (!userSelected) {
      emptyCount++;
    } else if (userSelected.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  // Calculate UTBK Scaled Score (Range 200 - 1000 standard UTBK)
  const accuracy = (correctCount / total);
  const utbkScaledScore = Math.round(200 + (accuracy * 800));

  // Render Results Screen
  DOM.resultUserMeta.textContent = `Peserta: ${State.userProfile.name} | No: ${State.userProfile.id}`;
  DOM.resultScoreVal.textContent = utbkScaledScore;
  
  // Feedback motivational message
  if (accuracy >= 0.8) {
    DOM.resultFeedbackText.textContent = '🌟 LUAR BIASA! Skor Anda sangat tinggi dan berpeluang besar lolos di program studi impian.';
  } else if (accuracy >= 0.5) {
    DOM.resultFeedbackText.textContent = '👍 BAGUS! Pemahaman materi sudah cukup baik. Pelajari pembahasan nomor yang salah untuk memaksimalkan skor.';
  } else {
    DOM.resultFeedbackText.textContent = '💪 TETAP SEMANGAT! Latihan terus setiap hari dan perbanyak membaca kunci & pembahasan di bawah ini.';
  }

  DOM.statCorrectCount.textContent = correctCount;
  DOM.statWrongCount.textContent = wrongCount;
  DOM.statEmptyCount.textContent = emptyCount;

  // Format time spent
  const mins = Math.floor(State.timeSpentSeconds / 60);
  const secs = State.timeSpentSeconds % 60;
  DOM.statTimeSpent.textContent = `${mins}m ${secs}s`;

  // Render Review
  renderReview('all');

  showScreen('result');
}

/**
 * Render Question Review & Explanations (Pembahasan)
 */
function renderReview(filter = 'all') {
  DOM.reviewListContainer.innerHTML = '';

  State.activeQuestions.forEach((q, idx) => {
    const userSelected = State.userAnswers[idx]?.selected;
    const correctAns = q.correctAnswer ? q.correctAnswer.trim().toUpperCase() : '-';
    
    let status = 'empty';
    let statusBadgeText = 'Dikosongkan';
    let cardClass = 'is-empty';

    if (userSelected) {
      if (userSelected.trim().toUpperCase() === correctAns) {
        status = 'correct';
        statusBadgeText = 'Jawaban Benar';
        cardClass = 'is-correct';
      } else {
        status = 'wrong';
        statusBadgeText = 'Jawaban Salah';
        cardClass = 'is-wrong';
      }
    }

    // Filter condition
    if (filter !== 'all' && status !== filter) {
      return;
    }

    const reviewCard = document.createElement('div');
    reviewCard.className = `review-card ${cardClass}`;

    // Options breakdown HTML
    let optionsHtml = '';
    if (q.options) {
      Object.keys(q.options).forEach(key => {
        const isUserChoice = (userSelected === key);
        const isRightAnswer = (correctAns === key);

        let optStyle = 'padding: 6px 10px; margin: 4px 0; border-radius: 4px; font-size: 0.9rem; border: 1px solid #e2e8f0; display: flex; gap: 8px;';
        let badge = '';

        if (isRightAnswer) {
          optStyle += ' background: #dcfce7; border-color: #86efac; font-weight: 600; color: #14532d;';
          badge = '<span style="color:#166534; font-size:0.75rem; margin-left:auto;">✓ Kunci Benar</span>';
        } else if (isUserChoice && !isRightAnswer) {
          optStyle += ' background: #fee2e2; border-color: #fca5a5; color: #991b1b;';
          badge = '<span style="color:#991b1b; font-size:0.75rem; margin-left:auto;">✗ Pilihan Anda</span>';
        }

        optionsHtml += `
          <div style="${optStyle}">
            <strong>${key}.</strong>
            <span>${escapeHtml(q.options[key])}</span>
            ${badge}
          </div>
        `;
      });
    }

    reviewCard.innerHTML = `
      <div class="review-card-top">
        <div>
          <strong style="color: var(--utbk-navy); font-size: 1rem;">Soal No. ${idx + 1}</strong>
          <span style="font-size: 0.8rem; color: #64748b; margin-left: 8px;">(${q.subtestName || 'UTBK'})</span>
        </div>
        <span class="review-status-badge ${status}">${statusBadgeText}</span>
      </div>

      <div style="font-weight: 500; margin-bottom: 0.8rem; line-height: 1.6; white-space: pre-line;">
        ${escapeHtml(q.question)}
      </div>

      <div style="margin-bottom: 0.8rem;">
        ${optionsHtml}
      </div>

      <div class="explanation-box">
        <div class="explanation-title">
          💡 Pembahasan & Kunci Jawaban: <strong>Opsi (${correctAns})</strong>
        </div>
        <div style="line-height: 1.5; white-space: pre-line;">
          ${escapeHtml(q.explanation || 'Pembahasan belum ditambahkan.')}
        </div>
      </div>
    `;

    DOM.reviewListContainer.appendChild(reviewCard);
  });

  if (DOM.reviewListContainer.children.length === 0) {
    DOM.reviewListContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        Tidak ada soal pada kategori filter ini.
      </div>
    `;
  }
}

/**
 * Screen Switcher Helper
 */
function showScreen(name) {
  DOM.startScreen.classList.remove('active');
  DOM.examScreen.classList.remove('active');
  DOM.resultScreen.classList.remove('active');

  if (name === 'start') DOM.startScreen.classList.add('active');
  if (name === 'exam') DOM.examScreen.classList.add('active');
  if (name === 'result') DOM.resultScreen.classList.add('active');

  window.scrollTo(0, 0);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Fallback data if fetch questions.json fails (e.g. file:// protocol without local server)
 */
function loadFallbackData() {
  const fallback = {
    testInfo: {
      title: "SIMULASI UTBK - SNBT RESMI",
      subtitle: "Balai Pengelolaan Pengujian Pendidikan (BPPP)",
      year: "2025 / 2026",
      defaultTimeMinutes: 20
    },
    subtests: [
      {
        id: "tps-pu",
        name: "Kemampuan Penalaran Umum (PU)",
        timeMinutes: 15,
        questions: [
          {
            id: 1,
            question: "Semua atlet lari maraton memiliki stamina yang kuat. Sebagian orang yang memiliki stamina kuat gemar minum air kelapa muda. Dani adalah seorang atlet lari maraton.\n\nKesimpulan yang paling tepat adalah...",
            options: {
              A: "Dani pasti gemar minum air kelapa muda.",
              B: "Dani memiliki stamina yang kuat.",
              C: "Dani tidak gemar minum air kelapa muda.",
              D: "Orang yang gemar minum air kelapa muda pasti atlet lari maraton.",
              E: "Dani tidak memiliki stamina yang kuat."
            },
            correctAnswer: "B",
            explanation: "Premis 1: Semua atlet maraton memiliki stamina kuat.\nPremis 2: Dani adalah atlet maraton.\nKesimpulan: Dani memiliki stamina yang kuat."
          },
          {
            id: 2,
            question: "Jika harga BBM non-subsidi naik, maka tarif angkutan umum antar kota akan mengalami kenaikan. Jika tarif angkutan umum antar kota naik, maka jumlah penumpang kereta api bertambah.\n\nSaat ini, jumlah penumpang kereta api tidak bertambah. Simpulan yang benar adalah...",
            options: {
              A: "Harga BBM non-subsidi naik.",
              B: "Tarif angkutan umum antar kota naik.",
              C: "Harga BBM non-subsidi tidak naik.",
              D: "Masyarakat beralih menggunakan kendaraan pribadi.",
              E: "Kereta api mengalami penurunan tarif tiket."
            },
            correctAnswer: "C",
            explanation: "Berdasarkan Modus Tollens dari silogisme p -> r, karena ~r maka kesimpulannya ~p (Harga BBM tidak naik)."
          }
        ]
      }
    ]
  };
  loadExamData(fallback);
}
