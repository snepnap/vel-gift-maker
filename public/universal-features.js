/**
 * Universal Features Injector
 * This script is intended to be included in all template index.html files.
 * It listens for specific configuration data (Gallery, Timeline, Music, Gift)
 * and dynamically injects the standardized HTML/CSS into the template.
 */

(function () {
    // Create Universal Container if not exists
    let container = document.getElementById('universal-features');
    if (!container) {
        container = document.createElement('div');
        container.id = 'universal-features';
        document.body.appendChild(container);
    }

    // Inject CSS
    const css = `
        #universal-features {
            font-family: inherit;
            color: inherit;
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
            position: relative;
            z-index: 100;
        }
        
        /* TIMELINE */
        .u-timeline {
            margin: 60px 0;
            position: relative;
            padding-left: 20px;
            border-left: 2px solid rgba(255,255,255,0.3);
        }
        .u-timeline-item {
            margin-bottom: 30px;
            position: relative;
            padding-left: 20px;
        }
        .u-timeline-dot {
            width: 12px;
            height: 12px;
            background: var(--primary, #ff4d6d);
            border-radius: 50%;
            position: absolute;
            left: -27px;
            top: 5px;
            box-shadow: 0 0 10px var(--primary, #ff4d6d);
        }
        .u-timeline-date {
            font-size: 0.9em;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        .u-timeline-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        /* GALLERY */
        .u-gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 60px 0;
        }
        .u-gallery-img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        .u-gallery-img:hover {
            transform: scale(1.05);
        }
        
        /* MUSIC PLAYER */
        .u-music-player {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            padding: 10px 15px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .u-music-icon {
            animation: spin 3s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        /* GIFT BOX */
        .u-gift-section {
            text-align: center;
            margin: 60px 0;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            border: 1px dashed rgba(255,255,255,0.3);
        }
        
        /* TITLES */
        .u-section-title {
            text-align: center;
            font-size: 1.8em;
            margin-bottom: 30px;
            opacity: 0.9;
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Render Function
    window.renderUniversalFeatures = function (config) {
        let html = '';

        // TIMELINE
        if (config.timeline && config.timeline.length > 0) {
            html += `<div class="u-section-title">Our Story</div><div class="u-timeline">`;
            config.timeline.forEach(t => {
                html += `
                    <div class="u-timeline-item">
                        <div class="u-timeline-dot"></div>
                        <div class="u-timeline-date">${t.date}</div>
                        <div class="u-timeline-title">${t.title}</div>
                        <div>${t.description}</div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // GALLERY
        if (config.gallery && config.gallery.length > 0) {
            html += `<div class="u-section-title">Memories</div><div class="u-gallery-grid">`;
            config.gallery.forEach(url => {
                if (url) {
                    html += `<img src="${url}" class="u-gallery-img" />`;
                }
            });
            html += `</div>`;
        }

        // GIFT
        if (config.giftUrl) {
            html += `
                <div class="u-section-title">A Special Gift</div>
                <div class="u-gift-section">
                    <img src="${config.giftUrl}" style="max-width: 100%; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
                </div>
             `;
        }

        // MUSIC (Audio Element)
        if (config.musicUrl) {
            const existingAudio = document.getElementById('u-audio-player');
            if (existingAudio) existingAudio.remove();

            const musicDiv = document.createElement('div');
            musicDiv.id = 'u-audio-player';
            musicDiv.className = 'u-music-player';
            musicDiv.innerHTML = `
                <div class="u-music-icon">🎵</div>
                <div style="font-size: 0.8em; margin-right: 10px;">Playing our song...</div>
                <audio controls autoplay loop style="height: 20px; max-width: 150px;">
                    <source src="${config.musicUrl}" type="audio/mpeg">
                </audio>
            `;
            document.body.appendChild(musicDiv);

            // Auto-play attempt
            const audio = musicDiv.querySelector('audio');
            if (audio) {
                audio.volume = 0.5;
                audio.play().catch(e => console.log("Autoplay blocked", e));
            }
        }

        container.innerHTML = html;
    };

    // Listen for updates (hooking into existing listeners if possible, or adding new one)
    window.addEventListener('message', (e) => {
        if (e.data.type === 'UPDATE_CONFIG') {
            window.renderUniversalFeatures(e.data.payload);
        }
    });

    // Initial Render Check
    if (window.VALENTINE_CONFIG) {
        window.renderUniversalFeatures(window.VALENTINE_CONFIG);
    }

})();
