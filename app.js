// Application State
let fullDatabase = {};
let currentStep = 'classes'; // 'classes' -> 'subjects' -> 'chapters' -> 'quiz'
let selectedClass = null;
let selectedSubject = null;
let selectedChapter = null;

let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {};

// DOM Elements
const breadcrumbBar = document.getElementById('breadcrumb-bar');
const breadcrumbPath = document.getElementById('breadcrumb-path');
const btnBackStep = document.getElementById('btn-back-step');

const stepClasses = document.getElementById('step-classes');
const stepSubjects = document.getElementById('step-subjects');
const stepChapters = document.getElementById('step-chapters');
const quizCard = document.getElementById('quiz-card');

const subjectsContainer = document.getElementById('subjects-container');
const chaptersContainer = document.getElementById('chapters-container');

const qCategory = document.getElementById('quiz-category');
const qCounter = document.getElementById('q-counter');
const qQuestion = document.getElementById('quiz-question');
const optionsContainer = document.getElementById('options-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

const navBtns = document.querySelectorAll('.nav-btn');
const viewPanels = document.querySelectorAll('.view-panel');
const solutionsContainer = document.getElementById('solutions-container');
const jsonInput = document.getElementById('json-input');
const btnSaveJson = document.getElementById('btn-save-json');

// Initialize
async function initApp() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) throw new Error("Could not load questions.json");
    fullDatabase = await response.json();
    
    renderSolutions();
    jsonInput.value = JSON.stringify(fullDatabase, null, 2);
  } catch (err) {
    console.error("Initialization Error:", err);
  }
}

// Step 1: Select Class
function selectClass(className) {
  selectedClass = className;
  selectedSubject = null;
  selectedChapter = null;
  
  renderSubjects();
  navigateToStep('subjects');
}

// Step 2: Render & Select Subject
function renderSubjects() {
  subjectsContainer.innerHTML = '';
  const subjects = fullDatabase[selectedClass] || {};
  const subjectKeys = Object.keys(subjects);

  if (subjectKeys.length === 0) {
    subjectsContainer.innerHTML = `<p style="grid-column: 1/-1;">No subjects found for ${selectedClass}.</p>`;
    return;
  }

  subjectKeys.forEach(subj => {
    const card = document.createElement('div');
    card.className = 'selection-card';
    card.innerHTML = `
      <i class="fa-solid fa-book-open card-icon"></i>
      <h3>${subj}</h3>
      <p>${Object.keys(subjects[subj]).length} Chapters Available</p>
    `;
    card.onclick = () => selectSubject(subj);
    subjectsContainer.appendChild(card);
  });
}

function selectSubject(subjectName) {
  selectedSubject = subjectName;
  selectedChapter = null;

  renderChapters();
  navigateToStep('chapters');
}

// Step 3: Render & Select Chapter
function renderChapters() {
  chaptersContainer.innerHTML = '';
  const chapters = fullDatabase[selectedClass][selectedSubject] || {};
  const chapterKeys = Object.keys(chapters);

  if (chapterKeys.length === 0) {
    chaptersContainer.innerHTML = `<p style="grid-column: 1/-1;">No chapters found for ${selectedSubject}.</p>`;
    return;
  }

  chapterKeys.forEach(chap => {
    const qCount = chapters[chap].length;
    const card = document.createElement('div');
    card.className = 'selection-card';
    card.innerHTML = `
      <i class="fa-solid fa-file-lines card-icon"></i>
      <h3>${chap}</h3>
      <p>${qCount} Questions</p>
    `;
    card.onclick = () => startQuiz(chap);
    chaptersContainer.appendChild(card);
  });
}

// Step 4: Start Quiz
function startQuiz(chapterName) {
  selectedChapter = chapterName;
  currentQuestions = fullDatabase[selectedClass][selectedSubject][selectedChapter] || [];
  currentIndex = 0;
  userAnswers = {};

  qCategory.textContent = `${selectedSubject} - ${selectedChapter}`;
  navigateToStep('quiz');
  renderQuestion(currentIndex);
}

