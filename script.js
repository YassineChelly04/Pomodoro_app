// Configuration
const TIMER_CONFIG = {
    pomodoro: 25 * 60, // 25 minutes in seconds
    'short-break': 5 * 60, // 5 minutes in seconds
    'long-break': 15 * 60, // 15 minutes in seconds
};

// App state
let currentMode = 'pomodoro';
let timeRemaining = TIMER_CONFIG[currentMode];
let timerRunning = false;
let timerInterval = null;
let lastTimestamp = 0;
let pomodoroCount = 0;

// DOM elements
const timerDisplay = document.getElementById('timer');
const modeButtons = document.querySelectorAll('.mode-btn');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const pomodoroCountDisplay = document.getElementById('pomodoro-count');

// Initialize timer display
updateTimerDisplay();

// Event listeners
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!timerRunning) {
            setActiveMode(button.id);
        }
    });
});

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Functions
function setActiveMode(mode) {
    currentMode = mode;
    timeRemaining = TIMER_CONFIG[mode];
    
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(mode).classList.add('active');
    updateTimerDisplay();
}

function startTimer() {
    if (!timerRunning) {
        timerRunning = true;
        lastTimestamp = Date.now();
        requestAnimationFrame(updateTimer);
    }
}

function pauseTimer() {
    timerRunning = false;
    cancelAnimationFrame(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timeRemaining = TIMER_CONFIG[currentMode];
    updateTimerDisplay();
}

function updateTimer() {
    if (!timerRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = Math.floor((currentTime - lastTimestamp) / 1000);
    
    if (deltaTime >= 1) {
        timeRemaining -= deltaTime;
        lastTimestamp = currentTime;
        
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            completeTimer();
            return;
        }
        
        updateTimerDisplay();
    }
    
    timerInterval = requestAnimationFrame(updateTimer);
}

function completeTimer() {
    timerRunning = false;
    playNotification(); // Notify user that the session is complete
    
    // Switch mode based on current mode
    if (currentMode === 'pomodoro') {
        pomodoroCount++;
        pomodoroCountDisplay.textContent = pomodoroCount;
        
        // Auto-switch to long break after every 3rd pomodoro
        if (pomodoroCount % 3 === 0) {
            setActiveMode('long-break');
        } else {
            setActiveMode('short-break');
        }
    } else {
        // After any break, go back to pomodoro
        setActiveMode('pomodoro');
    }
    
    // Play a transition sound when switching modes
    playTransitionSound();
    
    // Begin timer for next session after a short delay
    setTimeout(() => {
        startTimer();
    }, 300); // Small delay for better user experience
}

// Function to play a different sound for transitions between sessions
function playTransitionSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sound characteristics for transition
    oscillator.type = 'sine';
    oscillator.frequency.value = 600; // Lower pitch than notification sound
    gainNode.gain.value = 0.3;
    
    // Create a more pleasant transition sound with frequency sweep
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(900, audioContext.currentTime + 0.2);
    
    oscillator.start();
    
    // Stop after 300ms
    setTimeout(() => {
        oscillator.stop();
        audioContext.close();
    }, 300);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update page title for better UX
    document.title = `${timerDisplay.textContent} - Pomodoro Timer`;
}

function playNotification() {
    // Create audio context only when needed (better performance)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    
    // Stop after 500ms
    setTimeout(() => {
        oscillator.stop();
        audioContext.close();
    }, 500);
}
//---------------------//
// Function to handle automatic mode switching
function autoSwitchMode() {
    if (currentMode === 'pomodoro') {
        pomodoroCount++;
        pomodoroCountDisplay.textContent = pomodoroCount;

        // Play notification sound
        playNotification();

        // Auto-switch to long break after every 3rd pomodoro
        if (pomodoroCount % 3 === 0) {
            setActiveMode('long-break');
        } else {
            setActiveMode('short-break');
        }
        startTimer(); // Automatically start the break timer
    } else {
        // After any break, go back to pomodoro
        setActiveMode('pomodoro');
        startTimer(); // Automatically start the pomodoro timer
    }
}
//---------------------//

// Settings functionality
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsBtn = document.getElementById('save-settings');
const pomodoroDurationInput = document.getElementById('pomodoro-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');

// Toggle settings panel visibility
settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
});

// Load saved settings on page load
loadSettings();

// Save settings when save button is clicked
saveSettingsBtn.addEventListener('click', saveSettings);

