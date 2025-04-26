let typingSpeed = 50;
let currentRiddle = null;
let typingTimeout;
let isTypingHint = false;
let isTyping = false;
let correctAnswers = 0;
const MAX_ANSWERS = 5;

const riddleElement = document.getElementById('riddle');
const answerInput = document.getElementById('answerInput');
const hintElement = document.getElementById('hint');
const submitBtn = document.getElementById('submitBtn');
const progressBar = document.getElementById('progressBar');
const successSound = document.getElementById('successSound');
const typeSound = document.getElementById('typeSound');
const levelUpSound = document.getElementById('levelUpSound');
const errorSound = document.getElementById('errorSound');

let deferredPrompt;
const installButton = document.getElementById('installButton');

// Initialize sound settings
typeSound.currentTime = 5;
typeSound.loop = true;

async function fetchRiddle() {
    const response = await fetch("/riddle");
    currentRiddle = await response.json();
}

function playTypeSound() {
    if (typeSound.paused) {
        typeSound.currentTime = 5;
        typeSound.play();
    }
}

function updateDisplayText(text) {
    riddleElement.innerHTML = text + " <span class='blink'></span>";
}

function typeWriter(fullText, i = 0, existingText = "", targetElement = null) {
    const target = targetElement || riddleElement;
    
    if (i === 0) { 
        isTyping = true;
        if (targetElement) {
            targetElement.textContent = ''; // Clear only the hint container
        }
    } 

    if (i < fullText.length) {
        let delay = typingSpeed;
        const currentChar = fullText[i];

        if (currentChar === ',' || currentChar === '.') {
            delay = 300;
        }

        const newText = existingText + currentChar;
        if (!targetElement) {
            updateDisplayText(newText);
        } else {
            targetElement.textContent = newText;
        }
        playTypeSound();

        typingTimeout = setTimeout(() => typeWriter(fullText, i + 1, newText, targetElement), delay);
    } else {
        typeSound.pause();
        typeSound.currentTime = 5;
        isTyping = false;
        isTypingHint = false;
    }
}

function updateProgressBar() {
    const percentage = (correctAnswers / MAX_ANSWERS) * 100;
    progressBar.style.width = `${percentage}%`;
}

async function showCompletionMessage() {
    levelUpSound.play();
    answerInput.style.display = "none";
    submitBtn.style.display = "none";
    hintElement.style.display = "none";
    
    // Clear the riddle box
    riddleElement.innerHTML = "";
    
    // Create completion message
    const completionHTML = `
        <div class="completion-message">
            <h1>FINISH!</h1>
            <p>Refresh to play again</p>
        </div>
    `;
    
    // Insert the completion message
    riddleElement.innerHTML = completionHTML;
    
    // Add click handler for refresh
    document.querySelector('.completion-message p').addEventListener('click', () => {
        location.reload();
    });
}

async function loadRiddle() {
    if (correctAnswers >= MAX_ANSWERS) return;
    
    clearTimeout(typingTimeout);
    riddleElement.innerHTML = "";
    answerInput.value = "";
    hintElement.style.display = "none";
    isTypingHint = false;

    await fetchRiddle();
    typeWriter(currentRiddle.question);
    
    setTimeout(() => {
        if (!isTyping && correctAnswers < MAX_ANSWERS) {
            hintElement.style.display = "block";
        }
    }, 30000);
}

function checkAnswer() {
    if (isTyping || correctAnswers >= MAX_ANSWERS) return;

    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = currentRiddle.answer.toLowerCase();

    if (userAnswer === correctAnswer) {
        correctAnswers++;
        updateProgressBar();
        successSound.currentTime = 0;
        successSound.play();
        riddleElement.classList.add('success-animation');
        setTimeout(() => {
            riddleElement.classList.remove('success-animation');
            if (correctAnswers < MAX_ANSWERS) {
                loadRiddle();
            } else {
                showCompletionMessage();
            }
        }, 800);
    } else {
        // Force reflow to restart animation
        answerInput.classList.remove('shake');
        submitBtn.classList.remove('shake');
        void answerInput.offsetWidth; // Trigger reflow
        void submitBtn.offsetWidth; // Trigger reflow
        
        // Add shake class
        answerInput.classList.add('shake');
        submitBtn.classList.add('shake');
        
        // Remove after animation completes
        setTimeout(() => {
            answerInput.classList.remove('shake');
            submitBtn.classList.remove('shake');
        }, 500);
    }
}

// Event Listeners
answerInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

submitBtn.addEventListener("click", checkAnswer);

hintElement.addEventListener("click", () => {
    if (isTypingHint || isTyping || correctAnswers >= MAX_ANSWERS) return;

    isTypingHint = true;
    hintElement.style.display = "none";

    // Get the current riddle text (without any existing hint)
    const riddleText = riddleElement.textContent.replace(/\n-+[\s\S]*/, '').trim();
    
    // Create a container for the existing riddle text
    const riddleTextContainer = document.createElement('div');
    riddleTextContainer.textContent = riddleText;
    
    // Create the separator line
    const separator = document.createElement('div');
    separator.className = 'hint-separator';
    separator.textContent = '-------';
    
    // Create container for the hint text
    const hintContainer = document.createElement('div');
    hintContainer.className = 'hint-text';
    
    // Clear and rebuild the riddle box
    riddleElement.innerHTML = '';
    riddleElement.appendChild(riddleTextContainer);
    riddleElement.appendChild(separator);
    riddleElement.appendChild(hintContainer);
    
    // Add blinking cursor back
    const cursor = document.createElement('span');
    cursor.className = 'blink';
    riddleElement.appendChild(cursor);
    
    // Type out the hint
    typeWriter(currentRiddle.hint, 0, "", hintContainer);
});

// ===== PWA INSTALL HANDLERS ===== //
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Only show on mobile
    if (window.innerWidth <= 768) {
      installButton.style.display = 'flex';
    }
  
    window.addEventListener('appinstalled', () => {
      installButton.style.display = 'none';
      deferredPrompt = null;
    });
  });
  
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      installButton.style.display = 'none';
      deferredPrompt = null;
    }
  });
  
  // Handle screen resizing
  function checkScreenSize() {
    if (window.innerWidth <= 768 && deferredPrompt) {
      installButton.style.display = 'flex';
    } else {
      installButton.style.display = 'none';
    }
  }
  
  window.addEventListener('resize', checkScreenSize);
  // ===== END PWA INSTALL CODE ===== //
  
  // Initialize screen check
  checkScreenSize();

// Start game
loadRiddle();