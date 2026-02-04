// ============================================
// 💝 CUSTOMIZE YOUR VALENTINE'S WEBSITE HERE 💝
// ============================================

const CONFIG = {
    // Your Valentine's name that will appear in the title
    // Example: "Jade", "Sarah", "Mike"
    valentineName: "My Love",

    // The title that appears in the browser tab
    pageTitle: "Will You Be My Valentine?",

    // Floating emojis that appear in the background
    // Find more emojis at: https://emojipedia.org
    floatingEmojis: ["✨", "🌙", "🪐", "🛸", "💫", "⭐"],

    // 🎥 Background Video
    backgroundVideo: "", // Disabled for CSS Starfield

    // Questions and answers
    questions: {
        first: {
            text: "Do you like me?",
            yesBtn: "Yes",
            noBtn: "No",
            secretAnswer: "I don't like you, I love you! ❤️"
        },
        second: {
            text: "How much do you love me?",
            startText: "This much!",
            nextBtn: "Next ❤️"
        },
        third: {
            text: "Will you be my Valentine?",
            yesBtn: "Yes!",
            noBtn: "No"
        }
    },

    // Love letter / Message to show
    loveLetter: {
        title: "My Universe,",
        message: "You are my sun, my moon, and all my stars. In this vast infinite universe, finding you was the greatest miracle of my life. Happy Valentine's Day! 🪐❤️"
    },

    // 🎵 Music Configuration
    music: {
        enabled: true,
        autoplay: true,
        musicUrl: "https://res.cloudinary.com/dncywqfpb/video/upload/v1738399057/music_qzh0xk.mp3",
        startText: "🎵 Play Music",
        stopText: "🔇 Stop Music",
        volume: 0.5
    },

    // 🖼️ Gallery Photos
    galleryImages: [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1522673607200-1645062ac2d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    ],

    // 📅 Relationship Timeline
    timeline: [
        { date: "2023", title: "Star Collision", description: "The day our worlds collided." },
        { date: "August 2023", title: "First Orbit", description: "I was so nervous, but your smile melted the galaxy." },
        { date: "Dec 2023", title: "Space Travel", description: "Our amazing adventure to the mountains." },
        { date: "Today", title: "Valentine's Day", description: "Celebrating my love for you!" }
    ],

    // 🕵️‍♀️ Love Quiz
    quiz: {
        question: "Where did we orbit for our first date?",
        options: ["Coffee Shop", "The Park", "Movie Theater", "Fancy Restaurant"],
        correctIndex: 0,
        successMessage: "Correct! You remember! ❤️"
    },

    // 🎁 Virtual Gift
    gift: {
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60",
        message: "A cosmic bloom just for you! 💐"
    },

    // 🎨 Theme Colors
    colors: {
        backgroundStart: "#0f0c29",
        backgroundEnd: "#302b63",
        buttonBackground: "#6c5ce7",
        buttonHover: "#a29bfe",
        textColor: "#ffffff"
    }
};

// ==========================================
// 📡 LISTEN FOR BUILDER UPDATES (Real-time)
// ==========================================
window.addEventListener('message', (event) => {
    const data = event.data;
    if (data.type === 'UPDATE_CONFIG') {
        const newConfig = data.payload;

        // Merge updates safely
        if (newConfig.senderName) CONFIG.senderName = newConfig.senderName;
        if (newConfig.partnerName) CONFIG.partnerName = newConfig.partnerName;
        if (newConfig.message) CONFIG.loveLetter.message = newConfig.message;

        // Music Updates
        if (newConfig.features && Array.isArray(newConfig.features)) {
            CONFIG.music.enabled = newConfig.features.includes('feature_music');
        }
        if (newConfig.musicUrl) CONFIG.music.musicUrl = newConfig.musicUrl;

        // Gift Updates
        if (newConfig.giftUrl) CONFIG.gift.imageUrl = newConfig.giftUrl;

        // Timeline Updates
        if (newConfig.timeline && Array.isArray(newConfig.timeline)) {
            CONFIG.timeline = newConfig.timeline;
            // Live Rerender Timeline
            const timelineContainer = document.getElementById('timeline');
            if (timelineContainer && timelineContainer.offsetParent !== null) { // Only if visible
                timelineContainer.innerHTML = '';
                CONFIG.timeline.forEach((item, index) => {
                    const div = document.createElement('div');
                    div.className = 'timeline-item';
                    div.innerHTML = `
                        <div class="timeline-date">${item.date}</div>
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    `;
                    timelineContainer.appendChild(div);
                });
            }
        }

        // Quiz Updates
        if (newConfig.quiz) {
            CONFIG.quiz = newConfig.quiz;
            // Live Rerender Quiz
            const quizContainer = document.getElementById('quiz-options');
            const questionEl = document.getElementById('quiz-question');
            if (questionEl) questionEl.textContent = CONFIG.quiz.question;

            if (quizContainer && quizContainer.offsetParent !== null) {
                quizContainer.innerHTML = "";
                CONFIG.quiz.options.forEach((option, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'quiz-btn';
                    btn.textContent = option;
                    quizContainer.appendChild(btn);
                });
            }
        }

        // Gallery Updates
        if (newConfig.gallery && Array.isArray(newConfig.gallery)) {
            CONFIG.galleryImages = newConfig.gallery;
            const gallery = document.getElementById('gallery');
            if (gallery) {
                gallery.innerHTML = '';
                CONFIG.galleryImages.forEach(imgUrl => {
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = "Memory";
                    gallery.appendChild(img);
                });
            }
        }

        // Countdown Updates
        if (newConfig.countdown) {
            // Check if countdown container exists, if not create it (Simple Injection)
            let countdownContainer = document.getElementById('countdown-container');
            if (!countdownContainer) {
                countdownContainer = document.createElement('div');
                countdownContainer.id = 'countdown-container';
                countdownContainer.style.textAlign = 'center';
                countdownContainer.style.marginTop = '20px';
                countdownContainer.style.fontFamily = "'Orbitron', sans-serif";

                // Append to the paper container for better look
                const paper = document.querySelector('.paper');
                if (paper) paper.appendChild(countdownContainer);
            }

            if (newConfig.countdown.enabled) {
                countdownContainer.innerHTML = `
                    <div style="font-size:1.2rem; color:#d63031; font-weight:bold; margin-top:1rem;">Target: ${newConfig.countdown.date}</div>
                    <div style="font-size:0.9rem; opacity:0.7;">(Countdown Active)</div>
                `;
            } else {
                countdownContainer.innerHTML = '';
            }
        }

        // Trigger Live DOM Updates
        if (newConfig.partnerName) {
            document.title = `For ${CONFIG.partnerName}`;
            const letterTitle = document.getElementById('letter-title');
            if (letterTitle) letterTitle.textContent = `My Dearest ${CONFIG.partnerName},`;
        }

        const letterBody = document.getElementById('letter-body');
        if (letterBody && newConfig.message) letterBody.innerText = newConfig.message;

        const senderEl = document.getElementById('sender-name');
        if (senderEl && CONFIG.senderName) senderEl.textContent = CONFIG.senderName;

        // Trigger re-render of dynamic components
        if (typeof updateContent === 'function') updateContent();

        console.log("Config Updated via Builder:", newConfig);
    }
});