// Function to load settings from localStorage
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings'));
    
    if (savedSettings) {
        // Update input fields with saved values
        pomodoroDurationInput.value = savedSettings.pomodoro / 60;
        shortBreakDurationInput.value = savedSettings['short-break'] / 60;
        longBreakDurationInput.value = savedSettings['long-break'] / 60;
        
        // Update timer configuration
        TIMER_CONFIG.pomodoro = savedSettings.pomodoro;
        TIMER_CONFIG['short-break'] = savedSettings['short-break'];
        TIMER_CONFIG['long-break'] = savedSettings['long-break'];
        
        // Update current timer if not running
        if (!timerRunning) {
            timeRemaining = TIMER_CONFIG[currentMode];
            updateTimerDisplay();
        }
    }
}

// Function to save settings to localStorage
function saveSettings() {
    // Get values from inputs (convert to seconds)
    const pomodoroDuration = parseInt(pomodoroDurationInput.value) * 60;
    const shortBreakDuration = parseInt(shortBreakDurationInput.value) * 60;
    const longBreakDuration = parseInt(longBreakDurationInput.value) * 60;
    
    // Validate inputs
    if (isNaN(pomodoroDuration) || isNaN(shortBreakDuration) || isNaN(longBreakDuration)) {
        alert('Please enter valid numbers for all durations.');
        return;
    }
    
    // Update timer configuration
    TIMER_CONFIG.pomodoro = pomodoroDuration;
    TIMER_CONFIG['short-break'] = shortBreakDuration;
    TIMER_CONFIG['long-break'] = longBreakDuration;
    
    // Save to localStorage
    localStorage.setItem('pomodoroSettings', JSON.stringify(TIMER_CONFIG));
    
    // Update current timer if not running
    if (!timerRunning) {
        timeRemaining = TIMER_CONFIG[currentMode];
        updateTimerDisplay();
    }
    
    // Hide settings panel
    settingsPanel.classList.remove('active');
}

// Task Management Functionality
const taskManagerToggle = document.getElementById('task-manager-toggle');
const taskManager = document.getElementById('task-manager');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const currentTaskDisplay = document.getElementById('current-task');

// Task state
let tasks = [];
let currentTask = null;

// Load tasks from localStorage
loadTasks();

// Event listeners for task management
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Function to add a new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') return;
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    
    // Clear input field
    taskInput.value = '';
    taskInput.focus();
}

// Function to delete a task
function deleteTask(taskId) {
    // Remove from current task if it's the current one
    if (currentTask && currentTask.id === taskId) {
        currentTask = null;
        updateCurrentTaskDisplay();
    }
    
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

// Function to toggle task completion status
function toggleTaskComplete(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
}

// Function to set current task for the pomodoro
function setCurrentTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    
    if (task) {
        currentTask = task;
        updateCurrentTaskDisplay();
    }
}

// Function to update the current task display
function updateCurrentTaskDisplay() {
    if (currentTask) {
        currentTaskDisplay.textContent = currentTask.text;
    } else {
        currentTaskDisplay.textContent = 'No task selected';
    }
}

// Function to render all tasks in the UI
function renderTasks() {
    // Clear the task list
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        // Show empty state message
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-tasks';
        emptyMessage.textContent = 'No tasks yet. Add some tasks to get started!';
        taskList.appendChild(emptyMessage);
        return;
    }
    
    // Add tasks to the list
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = task.completed ? 'task-item completed' : 'task-item';
        taskItem.dataset.id = task.id;
        
        // Task checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        
        // Task text
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        // Task actions container
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        // Focus button
        const focusBtn = document.createElement('button');
        focusBtn.className = 'task-btn focus-btn';
        focusBtn.textContent = 'Focus';
        focusBtn.addEventListener('click', () => setCurrentTask(task.id));
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-btn delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        // Append elements
        taskActions.appendChild(focusBtn);
        taskActions.appendChild(deleteBtn);
        
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskText);
        taskItem.appendChild(taskActions);
        
        taskList.appendChild(taskItem);
    });
}

// Function to save tasks to localStorage
function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    localStorage.setItem('pomodoroCurrentTask', currentTask ? JSON.stringify(currentTask) : null);
}

// Function to load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    const savedCurrentTask = localStorage.getItem('pomodoroCurrentTask');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    if (savedCurrentTask && savedCurrentTask !== 'null') {
        currentTask = JSON.parse(savedCurrentTask);
    }
    
    renderTasks();
    updateCurrentTaskDisplay();
}

