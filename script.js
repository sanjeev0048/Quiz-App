// Quiz data and state
let quiz = {
    title: "Sample Knowledge Quiz",
    questions: []
};
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStarted = false;

// Utility functions
function arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// DOM helpers
function showScreen(screenId) {
    document.querySelectorAll('.setup-screen, .quiz-screen, .results-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Setup screen logic
function renderQuestionsList() {
    const list = document.getElementById('questionsList');
    list.innerHTML = '';
    quiz.questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'question-item';
        div.innerHTML = `
            <div class="question-preview">${i + 1}. ${q.text}</div>
            <div class="question-actions">
                <button class="btn btn-small btn-secondary" onclick="editQuestion(${i})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteQuestion(${i})">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Modal logic
let editingQuestionIndex = null;
function openQuestionModal(index = null) {
    editingQuestionIndex = index;
    document.getElementById('questionModal').classList.add('active');
    if (index !== null) {
        const q = quiz.questions[index];
        document.getElementById('questionType').value = q.type;
        document.getElementById('questionText').value = q.text;
        updateQuestionForm(q);
    } else {
        document.getElementById('questionType').value = 'multiple';
        document.getElementById('questionText').value = '';
        updateQuestionForm();
    }
}
function closeQuestionModal() {
    document.getElementById('questionModal').classList.remove('active');
    editingQuestionIndex = null;
}

// Question form logic
function updateQuestionForm(existing = null) {
    const type = document.getElementById('questionType').value;
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    if (type === 'multiple' || type === 'single') {
        for (let i = 0; i < 4; i++) {
            const opt = document.createElement('div');
            opt.className = 'form-group';
            opt.innerHTML = `
                <input type="text" id="option${i}" placeholder="Option ${i + 1}" value="${existing && existing.options[i] ? existing.options[i] : ''}">
                <label>
                    <input type="${type === 'multiple' ? 'checkbox' : 'radio'}" name="correct" value="${i}" ${existing && existing.correct && existing.correct.includes(i) ? 'checked' : ''}>
                    Correct
                </label>
            `;
            container.appendChild(opt);
        }
    } else if (type === 'fillblank') {
        container.innerHTML = `
            <div class="form-group">
                <label>Correct Answer:</label>
                <input type="text" id="fillBlankCorrect" placeholder="Type correct answer" value="${existing && existing.correct ? existing.correct[0] : ''}">
            </div>
        `;
    } else if (type === 'truefalse') {
        container.innerHTML = `
            <div class="form-group">
                <label>
                    <input type="radio" name="correct" value="true" ${existing && existing.correct && existing.correct[0] === true ? 'checked' : ''}>
                    True
                </label>
                <label>
                    <input type="radio" name="correct" value="false" ${existing && existing.correct && existing.correct[0] === false ? 'checked' : ''}>
                    False
                </label>
            </div>
        `;
    }
}

// Save question
function saveQuestion() {
    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value.trim();
    let options = [];
    let correct = [];
    if (type === 'multiple' || type === 'single') {
        for (let i = 0; i < 4; i++) {
            options.push(document.getElementById(`option${i}`).value.trim());
        }
        const correctInputs = document.querySelectorAll('#optionsContainer input[name="correct"]');
        correctInputs.forEach((input, idx) => {
            if (input.checked) correct.push(idx);
        });
        if (type === 'single' && correct.length > 1) correct = [correct[0]];
    } else if (type === 'fillblank') {
        const ans = document.getElementById('fillBlankCorrect').value.trim();
        if (ans) correct = [ans];
    } else if (type === 'truefalse') {
        const val = document.querySelector('#optionsContainer input[name="correct"]:checked');
        if (val) correct = [val.value === 'true'];
    }
    if (!text || (type !== 'fillblank' && options.some(opt => !opt)) || correct.length === 0) {
        alert('Please fill all fields and select correct answer(s).');
        return;
    }
    const question = { type, text, options, correct };
    if (editingQuestionIndex !== null) {
        quiz.questions[editingQuestionIndex] = question;
    } else {
        quiz.questions.push(question);
    }
    closeQuestionModal();
    renderQuestionsList();
}

// Edit/Delete question
function editQuestion(index) {
    openQuestionModal(index);
}
function deleteQuestion(index) {
    if (confirm('Delete this question?')) {
        quiz.questions.splice(index, 1);
        renderQuestionsList();
    }
}

// Start quiz
function startQuiz() {
    quiz.title = document.getElementById('quizTitle').value.trim() || "Untitled Quiz";
    if (quiz.questions.length === 0) {
        alert('Add at least one question.');
        return;
    }
    userAnswers = [];
    currentQuestionIndex = 0;
    quizStarted = true;
    showScreen('quizScreen');
    renderQuestion();
    updateProgress();
}

// Quiz logic
function renderQuestion() {
    const q = quiz.questions[currentQuestionIndex];
    const container = document.getElementById('currentQuestion');
    container.innerHTML = '';
    let html = `<div class="question-card">
        <div class="question-number">Question ${currentQuestionIndex + 1} of ${quiz.questions.length}</div>
        <div class="question-text">${q.text}</div>
        <div class="options">`;
    if (q.type === 'multiple' || q.type === 'single') {
        q.options.forEach((opt, i) => {
            const selected = userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].includes(i);
            html += `<div class="option${selected ? ' selected' : ''}" onclick="selectOption(${i})">${opt}</div>`;
        });
    } else if (q.type === 'fillblank') {
        const val = userAnswers[currentQuestionIndex] ? userAnswers[currentQuestionIndex][0] : '';
        html += `<div class="fill-blank"><input type="text" id="fillBlankInput" value="${val}" placeholder="Type your answer"></div>`;
    } else if (q.type === 'truefalse') {
        ['True', 'False'].forEach((opt, i) => {
            const selected = userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex][0] === (i === 0);
            html += `<div class="option${selected ? ' selected' : ''}" onclick="selectOption(${i === 0 ? 'true' : 'false'})">${opt}</div>`;
        });
    }
    html += `</div></div>`;
    container.innerHTML = html;
    document.getElementById('questionInfo').textContent = quiz.title;
    document.getElementById('prevBtn').style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    document.getElementById('nextBtn').textContent = currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next';
}

// Option selection
function selectOption(val) {
    const q = quiz.questions[currentQuestionIndex];
    if (q.type === 'multiple') {
        if (!userAnswers[currentQuestionIndex]) userAnswers[currentQuestionIndex] = [];
        const idx = userAnswers[currentQuestionIndex].indexOf(val);
        if (idx > -1) {
            userAnswers[currentQuestionIndex].splice(idx, 1);
        } else {
            userAnswers[currentQuestionIndex].push(val);
        }
    } else if (q.type === 'single') {
        userAnswers[currentQuestionIndex] = [val];
    } else if (q.type === 'truefalse') {
        userAnswers[currentQuestionIndex] = [val === true];
    }
    renderQuestion();
}

// Navigation
function nextQuestion() {
    const q = quiz.questions[currentQuestionIndex];
    if (q.type === 'fillblank') {
        const val = document.getElementById('fillBlankInput').value.trim();
        userAnswers[currentQuestionIndex] = [val];
    }
    if (currentQuestionIndex < quiz.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        updateProgress();
    } else {
        finishQuiz();
    }
}
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        updateProgress();
    }
}

// Progress bar
function updateProgress() {
    const percent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    document.getElementById('progressBar').style.width = percent + '%';
}

// Finish quiz
function finishQuiz() {
    showScreen('resultsScreen');
    const score = calculateScore();
    const percent = Math.round((score / quiz.questions.length) * 100);
    document.getElementById('scoreText').textContent = percent + '%';
    document.getElementById('scoreCircle').style.setProperty('--score-angle', `${percent * 3.6}deg`);
    document.getElementById('resultTitle').textContent = percent >= 70 ? 'Great Job!' : 'Quiz Complete!';
    document.getElementById('resultMessage').textContent = `You answered ${score} out of ${quiz.questions.length} questions correctly.`;
}

// Calculate score
function calculateScore() {
    let score = 0;
    quiz.questions.forEach((q, i) => {
        if (checkAnswer(q, userAnswers[i])) score++;
    });
    return score;
}

// Check answer function
function checkAnswer(question, userAnswer) {
    if (!userAnswer) return false;
    if (question.type === 'fillblank') {
        return question.correct.some(correct => correct.toLowerCase() === (userAnswer[0] || '').toLowerCase());
    } else if (question.type === 'truefalse') {
        return question.correct[0] === userAnswer[0];
    } else {
        return arraysEqual((userAnswer || []).sort(), (question.correct || []).sort());
    }
}

// Review answers
function reviewAnswers() {
    let reviewHtml = `<div style="padding: 30px;">`;
    quiz.questions.forEach((q, i) => {
        const userAns = userAnswers[i];
        const isCorrect = checkAnswer(q, userAns);
        reviewHtml += `<div class="question-card">
            <div class="question-number">Q${i + 1}</div>
            <div class="question-text">${q.text}</div>
            <div><strong>Your Answer:</strong> `;
        if (q.type === 'multiple' || q.type === 'single') {
            if (userAns && userAns.length) {
                reviewHtml += userAns.map(idx => q.options[idx]).join(', ');
            } else {
                reviewHtml += '<em>No answer</em>';
            }
        } else if (q.type === 'fillblank') {
            reviewHtml += userAns && userAns[0] ? userAns[0] : '<em>No answer</em>';
        } else if (q.type === 'truefalse') {
            reviewHtml += userAns && typeof userAns[0] === 'boolean' ? (userAns[0] ? 'True' : 'False') : '<em>No answer</em>';
        }
        reviewHtml += `</div><div><strong>Correct Answer:</strong> `;
        if (q.type === 'multiple' || q.type === 'single') {
            reviewHtml += q.correct.map(idx => q.options[idx]).join(', ');
        } else if (q.type === 'fillblank') {
            reviewHtml += q.correct[0];
        } else if (q.type === 'truefalse') {
            reviewHtml += q.correct[0] ? 'True' : 'False';
        }
        reviewHtml += `</div>`;
        reviewHtml += `<div style="text-align: right; margin-top: 10px; color: ${isCorrect ? '#28a745' : '#dc3545'}; font-weight: bold;">${isCorrect ? '✓ Correct' : '✗ Incorrect'}</div>`;
        reviewHtml += `</div>`;
    });
    reviewHtml += '</div>';
    document.getElementById('resultsScreen').innerHTML = reviewHtml +
        `<div style="text-align:center; margin-top:30px;">
            <button class="btn btn-secondary" onclick="backToSetup()">New Quiz</button>
            <button class="btn" onclick="restartQuiz()">Try Again</button>
        </div>`;
}

// Restart/back
function restartQuiz() {
    userAnswers = [];
    currentQuestionIndex = 0;
    showScreen('quizScreen');
    renderQuestion();
    updateProgress();
}
function backToSetup() {
    quizStarted = false;
    showScreen('setupScreen');
    renderQuestionsList();
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    renderQuestionsList();
    showScreen('setupScreen');
});