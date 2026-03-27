let questions = [];
let filteredQuestions = [];
let currentQuestion = 0;
let score = 0;
let attempted = 0;
let checked = false;
let userAnswers = [];
let timerInterval;
let isReviewMode = false;
let flaggedQuestions = new Set();

const urlParams = new URLSearchParams(window.location.search);
const subject = urlParams.get('subject') || 'soft_skills';
const mode = urlParams.get('mode') || 'practice'; 
const setNum = parseInt(urlParams.get('set')) || 1; 

let subjectNameMap = {
    'soft_skills': 'Soft Skills',
    'os': 'Operating Systems',
    'cn': 'Computer Networks'
};

let title = subjectNameMap[subject] || 'Quiz';
if (mode === 'mock') {
    title += " - Mock Test";
} else {
    title += ` - Practice Set ${setNum}`;
}
document.getElementById('quiz-title').innerText = title;

let timeRemaining = mode === 'mock' ? 90 * 60 : 35 * 60; // 90 mins for mock, 35 for practice

fetch(`${subject}.json`)
    .then(r => r.json())
    .then(data => {
        questions = data;
        
        if (mode === 'mock') {
            // Random 50 questions
            filteredQuestions = questions.sort(() => 0.5 - Math.random());
            if (filteredQuestions.length > 50) {
                filteredQuestions = filteredQuestions.slice(0, 50);
            }
        } else {
            // Set of 35
            const startIdx = (setNum - 1) * 35;
            const endIdx = startIdx + 35;
            filteredQuestions = questions.slice(startIdx, endIdx);
            
            // Disable timer element visually
            document.getElementById('timer-display').style.display = 'none';
        }

        // Try to load saved progress if in practice mode
        if (mode === 'practice') {
            const progress = getProgress();
            if (progress[subject] && progress[subject].savedPractice && progress[subject].savedPractice.setNum === setNum) {
                const saved = progress[subject].savedPractice;
                currentQuestion = saved.currentQuestion;
                userAnswers = saved.userAnswers;
            }
        }
        
        document.getElementById("start-btn").addEventListener("click", startQuiz);
        if(mode === 'mock') {
            document.getElementById('start-screen').insertAdjacentHTML('beforeend', "<p>Time limit: 1 hour 30 minutes.</p>");
        } else {
            document.getElementById('start-screen').insertAdjacentHTML('beforeend', `<p>Total Questions: ${filteredQuestions.length}</p>`);
            if (currentQuestion > 0) {
                document.getElementById('start-btn').innerText = "Resume Practice";
            }
        }
    });

function updateProgressBar() {
    const progressPercent = ((currentQuestion) / filteredQuestions.length) * 100;
    document.getElementById("progress-bar").style.width = `${progressPercent}%`;
}

function saveCurrentState() {
    if (mode === 'practice' && !isReviewMode) {
        saveProgress(subject, 'savedPractice', null, {
            setNum: setNum,
            currentQuestion: currentQuestion,
            userAnswers: userAnswers
        });
    }
}

function startQuiz() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";
    
    // Show keyboard guide when quiz starts
    document.getElementById("keyboard-guide").style.display = "block";
    
    if (mode === 'mock') {
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert("Time's up!");
                showResult();
            }
        }, 1000);
    }
    loadQuestion();
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeRemaining / 60);
    let seconds = timeRemaining % 60;
    document.getElementById("time").innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
    if (timeRemaining < 60) {
        document.getElementById("timer-display").style.color = "red";
    }
}

function loadQuestion() {
    checked = false;
    updateProgressBar();
    const q = filteredQuestions[currentQuestion];
    
    if (isReviewMode) {
        let flagText = flaggedQuestions.has(currentQuestion) ? "<span class='flag-text'>[🚩 Flagged]</span>" : "";
        document.getElementById("question-counter").innerHTML = `Reviewing: Question ${currentQuestion + 1} / ${filteredQuestions.length} ${flagText}`;
        document.getElementById("check-btn").style.display = "none";
        document.getElementById("flag-btn").style.display = "none";
        document.getElementById("stop-btn").style.display = "none";
        document.getElementById("next-btn").innerText = (currentQuestion === filteredQuestions.length - 1) ? "Finish Review" : "Next (🡢)";
    } else {
        let flagText = flaggedQuestions.has(currentQuestion) ? "<span class='flag-text'>[🚩 Flagged]</span>" : "";
        document.getElementById("question-counter").innerHTML = `Question ${currentQuestion + 1} / ${filteredQuestions.length} ${flagText}`;
    }

    document.getElementById("question").innerText = q.question;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    q.options.forEach((option, index) => {
        let extraClass = '';
        if (isReviewMode) {
            if (index === q.answer) extraClass = 'correct-review';
            else if (userAnswers[currentQuestion] === index) extraClass = 'wrong-review';
        }
        
        optionsDiv.innerHTML += `
            <label class="option-label ${extraClass}">
                <input type="radio" name="option" value="${index}" ${isReviewMode ? 'disabled' : ''}>
                ${option}
            </label>
        `;
    });

    if (userAnswers[currentQuestion] !== undefined) {
        const savedOption = document.querySelector(`input[value="${userAnswers[currentQuestion]}"]`);
        if (savedOption) savedOption.checked = true;
    }
    
    if (isReviewMode) {
        document.getElementById("explanation").innerText = q.explanation || "No explanation provided.";
        document.getElementById("result").innerText = "";
    } else {
        document.getElementById("result").innerText = "";
        document.getElementById("explanation").innerText = "";
    }
}