// Task manager toggle functionality
taskManagerToggle.addEventListener('click', () => {
    taskManager.classList.toggle('active');
});

// Analytics & Productivity Tracking
let sessionData = {
    sessions: [],
    interruptions: 0
};

// DOM elements for analytics
const analyticsToggle = document.getElementById('analytics-toggle');
const analyticsPanel = document.getElementById('analytics-panel');
const totalFocusTimeElement = document.getElementById('total-focus-time');
const dailyAverageElement = document.getElementById('daily-average');
const completionRateElement = document.getElementById('completion-rate');
const totalSessionsElement = document.getElementById('total-sessions');
const avgSessionTimeElement = document.getElementById('avg-session-time');
const interruptionCountElement = document.getElementById('interruption-count');
const taskTimeChartElement = document.getElementById('task-time-chart');

// Date range selector buttons
const todayStatsBtn = document.getElementById('today-stats');
const weekStatsBtn = document.getElementById('week-stats');
const monthStatsBtn = document.getElementById('month-stats');
const dateRangeButtons = [todayStatsBtn, weekStatsBtn, monthStatsBtn];

// Current date range for analytics
let currentDateRange = 'today';

// Store original function references
const originalCompleteTimer = completeTimer;
const originalPauseTimer = pauseTimer;

// Load session data from localStorage
loadSessionData();

// Event listeners for date range buttons
dateRangeButtons.forEach(button => {
    button.addEventListener('click', () => {
        dateRangeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        if (button.id === 'today-stats') currentDateRange = 'today';
        else if (button.id === 'week-stats') currentDateRange = 'week';
        else if (button.id === 'month-stats') currentDateRange = 'month';
        
        updateAnalytics();
    });
});

// Event listener for analytics toggle button
analyticsToggle.addEventListener('click', () => {
    const isVisible = analyticsPanel.style.display === 'block';
    analyticsPanel.style.display = isVisible ? 'none' : 'block';
    analyticsToggle.textContent = isVisible ? 'Show Productivity Analytics' : 'Hide Productivity Analytics';
});

// Override completeTimer with analytics functionality
completeTimer = function() {
    // Record session data
    const sessionEndTime = new Date();
    const sessionStartTime = new Date(sessionEndTime - (TIMER_CONFIG[currentMode] - timeRemaining) * 1000);
    
    const sessionRecord = {
        id: Date.now(),
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        duration: TIMER_CONFIG[currentMode] - timeRemaining,
        mode: currentMode,
        taskId: currentTask ? currentTask.id : null,
        completed: true
    };
    
    sessionData.sessions.push(sessionRecord);
    saveSessionData();
    
    // Call the original function
    originalCompleteTimer();
    
    // Update analytics
    updateAnalytics();
};

// Override pauseTimer with analytics functionality
pauseTimer = function() {
    if (timerRunning && currentMode === 'pomodoro') {
        sessionData.interruptions++;
        saveSessionData();
    }
    
    // Call the original function
    originalPauseTimer();
    
    // Update analytics
    updateAnalytics();
};

function loadSessionData() {
    const savedData = localStorage.getItem('pomodoroSessionData');
    
    if (savedData) {
        sessionData = JSON.parse(savedData);
        
        // Convert string dates to Date objects
        sessionData.sessions.forEach(session => {
            session.startTime = new Date(session.startTime);
            session.endTime = new Date(session.endTime);
        });
    }
    
    updateAnalytics();
}

function saveSessionData() {
    localStorage.setItem('pomodoroSessionData', JSON.stringify(sessionData));
}

function getFilteredSessions() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (currentDateRange === 'today') {
        return sessionData.sessions.filter(session => 
            session.endTime >= todayStart);
    } 
    else if (currentDateRange === 'week') {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        return sessionData.sessions.filter(session => 
            session.endTime >= weekStart);
    } 
    else if (currentDateRange === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return sessionData.sessions.filter(session => 
            session.endTime >= monthStart);
    }
    
    return sessionData.sessions;
}

