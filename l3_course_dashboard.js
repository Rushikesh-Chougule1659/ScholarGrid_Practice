const urlParams = new URLSearchParams(window.location.search);
const subject = urlParams.get('subject') || 'soft_skills';

let subjectNameMap = {
    'soft_skills': 'Soft Skills',
    'os': 'Operating Systems',
    'cn': 'Computer Networks'
};

document.getElementById('course-title').innerText = subjectNameMap[subject] || 'Course Dashboard';

// Dummy youtube links mapping
const ytLinks = {
    'soft_skills': 'https://youtube.com/playlist?list=PLxyz_softskills',
    'os': 'https://youtube.com/playlist?list=PLxyz_os',
    'cn': 'https://youtube.com/playlist?list=PLxyz_cn'
};

document.getElementById('material-link').href = ytLinks[subject] || '#';
document.getElementById('mock-link').href = `l3_quiz.html?subject=${subject}&mode=mock`;

// Load progress
const progressData = getProgress()[subject] || { mockHigh: 0, completedSets: [], savedPractice: null };

if (progressData.mockHigh > 0) {
    const hsDisplay = document.getElementById('high-score-display');
    hsDisplay.innerText = `🏆 Best Mock Test Score: ${progressData.mockHigh} / 50`;
    hsDisplay.style.display = 'block';
}

// Render sets of 35 dynamically
fetch(`${subject}.json`)
    .then(r => r.json())
    .then(data => {
        const totalQ = data.length;
        const setsContainer = document.getElementById('practice-sets');
        setsContainer.innerHTML = '';
        
        if (totalQ === 0) {
            setsContainer.innerHTML = '<p>No practice questions available yet.</p>';
            return;
        }

        const numSets = Math.ceil(totalQ / 35);
        for (let i = 1; i <= numSets; i++) {
            let limit = (i * 35) > totalQ ? totalQ : (i * 35);
            let start = ((i - 1) * 35) + 1;
            
            let isCompleted = progressData.completedSets.includes(i);
            let isSaved = progressData.savedPractice && progressData.savedPractice.setNum === i;

            let buttonText = isSaved ? "Resume Practice" : (isCompleted ? "Practice Again" : "Start Practice");
            let badgeHtml = isCompleted ? `<span style="color: green; font-size: 14px; float: right;">✅ Completed</span>` : '';

            setsContainer.innerHTML += `
                <div class="course-card" style="${isCompleted ? 'border-left: 4px solid green;' : ''}">
                    <h3>Practice Set ${i} ${badgeHtml}</h3>
                    <p>Questions ${start} to ${limit}</p>
                    <a href="l3_quiz.html?subject=${subject}&mode=practice&set=${i}">
                        <button>${buttonText}</button>
                    </a>
                </div>
            `;
        }
    })
    .catch(err => {
        document.getElementById('practice-sets').innerHTML = '<p>Error loading practice sets.</p>';
    });
