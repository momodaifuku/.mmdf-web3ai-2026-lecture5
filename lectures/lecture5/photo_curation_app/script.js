// Photo Data Array
// In a real app, this would be fetched from the device's photo gallery
let photosData = [];

let cards = [];
let currentIndex = 0;
let keptPhotos = [];
let isChallengeActive = true;
let timer = 30;
let timerInterval;

// Analytics
let startTime = 0;
let timeSpent = 0;

// Audio Context for Sound Effects
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playKeep() {
    playTone(800, 'sine', 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.15), 50);
}

function playDelete() {
    playTone(300, 'square', 0.1);
    setTimeout(() => playTone(200, 'square', 0.15), 50);
}

function playFinish() {
    playTone(400, 'sine', 0.1);
    setTimeout(() => playTone(600, 'sine', 0.1), 100);
    setTimeout(() => playTone(800, 'sine', 0.2), 200);
}

// DOM Elements
const cardContainer = document.getElementById('card-container');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const gameOverOverlay = document.getElementById('game-over');
const galleryGrid = document.getElementById('gallery-grid');

// Navigation
const btnSwipe = document.getElementById('nav-swipe');
const btnGallery = document.getElementById('nav-gallery');
const viewSwipe = document.getElementById('swipe-view');
const viewGallery = document.getElementById('gallery-view');
const btnViewGallery = document.getElementById('btn-view-gallery');
const viewStart = document.getElementById('start-view');
const fileInput = document.getElementById('file-input');

// File Selection Logic
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    photosData = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return file.type.startsWith('image/') || ['cr2', 'cr3', 'raw', 'dng', 'arw', 'nef'].includes(ext);
    }).map((file, index) => {
        return {
            id: index + 1,
            src: URL.createObjectURL(file),
            title: file.name,
            tag: file.name.split('.').pop().toUpperCase()
        };
    });

    if (photosData.length === 0) {
        alert("Please select valid image files.");
        return;
    }

    // Hide start view, show swipe view
    viewStart.classList.remove('active');
    viewStart.classList.add('hidden');
    viewSwipe.classList.remove('hidden');
    viewSwipe.classList.add('active');
    
    initAudio(); // Initialize audio context on user interaction
    init();
});

// Initialize the App
function init() {
    // Reset state for new challenge
    cards = [];
    currentIndex = 0;
    keptPhotos = [];
    isChallengeActive = true;
    timer = 30;
    cardContainer.innerHTML = '';
    gameOverOverlay.classList.add('hidden');
    if (timerInterval) clearInterval(timerInterval);

    // Reverse array to stack them correctly (first item on top)
    const reversedData = [...photosData].reverse();
    
    reversedData.forEach((data, index) => {
        const card = createCard(data, index);
        cardContainer.appendChild(card);
        cards.push(card);
    });

    // Reverse cards array so index 0 is the top card
    cards.reverse();
    
    // Setup hammer.js for the top card
    initHammer(cards[0]);

    // Start timer
    startTimer();
}

// Bind buttons once
document.getElementById('btn-like').addEventListener('click', () => handleAction(true));
document.getElementById('btn-nope').addEventListener('click', () => handleAction(false));
document.getElementById('btn-superlike').addEventListener('click', () => handleAction(true));

// Bind keyboard arrow keys
document.addEventListener('keydown', (e) => {
    if (!isChallengeActive || currentIndex >= cards.length) return;
    if (e.key === 'ArrowRight') {
        handleAction(true);
    } else if (e.key === 'ArrowLeft') {
        handleAction(false);
    }
});

// Create Card DOM Element
function createCard(data, zIndex) {
    const el = document.createElement('div');
    el.classList.add('photo-card');
    el.style.zIndex = zIndex;
    
    el.innerHTML = `
        <img class="photo-img" src="${data.src}" alt="${data.title}" onerror="this.onerror=null; this.src='https://placehold.co/400x500/1e293b/8b5cf6?text=RAW\\\\nPreview+Not\\\\nAvailable';">
        <div class="photo-info">
            <h3>${data.title}</h3>
            <span class="tag">${data.tag}</span>
        </div>
        <div class="card-status status-keep">KEEP</div>
        <div class="card-status status-delete">DELETE</div>
    `;
    
    el.dataset.id = data.id;
    el.dataset.src = data.src;
    el.dataset.title = data.title;
    return el;
}

// Initialize Gesture recognition on a card
function initHammer(card) {
    if (!card) return;
    
    const hammer = new Hammer(card);
    
    // Allow panning in all directions
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    
    hammer.on('pan', (e) => {
        if (!isChallengeActive) return;
        
        // Move card
        const xMulti = e.deltaX * 0.03;
        const yMulti = e.deltaY / 80;
        const rotate = xMulti * yMulti;
        
        card.style.transition = 'none';
        card.style.transform = `translate(${e.deltaX}px, ${e.deltaY}px) rotate(${rotate}deg)`;
        
        // Show status based on drag distance
        const keepOpacity = Math.max(0, e.deltaX / 100);
        const deleteOpacity = Math.max(0, -e.deltaX / 100);
        
        card.querySelector('.status-keep').style.opacity = keepOpacity;
        card.querySelector('.status-keep').style.transform = `scale(${1 + keepOpacity * 0.5}) rotate(-15deg)`;
        
        card.querySelector('.status-delete').style.opacity = deleteOpacity;
        card.querySelector('.status-delete').style.transform = `scale(${1 + deleteOpacity * 0.5}) rotate(15deg)`;
    });
    
    hammer.on('panend', (e) => {
        if (!isChallengeActive) return;
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        
        // Minimum distance to trigger swipe
        const keepThreshold = 100;
        
        if (e.deltaX > keepThreshold) {
            swipeOut(card, true);
        } else if (e.deltaX < -keepThreshold) {
            swipeOut(card, false);
        } else {
            // Reset position
            card.style.transform = '';
            card.querySelector('.status-keep').style.opacity = 0;
            card.querySelector('.status-delete').style.opacity = 0;
        }
    });
}

