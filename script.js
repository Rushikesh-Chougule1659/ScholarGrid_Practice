function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

// Apply saved theme automatically
window.onload = function () {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }
};

function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchCourses();
    }
}

function searchCourses() {
    const query = document.getElementById('course-search').value.toLowerCase().trim();
    const courses = Array.from(document.querySelectorAll('.course-card'));
    const container = document.querySelector('.course-list');
    
    courses.forEach(course => {
        const title = course.querySelector('h3').innerText.toLowerCase();
        const category = course.getAttribute('data-category').toLowerCase();
        const text = course.innerText.toLowerCase();
        
        let score = 0;
        if (query === '') {
            score = 1; // show all
        } else if (title === query) {
            score = 4; // exact match
        } else if (title.includes(query)) {
            score = 3; // title substring
        } else if (category.includes(query)) {
            score = 2; // category match
        } else if (text.includes(query)) {
            score = 1; // description match
        }
        
        course.dataset.score = score;
    });
    
    // Sort courses by score descending
    courses.sort((a, b) => b.dataset.score - a.dataset.score);
    
    // Append in new order and toggle display
    courses.forEach(course => {
        container.appendChild(course);
        if (course.dataset.score > 0) {
            course.style.display = 'flex';
            course.style.animation = 'none';
            course.offsetHeight; /* trigger reflow */
            course.style.animation = 'fadeInDown 0.5s ease-out';
        } else {
            course.style.display = 'none';
        }
    });
}

// ---- Progress Tracking Utilities ----
function getProgress() {
    return JSON.parse(localStorage.getItem('learning_progress')) || {};
}

function saveProgress(subject, type, value, extraData = null) {
    // type: 'mock' (highest score) or 'practice' (array of completed set numbers)
    let progress = getProgress();
    if (!progress[subject]) progress[subject] = { mockHigh: 0, completedSets: [], savedPractice: null };
    
    if (type === 'mock') {
        if (value > progress[subject].mockHigh) {
            progress[subject].mockHigh = value;
        }
    } else if (type === 'practice') {
        if (!progress[subject].completedSets.includes(value)) {
            progress[subject].completedSets.push(value);
        }
    } else if (type === 'savedPractice') {
        progress[subject].savedPractice = extraData; 
    }
    
    localStorage.setItem('learning_progress', JSON.stringify(progress));
}

function resetProgress() {
    if(confirm("Are you sure you want to completely reset your progress? This cannot be undone.")) {
        localStorage.removeItem('learning_progress');
        location.reload();
    }
}