function updateAnalytics() {
    const filteredSessions = getFilteredSessions();
    const pomodoroSessions = filteredSessions.filter(session => session.mode === 'pomodoro');
    
    // Total focus time (in hours)
    const totalFocusSeconds = pomodoroSessions.reduce((total, session) => total + session.duration, 0);
    const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
    totalFocusTimeElement.textContent = `${totalFocusHours} hrs`;
    
    // Daily average (in minutes)
    let dailyAverage = 0;
    if (currentDateRange === 'today') {
        dailyAverage = Math.round(totalFocusSeconds / 60);
    } else {
        const uniqueDays = new Set();
        pomodoroSessions.forEach(session => {
            const dateStr = session.endTime.toISOString().split('T')[0];
            uniqueDays.add(dateStr);
        });
        
        if (uniqueDays.size > 0) {
            dailyAverage = Math.round((totalFocusSeconds / 60) / uniqueDays.size);
        }
    }
    dailyAverageElement.textContent = `${dailyAverage} min`;
    
    // Completion rate
    const completedSessions = pomodoroSessions.length;
    const completionRate = pomodoroCount > 0 ? Math.round((completedSessions / pomodoroCount) * 100) : 0;
    completionRateElement.textContent = `${completionRate}%`;
    
    // Completed sessions
    totalSessionsElement.textContent = completedSessions;
    
    // Average session length
    const avgSessionMinutes = completedSessions > 0 ? 
        Math.round((totalFocusSeconds / completedSessions) / 60) : 0;
    avgSessionTimeElement.textContent = `${avgSessionMinutes} min`;
    
    // Interruptions
    interruptionCountElement.textContent = sessionData.interruptions;
    
    // Update chart
    updateTaskDistributionChart(filteredSessions);
}

function loadChartJsIfNeeded() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve(window.Chart);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js';
        script.onload = () => resolve(window.Chart);
        script.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.head.appendChild(script);
    });
}

async function updateTaskDistributionChart(filteredSessions) {
    taskTimeChartElement.innerHTML = '';
    
    const pomodoroSessions = filteredSessions.filter(session => session.mode === 'pomodoro');
    if (pomodoroSessions.length === 0) {
        const placeholder = document.createElement('p');
        placeholder.className = 'chart-placeholder';
        placeholder.textContent = 'Complete tasks to see your distribution';
        taskTimeChartElement.appendChild(placeholder);
        return;
    }
    
    // Group sessions by task
    const taskTimeMap = new Map();
    
    pomodoroSessions.forEach(session => {
        const taskId = session.taskId;
        if (!taskId) return;
        
        if (!taskTimeMap.has(taskId)) {
            const task = tasks.find(t => t.id === taskId);
            taskTimeMap.set(taskId, {
                id: taskId,
                text: task ? task.text : 'Unknown Task',
                totalTime: 0
            });
        }
        
        taskTimeMap.get(taskId).totalTime += session.duration;
    });
    
    // Get top 5 tasks by time spent
    const taskTimeData = Array.from(taskTimeMap.values())
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 5);
    
    const chartCanvas = document.createElement('canvas');
    taskTimeChartElement.appendChild(chartCanvas);
    
    try {
        const Chart = await loadChartJsIfNeeded();
        
        const labels = taskTimeData.map(task => 
            task.text.length > 15 ? task.text.substring(0, 15) + '...' : task.text
        );
        
        const data = taskTimeData.map(task => Math.round(task.totalTime / 60));
        
        new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Minutes Spent',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
        const placeholder = document.createElement('p');
        placeholder.className = 'chart-placeholder';
        placeholder.textContent = 'Could not load chart library';
        taskTimeChartElement.appendChild(placeholder);
    }
}
/*--------------------------------------------------------*/


// Rewards & Gamification System
const rewardsToggle = document.getElementById('rewards-toggle');
const rewardsPanel = document.getElementById('rewards-panel');
let achievements = [];

// Define available achievements
const AVAILABLE_ACHIEVEMENTS = [
    {
        id: 'focus_beginner',
        name: 'Focus Beginner',
        description: 'Complete 5 Pomodoros',
        target: 5,
        metric: 'pomodoros',
        unlocked: false,
        progress: 0
    },
    {
        id: 'focus_apprentice',
        name: 'Focus Apprentice',
        description: 'Complete 25 Pomodoros',
        target: 25,
        metric: 'pomodoros',
        unlocked: false,
        progress: 0
    },
    {
        id: 'time_master',
        name: 'Time Master',
        description: 'Accumulate 1 hour of focus time',
        target: 60,
        metric: 'minutes',
        unlocked: false,
        progress: 0
    },
    {
        id: 'consistency_king',
        name: 'Consistency King',
        description: 'Complete Pomodoros for 5 days in a row',
        target: 5,
        metric: 'streak_days',
        unlocked: false,
        progress: 0
    }
];

