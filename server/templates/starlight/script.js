/* Starlight - Script with Star Canvas */

document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initGallery();
    initTimeline();
    initQuiz();
    initNavigation();
    initMusic();
    initGift();
    initFinale();
});

// Starfield Canvas
function initStarfield() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random(),
                speed: Math.random() * 0.02 + 0.01
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.opacity += star.speed;
            if (star.opacity > 1 || star.opacity < 0) star.speed *= -1;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.opacity)})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    animate();
}

// Gallery
function initGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery || !CONFIG.galleryImages) return;
    gallery.innerHTML = '';
    CONFIG.galleryImages.forEach((url, i) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Memory ${i + 1}`;
        img.loading = 'lazy';
        gallery.appendChild(img);
    });
}

// Timeline
function initTimeline() {
    const timeline = document.getElementById('timeline');
    if (!timeline || !CONFIG.timeline) return;
    timeline.innerHTML = '';
    CONFIG.timeline.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-date">${item.date}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        `;
        timeline.appendChild(div);
    });
}

// Quiz
function initQuiz() {
    const container = document.getElementById('quiz-options');
    const questionEl = document.getElementById('quiz-question');
    if (!container || !CONFIG.quiz) return;
    if (questionEl) questionEl.textContent = CONFIG.quiz.question;
    container.innerHTML = '';
    CONFIG.quiz.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.textContent = option;
        btn.onclick = () => handleQuizAnswer(btn, i === CONFIG.quiz.correctIndex);
        container.appendChild(btn);
    });
}

function handleQuizAnswer(btn, isCorrect) {
    const allBtns = document.querySelectorAll('.quiz-btn');
    allBtns.forEach(b => b.disabled = true);
    if (isCorrect) {
        btn.classList.add('correct');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#7c4dff', '#b388ff', '#ffd54f'] });
        document.getElementById('next-to-gift')?.classList.remove('hidden');
    } else {
        btn.classList.add('wrong');
        setTimeout(() => { allBtns.forEach(b => { b.disabled = false; b.classList.remove('wrong'); }); }, 1000);
    }
}

// Navigation
function initNavigation() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            document.getElementById('hero').style.display = 'none';
            document.getElementById('gallery-section').classList.remove('hidden-section');
        });
    }
    const navButtons = [
        { btn: 'next-to-letter', hide: 'gallery-section', show: 'letter-section' },
        { btn: 'next-to-timeline', hide: 'letter-section', show: 'timeline-section' },
        { btn: 'next-to-quiz', hide: 'timeline-section', show: 'quiz-section' },
        { btn: 'next-to-gift', hide: 'quiz-section', show: 'gift-section' },
        { btn: 'next-to-finale', hide: 'gift-section', show: 'finale-section' }
    ];
    navButtons.forEach(({ btn, hide, show }) => {
        const button = document.getElementById(btn);
        if (button) {
            button.addEventListener('click', () => {
                document.getElementById(hide)?.classList.add('hidden-section');
                document.getElementById(show)?.classList.remove('hidden-section');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    });
}

// Music
function initMusic() {
    const audio = document.getElementById('bgMusic');
    const toggle = document.getElementById('musicToggle');
    if (!audio || !toggle) return;
    if (CONFIG.music?.musicUrl) { audio.src = CONFIG.music.musicUrl; audio.volume = CONFIG.music.volume || 0.5; }
    toggle.addEventListener('click', () => {
        if (audio.paused) { audio.play(); toggle.textContent = '🔊'; }
        else { audio.pause(); toggle.textContent = '🎵'; }
    });
}

// Gift
function initGift() {
    const giftBox = document.getElementById('gift-box');
    const giftContent = document.getElementById('gift-content');
    const giftImage = document.getElementById('gift-image');
    const giftMessage = document.getElementById('gift-message');
    const nextBtn = document.getElementById('next-to-finale');
    if (!giftBox) return;
    giftBox.addEventListener('click', () => {
        giftBox.style.display = 'none';
        if (giftContent) {
            giftContent.classList.remove('hidden');
            if (giftImage && CONFIG.gift?.imageUrl) giftImage.src = CONFIG.gift.imageUrl;
            if (giftMessage && CONFIG.gift?.message) giftMessage.textContent = CONFIG.gift.message;
        }
        if (nextBtn) nextBtn.classList.remove('hidden');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#7c4dff', '#b388ff', '#ffd54f'] });
    });
}

// Finale
function initFinale() {
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const successMsg = document.getElementById('success-message');
    const buttons = document.querySelector('.finale-buttons');
    const question = document.querySelector('.finale-content > h1');
    const stars = document.querySelector('.finale-stars');

    if (yesBtn) {
        yesBtn.addEventListener('click', () => {
            if (buttons) buttons.style.display = 'none';
            if (question) question.style.display = 'none';
            if (stars) stars.style.display = 'none';
            if (successMsg) successMsg.classList.remove('hidden');
            const colors = ['#7c4dff', '#b388ff', '#ffd54f'];
            const end = Date.now() + 4000;
            (function frame() {
                confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
                confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
                if (Date.now() < end) requestAnimationFrame(frame);
            })();
        });
    }

    if (noBtn) {
        noBtn.addEventListener('mouseover', function () {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 100;
            this.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
}

// Update from Builder
function updateContent() {
    const letterTitle = document.getElementById('letter-title');
    const letterBody = document.getElementById('letter-body');
    const senderName = document.getElementById('sender-name');
    if (letterTitle && CONFIG.partnerName) letterTitle.textContent = `My Dearest ${CONFIG.partnerName},`;
    if (letterBody && CONFIG.loveLetter?.message) letterBody.textContent = CONFIG.loveLetter.message;
    if (senderName && CONFIG.senderName) senderName.textContent = CONFIG.senderName;
    initGallery();
    initTimeline();
    initQuiz();
}

updateContent();
