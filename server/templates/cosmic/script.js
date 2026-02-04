/* Valentine Template - Ultra Interactive Script */

document.addEventListener('DOMContentLoaded', () => {
    initCursorTrail();
    initProgressBar();
    initParticles();
    initFloatingHearts();
    initGallery();
    initLightbox();
    initTimeline();
    initQuiz();
    initNavigation();
    initMusic();
    initGift();
    initFinale();
    initMagneticButtons();
    initScrollReveal();
});

// Custom Cursor Trail
function initCursorTrail() {
    const cursor = document.getElementById('cursor-trail');
    if (!cursor || window.innerWidth < 768) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.left = cursorX - 10 + 'px';
        cursor.style.top = cursorY - 10 + 'px';
        requestAnimationFrame(animate);
    }
    animate();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('button, a, img, .envelope-wrapper, .gift-box-wrapper');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// Scroll Progress Bar
function initProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Particle System
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(244, 63, 94, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 80; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// Floating Hearts Background
function initFloatingHearts() {
    const container = document.getElementById('hearts');
    if (!container) return;

    const hearts = ['💕', '💖', '💗', '💓', '💝', '✨', '🌸', '💐', '🥰'];

    function createHeart() {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (18 + Math.random() * 12) + 's';
        heart.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
        container.appendChild(heart);
        setTimeout(() => heart.remove(), 30000);
    }

    // Initial hearts
    for (let i = 0; i < 15; i++) {
        setTimeout(createHeart, i * 500);
    }

    // Continuous creation
    setInterval(createHeart, 2500);
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
        img.style.animationDelay = (i * 0.1) + 's';
        img.addEventListener('click', () => openLightbox(url));
        gallery.appendChild(img);
    });
}

// Lightbox
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    if (!lightbox) return;

    closeBtn?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
        setTimeout(() => lightbox.classList.add('visible'), 10);
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('visible');
        setTimeout(() => lightbox.classList.add('hidden'), 300);
    }
}

// Timeline
function initTimeline() {
    const timeline = document.getElementById('timeline');
    if (!timeline || !CONFIG.timeline) return;

    timeline.innerHTML = '';
    CONFIG.timeline.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.style.animationDelay = (i * 0.15) + 's';
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
    const feedback = document.getElementById('quiz-feedback');
    if (!container || !CONFIG.quiz) return;

    if (questionEl) questionEl.textContent = CONFIG.quiz.question;

    container.innerHTML = '';
    CONFIG.quiz.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.textContent = option;
        btn.onclick = () => handleQuizAnswer(btn, i === CONFIG.quiz.correctIndex, feedback);
        container.appendChild(btn);
    });
}

function handleQuizAnswer(btn, isCorrect, feedback) {
    const allBtns = document.querySelectorAll('.quiz-btn');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.add('correct');
        if (feedback) {
            feedback.textContent = '🎉 Correct! You know me so well!';
            feedback.classList.remove('hidden');
        }
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#f43f5e', '#ec4899', '#a855f7'] });
        document.getElementById('next-to-gift')?.classList.remove('hidden');
    } else {
        btn.classList.add('wrong');
        if (feedback) {
            feedback.textContent = '❌ Not quite... try again!';
            feedback.classList.remove('hidden');
        }
        setTimeout(() => {
            allBtns.forEach(b => {
                b.disabled = false;
                b.classList.remove('wrong');
            });
            feedback?.classList.add('hidden');
        }, 1200);
    }
}

// Navigation
function initNavigation() {
    const envelope = document.getElementById('envelope');
    if (envelope) {
        envelope.addEventListener('click', () => {
            document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const navButtons = [
        { btn: 'next-to-letter', target: 'letter-section' },
        { btn: 'next-to-timeline', target: 'timeline-section' },
        { btn: 'next-to-quiz', target: 'quiz-section' },
        { btn: 'next-to-gift', target: 'gift-section' },
        { btn: 'next-to-finale', target: 'finale-section' }
    ];

    navButtons.forEach(({ btn, target }) => {
        const button = document.getElementById(btn);
        if (button) {
            button.addEventListener('click', () => {
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
}

// Music
function initMusic() {
    const audio = document.getElementById('bgMusic');
    const toggle = document.getElementById('musicToggle');

    if (!audio || !toggle) return;

    if (CONFIG.music?.musicUrl) {
        audio.src = CONFIG.music.musicUrl;
        audio.volume = CONFIG.music.volume || 0.5;
    }

    toggle.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            toggle.textContent = '🔊';
            toggle.classList.add('playing');
        } else {
            audio.pause();
            toggle.textContent = '🎵';
            toggle.classList.remove('playing');
        }
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
        giftBox.style.transform = 'scale(0)';
        giftBox.style.opacity = '0';

        setTimeout(() => {
            giftBox.style.display = 'none';

            if (giftContent) {
                giftContent.classList.remove('hidden');

                if (giftImage && CONFIG.gift?.imageUrl) {
                    giftImage.src = CONFIG.gift.imageUrl;
                }
                if (giftMessage && CONFIG.gift?.message) {
                    giftMessage.textContent = CONFIG.gift.message;
                }
            }

            if (nextBtn) nextBtn.classList.remove('hidden');
        }, 300);

        // Sparkle confetti
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#fbbf24', '#f43f5e', '#a855f7']
        });
    });
}

// Finale
function initFinale() {
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const successMsg = document.getElementById('success-message');
    const buttons = document.querySelector('.finale-buttons');
    const question = document.querySelector('.finale-question');

    if (yesBtn) {
        yesBtn.addEventListener('click', () => {
            if (buttons) buttons.style.display = 'none';
            if (question) question.style.display = 'none';
            if (successMsg) successMsg.classList.remove('hidden');

            // Epic confetti celebration
            const duration = 5000;
            const end = Date.now() + duration;

            const colors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24'];

            (function frame() {
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: colors
                });
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: colors
                });

                if (Date.now() < end) requestAnimationFrame(frame);
            })();

            // Center burst
            setTimeout(() => {
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: colors
                });
            }, 500);
        });
    }

    if (noBtn) {
        let escapeCount = 0;
        noBtn.addEventListener('mouseover', function () {
            escapeCount++;
            const maxMove = Math.min(150, escapeCount * 30);
            const x = (Math.random() - 0.5) * maxMove * 2;
            const y = (Math.random() - 0.5) * maxMove * 2;
            this.style.transform = `translate(${x}px, ${y}px)`;

            if (escapeCount > 5) {
                this.textContent = "Can't escape! 😏";
            }
        });
    }
}

// Magnetic Buttons
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.magnetic-btn');

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// Scroll Reveal
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-header, .letter-card, .timeline-item').forEach(el => {
        observer.observe(el);
    });
}

// Update content from Builder
function updateContent() {
    const letterTitle = document.getElementById('letter-title');
    const letterBody = document.getElementById('letter-body');
    const senderName = document.getElementById('sender-name');

    if (letterTitle && CONFIG.partnerName) {
        letterTitle.textContent = `My Dearest ${CONFIG.partnerName},`;
    }
    if (letterBody && CONFIG.loveLetter?.message) {
        letterBody.textContent = CONFIG.loveLetter.message;
    }
    if (senderName && CONFIG.senderName) {
        senderName.textContent = CONFIG.senderName;
    }

    // Re-render dynamic components
    initGallery();
    initTimeline();
    initQuiz();
}

// Call on load
updateContent();