// Initialize achievements
function initAchievements() {
    const savedAchievements = localStorage.getItem('pomodoroAchievements');
    
    if (savedAchievements) {
        achievements = JSON.parse(savedAchievements);
    } else {
        achievements = JSON.parse(JSON.stringify(AVAILABLE_ACHIEVEMENTS));
        saveAchievements();
    }
    
    updateAchievementsUI();
}

// Save achievements to localStorage
function saveAchievements() {
    localStorage.setItem('pomodoroAchievements', JSON.stringify(achievements));
}

// Update progress for a specific metric
function updateAchievementProgress(metric, value = 1, absolute = false) {
    let achievementsUpdated = false;
    
    achievements.forEach(achievement => {
        if (achievement.metric === metric && !achievement.unlocked) {
            if (absolute) {
                achievement.progress = value;
            } else {
                achievement.progress += value;
            }
            
            if (achievement.progress >= achievement.target) {
                achievement.unlocked = true;
                achievementsUpdated = true;
                showAchievementNotification(achievement);
            }
        }
    });
    
    if (achievementsUpdated) {
        saveAchievements();
        updateAchievementsUI();
    }
}

// Show notification when an achievement is unlocked
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <h3>Achievement Unlocked!</h3>
        <p>${achievement.name}</p>
        <p>${achievement.description}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Update the UI to reflect current achievement status
function updateAchievementsUI() {
    const rewardsList = document.querySelector('.rewards-list');
    const upcomingRewards = document.querySelector('.upcoming-rewards ul');
    
    if (!rewardsList || !upcomingRewards) return;
    
    rewardsList.innerHTML = '';
    upcomingRewards.innerHTML = '';
    
    // Sort achievements by progress percentage
    achievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return (b.progress / b.target) - (a.progress / a.target);
    });
    
    // Add achievements to UI
    achievements.forEach(achievement => {
        const progressPercentage = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
        
        const achievementItem = document.createElement('div');
        achievementItem.className = 'reward-item';
        achievementItem.innerHTML = `
            <div class="reward-header">
                <h3>${achievement.name}</h3>
                <span class="reward-status ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    ${achievement.unlocked ? 'Unlocked!' : 'Locked'}
                </span>
            </div>
            <p class="reward-description">${achievement.description}</p>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progressPercentage}%;"></div>
                <span class="progress-text">${achievement.progress}/${achievement.target}</span>
            </div>
        `;
        
        rewardsList.appendChild(achievementItem);
    });
}

// Track streak days
function updateStreakDays() {
    const today = new Date().toISOString().split('T')[0];
    const lastSessionDate = localStorage.getItem('lastPomodoroSessionDate');
    const streakCount = parseInt(localStorage.getItem('pomodoroStreakDays') || '0');
    
    if (lastSessionDate === today) return;
    
    if (lastSessionDate) {
        const lastDate = new Date(lastSessionDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        if (lastDate >= yesterday) {
            localStorage.setItem('pomodoroStreakDays', streakCount + 1);
            updateAchievementProgress('streak_days', streakCount + 1, true);
        } else {
            localStorage.setItem('pomodoroStreakDays', 1);
            updateAchievementProgress('streak_days', 1, true);
        }
    } else {
        localStorage.setItem('pomodoroStreakDays', 1);
        updateAchievementProgress('streak_days', 1, true);
    }
    
    localStorage.setItem('lastPomodoroSessionDate', today);
}

// Event listeners
rewardsToggle.addEventListener('click', () => {
    rewardsPanel.classList.toggle('active');
    updateAchievementsUI();
});

// Override completeTimer to update achievements
const originalCompleteTimerWithAnalytics = completeTimer;
completeTimer = function() {
    originalCompleteTimerWithAnalytics();
    
    if (currentMode === 'pomodoro') {
        // Update pomodoro count achievement
        updateAchievementProgress('pomodoros');
        
        // Update minutes achievement
        const minutes = Math.floor(TIMER_CONFIG.pomodoro / 60);
        updateAchievementProgress('minutes', minutes);
        
        // Check streak days
        updateStreakDays();
    }
};

// Initialize achievements on page load
initAchievements();

/*----------------------------------------*/