document.getElementById("check-btn").addEventListener("click", () => {
    if (checked) return;
    const selected = document.querySelector('input[name="option"]:checked');
    if (!selected) {
        alert("Select an option first");
        return;
    }

    checked = true;
    const answer = parseInt(selected.value);
    userAnswers[currentQuestion] = answer;

    if (answer === filteredQuestions[currentQuestion].answer) {
        document.getElementById("result").innerText = "Correct ✅";
        document.getElementById("result").style.color = "green";
    } else {
        document.getElementById("result").innerText = "Wrong ❌";
        document.getElementById("result").style.color = "red";
    }

    document.getElementById("explanation").innerText = filteredQuestions[currentQuestion].explanation;
});

document.getElementById("next-btn").addEventListener("click", () => {
    if (!isReviewMode) {
        const selected = document.querySelector('input[name="option"]:checked');
        if (selected) {
            userAnswers[currentQuestion] = parseInt(selected.value);
        }
        saveCurrentState();
    }
    
    currentQuestion++;
    
    if (currentQuestion < filteredQuestions.length) {
        loadQuestion();
    } else {
        if (isReviewMode) {
            document.getElementById("quiz-screen").style.display = "none";
            document.getElementById("result-screen").style.display = "block";
        } else {
            showResult();
        }
    }
});

document.getElementById("stop-btn").addEventListener("click", () => {
    if (!isReviewMode) {
        const selected = document.querySelector('input[name="option"]:checked');
        if (selected) {
            userAnswers[currentQuestion] = parseInt(selected.value);
        }
    }
    showResult();
});

document.getElementById("restart-btn").addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    attempted = 0;
    checked = false;
    userAnswers = [];
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
    document.getElementById("keyboard-guide").style.display = "none";
});

function showResult() {
    if (mode === 'mock') clearInterval(timerInterval);
    score = 0;
    attempted = 0;

    userAnswers.forEach((answer, index) => {
        if (answer !== undefined && !isNaN(answer)) {
            attempted++;
            if (answer === filteredQuestions[index].answer) {
                score++;
            }
        }
    });

    // Save Progress
    if (mode === 'mock') {
        saveProgress(subject, 'mock', score);
    } else if (mode === 'practice') {
        // Mark as completed
        saveProgress(subject, 'practice', setNum);
        // Clear saved practice state
        saveProgress(subject, 'savedPractice', null, null);
    }

    document.getElementById("quiz-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "block";

    document.getElementById("final-score").innerHTML = `
        <strong>Attempted:</strong> ${attempted} / ${filteredQuestions.length}<br>
        <strong>Score:</strong> ${score} / ${filteredQuestions.length}<br>
        <strong>Percentage:</strong> ${attempted ? ((score / filteredQuestions.length) * 100).toFixed(2) : 0}%
    `;
    
    // Auto-update dashboard link
    document.getElementById('dashboard-btn').href = `l3_course_dashboard.html?subject=${subject}`;
}

document.getElementById("review-btn").addEventListener("click", () => {
    isReviewMode = true;
    currentQuestion = 0;
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";
    loadQuestion();
});

document.getElementById("flag-btn").addEventListener("click", () => {
    if (flaggedQuestions.has(currentQuestion)) {
        flaggedQuestions.delete(currentQuestion);
    } else {
        flaggedQuestions.add(currentQuestion);
    }
    loadQuestion();
});

document.addEventListener('keydown', (e) => {
    if (document.getElementById("quiz-screen").style.display === "block") {
        const key = e.key;
        
        if (['1', '2', '3', '4'].includes(key) && !isReviewMode) {
            const index = parseInt(key) - 1;
            const radios = document.querySelectorAll('input[name="option"]');
            if (radios[index]) radios[index].checked = true;
        } else if (key === 'Enter') {
            if (!isReviewMode && !checked) document.getElementById("check-btn").click();
            else document.getElementById("next-btn").click();
        } else if (key === 'ArrowRight') {
            document.getElementById("next-btn").click();
        } else if ((key === 'f' || key === 'F') && !isReviewMode) {
            document.getElementById("flag-btn").click();
        }
    }
});

document.getElementById("iknow-btn").addEventListener("click", () => {
    document.getElementById("keyboard-guide").style.display = "none";
});
