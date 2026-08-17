/**
 * SIMULASI UTBK - SNBT ENGINE (Sistem CAT Resmi BPPP Kemdikbud)
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
    name: 'MUHAMMAD HAIRIL',
    id: '25-3401-0891-01'
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
  btnToggleDaftarSoal: document.getElementById('btn-toggle-daftar-soal'),

  // Workspace
  currentQBadge: document.getElementById('current-q-badge'),
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

  // Modal
  confirmModal: document.getElementById('confirm-modal'),
  modalTotalQ: document.getElementById('modal-total-q'),
  modalAnsweredQ: document.getElementById('modal-answered-q'),
  modalDoubtQ: document.getElementById('modal-doubt-q'),
  modalUnansweredQ: document.getElementById('modal-unanswered-q'),
  modalCheckConfirm: document.getElementById('modal-check-confirm'),
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
    loadFallbackData();
  }
}

/**
 * Load and parse exam data object
 */
function loadExamData(data) {
  State.examData = data;
  
  if (data.testInfo) {
    DOM.startTitle.textContent = data.testInfo.title || 'SIMULASI TES HAIRIL';
    DOM.startSubtitle.textContent = `${data.testInfo.subtitle || 'Platform Evaluasi Pribadi'} • Tahun ${data.testInfo.year || '2025/2026'}`;
    if (data.testInfo.defaultTimeMinutes) {
      DOM.inputCustomTime.value = data.testInfo.defaultTimeMinutes;
    }
  }

  // Populate subtest options in dropdown
  DOM.selectSubtest.innerHTML = '';
  
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
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--bppp-blue-btn)';
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
  }

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

  // Modal Checkbox Confirmation
  DOM.modalCheckConfirm.addEventListener('change', (e) => {
    DOM.btnModalConfirm.disabled = !e.target.checked;
    DOM.btnModalConfirm.style.opacity = e.target.checked ? '1' : '0.5';
    DOM.btnModalConfirm.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
  });

  DOM.btnModalCancel.addEventListener('click', hideFinishModal);
  DOM.btnModalConfirm.addEventListener('click', () => {
    hideFinishModal();
    finishExam(false);
  });

  // Font Size Resizer
  DOM.btnFontSm.addEventListener('click', () => setFontSize('sm'));
  DOM.btnFontMd.addEventListener('click', () => setFontSize('md'));
  DOM.btnFontLg.addEventListener('click', () => setFontSize('lg'));

  // Toggle Daftar Soal Button (Header)
  DOM.btnToggleDaftarSoal.addEventListener('click', () => {
    DOM.catSidebar.classList.toggle('mobile-open');
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
  document.querySelectorAll('.btn-filter-review').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-filter-review').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderReview(e.target.dataset.filter);
    });
  });

  // Keyboard Shortcuts (Arrow Left/Right, 1-5 / A-E, R)
  window.addEventListener('keydown', (e) => {
    if (!State.examActive) return;
    
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
  State.userProfile.name = DOM.inputUserName.value.trim() || 'MUHAMMAD HAIRIL';
  State.userProfile.id = DOM.inputUserId.value.trim() || '25-3401-0891-01';

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
    DOM.examHeaderSubtest.textContent = 'Semua Subtes (Paket Lengkap)';
  } else if (chosenSubtest === 'flat') {
    State.activeQuestions = [...(State.examData.questions || [])];
    DOM.examHeaderSubtest.textContent = 'Simulasi Soal';
  } else {
    const subIdx = parseInt(chosenSubtest, 10);
    const sub = State.examData.subtests[subIdx];
    if (sub) {
      State.activeQuestions = (sub.questions || []).map(q => ({
        ...q,
        subtestName: sub.name
      }));
      DOM.examHeaderSubtest.textContent = sub.name;
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
      DOM.timerBox.classList.add('warning-pulse');
    } else {
      DOM.timerBox.classList.remove('warning-pulse');
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
  DOM.currentQBadge.textContent = `SOAL NOMOR: ${index + 1}`;
  DOM.examHeaderSubtest.textContent = qData.subtestName || State.examData.testInfo?.title || 'UTBK CAT';

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
      optEl.className = `cat-option-row ${isSelected ? 'active-selected' : ''}`;
      optEl.dataset.key = key;

      optEl.innerHTML = `
        <div class="cat-option-circle">${key}</div>
        <div class="cat-option-content">${escapeHtml(optionVal)}</div>
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
    DOM.labelRagu.classList.add('is-checked');
  } else {
    DOM.labelRagu.classList.remove('is-checked');
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
  document.querySelectorAll('.cat-option-row').forEach(el => {
    if (el.dataset.key === key) {
      el.classList.add('active-selected');
    } else {
      el.classList.remove('active-selected');
    }
  });

  // Update grid button
  updateSingleGridButton(State.currentIndex);
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
    DOM.labelRagu.classList.add('is-checked');
  } else {
    DOM.labelRagu.classList.remove('is-checked');
  }

  updateSingleGridButton(State.currentIndex);
}

/**
 * Jump to specific question
 */
function jumpToQuestion(index) {
  if (index < 0 || index >= State.activeQuestions.length) return;
  renderQuestion(index);
  DOM.catSidebar.classList.remove('mobile-open');
}

/**
 * Render Right Sidebar Question Grid
 */
function renderQuestionGrid() {
  DOM.questionGrid.innerHTML = '';

  State.activeQuestions.forEach((q, idx) => {
    const btn = document.createElement('div');
    btn.className = 'cat-num-box';
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

  btn.className = 'cat-num-box';
  btn.innerHTML = `${index + 1}`;

  if (isDoubt) {
    btn.classList.add('is-doubt');
  }
  if (isAnswered) {
    btn.classList.add('is-answered');
    const tag = document.createElement('span');
    tag.className = 'mini-tag';
    tag.textContent = ans.selected;
    btn.appendChild(tag);
  }

  if (index === State.currentIndex) {
    btn.classList.add('is-current');
  }
}

function updateActiveGridButton(index) {
  document.querySelectorAll('.cat-num-box').forEach(btn => {
    btn.classList.remove('is-current');
  });
  const currentBtn = document.getElementById(`grid-btn-${index}`);
  if (currentBtn) currentBtn.classList.add('is-current');
}

/**
 * Font Size Controls
 */
function setFontSize(size) {
  State.fontSize = size;
  DOM.workspaceContainer.className = `cat-main-card font-${size}`;

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

  DOM.modalCheckConfirm.checked = false;
  DOM.btnModalConfirm.disabled = true;
  DOM.btnModalConfirm.style.opacity = '0.5';
  DOM.btnModalConfirm.style.cursor = 'not-allowed';

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
  
  if (accuracy >= 0.8) {
    DOM.resultFeedbackText.textContent = '🌟 LUAR BIASA! Nilai simulasi Anda sangat memuaskan dan berpeluang besar lolos di program studi impian.';
  } else if (accuracy >= 0.5) {
    DOM.resultFeedbackText.textContent = '👍 BAGUS! Pemahaman materi sudah cukup baik. Pelajari pembahasan nomor yang salah untuk memaksimalkan skor.';
  } else {
    DOM.resultFeedbackText.textContent = '💪 TETAP SEMANGAT! Latihan terus setiap hari dan perbanyak membaca kunci & pembahasan di bawah ini.';
  }

  DOM.statCorrectCount.textContent = correctCount;
  DOM.statWrongCount.textContent = wrongCount;
  DOM.statEmptyCount.textContent = emptyCount;

  const mins = Math.floor(State.timeSpentSeconds / 60);
  const secs = State.timeSpentSeconds % 60;
  DOM.statTimeSpent.textContent = `${mins}m ${secs}s`;

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

    if (filter !== 'all' && status !== filter) {
      return;
    }

    const reviewCard = document.createElement('div');
    reviewCard.className = `cat-review-item ${cardClass}`;

    let optionsHtml = '';
    if (q.options) {
      Object.keys(q.options).forEach(key => {
        const isUserChoice = (userSelected === key);
        const isRightAnswer = (correctAns === key);

        let optStyle = 'padding: 6px 12px; margin: 4px 0; border-radius: 4px; font-size: 0.92rem; border: 1px solid #cbd5e1; display: flex; gap: 8px;';
        let badge = '';

        if (isRightAnswer) {
          optStyle += ' background: #dcfce7; border-color: #86efac; font-weight: 700; color: #14532d;';
          badge = '<span style="color:#166534; font-size:0.78rem; margin-left:auto;">✓ Kunci Benar</span>';
        } else if (isUserChoice && !isRightAnswer) {
          optStyle += ' background: #fee2e2; border-color: #fca5a5; color: #991b1b;';
          badge = '<span style="color:#991b1b; font-size:0.78rem; margin-left:auto;">✗ Pilihan Anda</span>';
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
        <div>
          <strong style="color: #15375c; font-size: 1.05rem;">Soal No. ${idx + 1}</strong>
          <span style="font-size: 0.82rem; color: #64748b; margin-left: 8px;">(${q.subtestName || 'UTBK CAT'})</span>
        </div>
        <span style="font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 3px; text-transform: uppercase; ${status === 'correct' ? 'background:#dcfce7; color:#166534;' : status === 'wrong' ? 'background:#fee2e2; color:#991b1b;' : 'background:#fef3c7; color:#92400e;'}">
          ${statusBadgeText}
        </span>
      </div>

      <div style="font-weight: 500; margin-bottom: 0.8rem; line-height: 1.65; white-space: pre-line;">
        ${escapeHtml(q.question)}
      </div>

      <div style="margin-bottom: 0.8rem;">
        ${optionsHtml}
      </div>

      <div class="cat-pembahasan-box">
        <div style="font-weight: 700; color: #15375c; margin-bottom: 0.3rem;">
          💡 Pembahasan Kunci Jawaban: <strong>Opsi (${correctAns})</strong>
        </div>
        <div style="line-height: 1.55; white-space: pre-line;">
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
 * Fallback data if fetch questions.json fails
 */
function loadFallbackData() {
  const fallback = {
    testInfo: {
      title: "SIMULASI TES HAIRIL",
      subtitle: "Pengetahuan Kuantitatif: Operasi Bilangan",
      year: "2025 / 2026",
      defaultTimeMinutes: 20
    },
    subtests: [
      {
        id: "pk-operasi-bilangan",
        name: "Pengetahuan Kuantitatif - Operasi Bilangan",
        timeMinutes: 20,
        questions: [
          {
            id: 1,
            question: "Jika didefinisikan operasi khusus ♠ pada bilangan real sebagai:\na ♠ b = (a × b) / (a + b) + 2a\n\nMaka nilai dari 6 ♠ 3 adalah...",
            options: {
              A: "12",
              B: "14",
              C: "16",
              D: "18",
              E: "20"
            },
            correctAnswer: "B",
            explanation: "a = 6, b = 3\n6 ♠ 3 = (6 × 3) / (6 + 3) + 2(6) = 18 / 9 + 12 = 2 + 12 = 14."
          },
          {
            id: 2,
            question: "Diberikan operasi bilangan ⊕ dan ⊗ dengan aturan:\nx ⊕ y = 3x - y\na ⊗ b = a² + 2b\n\nNilai dari (2 ⊕ 4) ⊗ 3 adalah...",
            options: {
              A: "8",
              B: "10",
              C: "12",
              D: "14",
              E: "16"
            },
            correctAnswer: "B",
            explanation: "2 ⊕ 4 = 3(2) - 4 = 2.\n2 ⊗ 3 = 2² + 2(3) = 4 + 6 = 10."
          },
          {
            id: 3,
            question: "Hasil perhitungan dari:\n(1 - 1/2) × (1 - 1/3) × (1 - 1/4) × ... × (1 - 1/50)\n\nadalah...",
            options: {
              A: "1/25",
              B: "1/50",
              C: "2/50",
              D: "49/50",
              E: "1/100"
            },
            correctAnswer: "B",
            explanation: "Pencoretan berantai suku perkalian pecahan menyisakan pembilang suku pertama (1) dan penyebut suku terakhir (50) = 1/50."
          }
        ]
      }
    ]
  };
  loadExamData(fallback);
}