// Navigation Flow Controller
function navigateToStep(step) {
  currentStep = step;

  // Hide all steps
  stepClasses.style.display = 'none';
  stepSubjects.style.display = 'none';
  stepChapters.style.display = 'none';
  quizCard.style.display = 'none';

  // Show breadcrumb except on step 1
  if (step === 'classes') {
    breadcrumbBar.style.display = 'none';
    stepClasses.style.display = 'block';
  } else {
    breadcrumbBar.style.display = 'flex';
    let path = `<strong>${selectedClass}</strong>`;
    if (selectedSubject) path += ` &gt; <strong>${selectedSubject}</strong>`;
    if (selectedChapter) path += ` &gt; <strong>${selectedChapter}</strong>`;
    breadcrumbPath.innerHTML = path;

    if (step === 'subjects') stepSubjects.style.display = 'block';
    if (step === 'chapters') stepChapters.style.display = 'block';
    if (step === 'quiz') quizCard.style.display = 'block';
  }
}

// Back Button Navigation Logic
btnBackStep.onclick = () => {
  if (currentStep === 'subjects') navigateToStep('classes');
  else if (currentStep === 'chapters') navigateToStep('subjects');
  else if (currentStep === 'quiz') navigateToStep('chapters');
};

// Render Quiz Question
function renderQuestion(index) {
  if (!currentQuestions.length) return;
  const q = currentQuestions[index];

  qCounter.textContent = `Question ${index + 1} of ${currentQuestions.length}`;
  qQuestion.textContent = `${index + 1}. ${q.question}`;

  optionsContainer.innerHTML = '';
  const userSelected = userAnswers[index];
  const isAnswered = userSelected !== undefined;

  Object.entries(q.options).forEach(([key, value]) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';

    if (isAnswered) {
      if (key === q.answer) btn.classList.add('correct');
      else if (key === userSelected) btn.classList.add('incorrect');
      btn.disabled = true;
    }

    btn.innerHTML = `<span class="option-key">${key}</span> <span>${value}</span>`;
    btn.onclick = () => {
      userAnswers[index] = key;
      renderQuestion(index);
    };
    optionsContainer.appendChild(btn);
  });

  if (isAnswered && q.explanation) {
    const expBox = document.createElement('div');
    expBox.className = 'explanation-feedback';
    expBox.innerHTML = `<strong>Explanation:</strong> ${q.explanation}`;
    optionsContainer.appendChild(expBox);
  }

  btnPrev.disabled = index === 0;
  btnNext.innerHTML = index === currentQuestions.length - 1 
    ? 'Finish <i class="fa-solid fa-check"></i>' 
    : 'Next <i class="fa-solid fa-arrow-right"></i>';
}

btnPrev.onclick = () => {
  if (currentIndex > 0) { currentIndex--; renderQuestion(currentIndex); }
};

btnNext.onclick = () => {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderQuestion(currentIndex);
  } else {
    let score = 0;
    currentQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) score++;
    });
    alert(`Quiz Complete!\nScore: ${score} / ${currentQuestions.length}`);
    navigateToStep('chapters');
  }
};

// Solutions Bank Generator
function renderSolutions() {
  solutionsContainer.innerHTML = '';
  Object.entries(fullDatabase).forEach(([className, subjects]) => {
    Object.entries(subjects).forEach(([subjectName, chapters]) => {
      Object.entries(chapters).forEach(([chapterName, questions]) => {
        questions.forEach((q, idx) => {
          const item = document.createElement('div');
          item.className = 'solution-item';
          
          let opts = '';
          Object.entries(q.options).forEach(([k, v]) => {
            const isCorrect = k === q.answer;
            opts += `<div style="color: ${isCorrect ? 'var(--success)' : 'inherit'}; font-weight: ${isCorrect ? '600' : 'normal'}">${k}) ${v} ${isCorrect ? '✓' : ''}</div>`;
          });

          item.innerHTML = `
            <small style="color: var(--primary); font-weight: 600;">${className} • ${subjectName} • ${chapterName}</small>
            <h3 style="margin: 0.3rem 0;">${idx + 1}. ${q.question}</h3>
            <div>${opts}</div>
            <div class="explanation-box"><strong>Explanation:</strong> ${q.explanation}</div>
          `;
          solutionsContainer.appendChild(item);
        });
      });
    });
  });
}

// Navigation Tabs
navBtns.forEach(btn => {
  btn.onclick = () => {
    navBtns.forEach(b => b.classList.remove('active'));
    viewPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// JSON Save Handler
btnSaveJson.onclick = () => {
  try {
    fullDatabase = JSON.parse(jsonInput.value);
    navigateToStep('classes');
    renderSolutions();
    alert("Database updated successfully!");
  } catch (err) {
    alert("Invalid JSON format: " + err.message);
  }
};

document.addEventListener('DOMContentLoaded', initApp);