// Button click handlers
function handleAction(isKeep) {
    if (!isChallengeActive || currentIndex >= cards.length) return;
    const currentCard = cards[currentIndex];
    
    if (isKeep) {
        currentCard.querySelector('.status-keep').style.opacity = 1;
    } else {
        currentCard.querySelector('.status-delete').style.opacity = 1;
    }
    
    swipeOut(currentCard, isKeep);
}

// Animate card out and handle logic
function swipeOut(card, isKeep) {
    const xDest = isKeep ? 1000 : -1000;
    const rotate = isKeep ? 30 : -30;
    
    card.style.transform = `translate(${xDest}px, -100px) rotate(${rotate}deg)`;
    card.style.opacity = 0;
    
    if (isKeep) {
        keptPhotos.push({
            id: card.dataset.id,
            src: card.dataset.src,
            title: card.dataset.title
        });
        playKeep();
    } else {
        playDelete();
    }
    
    currentIndex++;
    
    // Remove old card from DOM after transition
    setTimeout(() => {
        card.remove();
        
        if (currentIndex >= cards.length) {
            endChallenge();
        } else {
            // Init next card
            initHammer(cards[currentIndex]);
        }
    }, 300);
}

// Timer Logic
function startTimer() {
    updateTimerUI();
    startTime = Date.now();
    
    timerInterval = setInterval(() => {
        timer--;
        updateTimerUI();
        
        if (timer <= 0) {
            clearInterval(timerInterval);
            endChallenge();
        }
    }, 1000);
}

function updateTimerUI() {
    timerText.innerText = timer + 's';
    // Use an inline style block on the pseudoelement is tricky, so we update the parent variable or style width directly
    // Because timer-bar::after is handling width, we can set a CSS variable on timer-bar
    const pct = (timer / 30) * 100;
    
    // We didn't use a variable for after width in CSS, so we'll manipulate a style tag
    let styleEl = document.getElementById('dynamic-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-styles';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `.timer-bar::after { width: ${pct}%; }`;
}

function endChallenge() {
    isChallengeActive = false;
    clearInterval(timerInterval);
    
    timeSpent = (Date.now() - startTime) / 1000;
    playFinish();
    
    // Update Analytics UI
    document.getElementById('stat-processed').innerText = currentIndex;
    document.getElementById('stat-kept').innerText = keptPhotos.length;
    const speed = currentIndex > 0 ? (timeSpent / currentIndex).toFixed(2) : '0.00';
    document.getElementById('stat-speed').innerText = speed;
    
    gameOverOverlay.classList.remove('hidden');
    generateGallery();
}

// Gallery Generation
function generateGallery() {
    galleryGrid.innerHTML = '';
    
    if (keptPhotos.length === 0) {
        galleryGrid.innerHTML = '<p style="grid-column: span 2; text-align: center; color: var(--text-muted);">No photos kept.</p>';
        return;
    }
    
    keptPhotos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${photo.src}" alt="Kept photo" onerror="this.onerror=null; this.src='https://placehold.co/400x500/1e293b/8b5cf6?text=RAW';">`;
        galleryGrid.appendChild(item);
    });
}

// Copy Filenames Feature
const btnCopyList = document.getElementById('btn-copy-list');
if (btnCopyList) {
    btnCopyList.addEventListener('click', () => {
        if (keptPhotos.length === 0) {
            alert("No photos to copy.");
            return;
        }
        const filenames = keptPhotos.map(p => p.title).join('\\n');
        navigator.clipboard.writeText(filenames).then(() => {
            const originalHTML = btnCopyList.innerHTML;
            btnCopyList.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btnCopyList.innerHTML = originalHTML;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert("Copy failed. Please manually select and copy.");
        });
    });
}

// Navigation Logic
function switchView(viewName) {
    if (viewName === 'swipe') {
        btnSwipe.classList.add('active');
        btnGallery.classList.remove('active');
        viewSwipe.classList.add('active');
        viewSwipe.classList.remove('hidden');
        viewGallery.classList.add('hidden');
        viewGallery.classList.remove('active');
    } else {
        btnSwipe.classList.remove('active');
        btnGallery.classList.add('active');
        viewGallery.classList.add('active');
        viewGallery.classList.remove('hidden');
        viewSwipe.classList.add('hidden');
        viewSwipe.classList.remove('active');
        generateGallery();
    }
}

btnSwipe.addEventListener('click', () => switchView('swipe'));
btnGallery.addEventListener('click', () => switchView('gallery'));
btnViewGallery.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    switchView('gallery');
});


