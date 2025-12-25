// public/js/app.js - FINAL SÜRÜM

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();

    if (document.getElementById('saved-playlists')) await loadSavedPlaylists();
    if (document.getElementById('stats-content')) await loadStats();

    const generateBtn = document.getElementById('generate-button');
    const cameraBtn = document.getElementById('camera-button');
    const goBackBtn = document.getElementById('go-back-button');
    const captureBtn = document.getElementById('capture-mood-button');

    if (generateBtn) generateBtn.addEventListener('click', generateMelody);
    
    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            initCamera();
            document.getElementById('prompt-input-wrapper').style.display = 'none';
            document.getElementById('camera-feed-container').style.display = 'flex';
        });
    }

    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
            stopCamera();
            document.getElementById('camera-feed-container').style.display = 'none';
            document.getElementById('prompt-input-wrapper').style.display = 'flex';
        });
    }
    
    if (captureBtn) captureBtn.addEventListener('click', captureMood);

    // --- HELP & SUPPORT MODAL ---
    const modal = document.getElementById("support-modal");
    const helpBtn = document.getElementById("help-btn");
    const closeBtn = document.querySelector(".close-modal");
    const supportForm = document.getElementById("support-form");

    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.style.display = "flex";
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = "none";
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = "none";
    });

    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = document.getElementById("support-msg").value;
            const email = document.getElementById("user-email").value;
            const sendBtn = document.querySelector('.modal-send-btn');
            
            if(message.length < 5) {
                alert("Please describe your issue in more detail.");
                return;
            }

            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            sendBtn.disabled = true;

            try {
                const res = await fetch('/api/send-support', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ userEmail: email, message: message })
                });

                const data = await res.json();

                if(data.success) {
                    sendBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
                    sendBtn.style.backgroundColor = '#1ed760';
                    setTimeout(() => {
                        modal.style.display = "none";
                        document.getElementById("support-msg").value = ""; 
                        sendBtn.innerText = "Send Message";
                        sendBtn.style.backgroundColor = "";
                        sendBtn.disabled = false;
                    }, 1500);
                } else {
                    alert("Error sending email: " + data.error);
                    sendBtn.innerText = "Try Again";
                    sendBtn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert("Server connection failed.");
                sendBtn.innerText = "Try Again";
                sendBtn.disabled = false;
            }
        });
    }
});

// --- API FONKSİYONLARI ---

async function loadUserProfile() {
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        
        document.querySelectorAll('#user-name').forEach(el => el.innerText = data.username || 'User');
        const emailInput = document.getElementById('user-email');
        if (emailInput && data.email) {
            emailInput.value = data.email;
        } else if (emailInput) {
            emailInput.value = "Email not authorized";
        }
        
        if (data.image) {
            document.querySelectorAll('#user-avatar').forEach(img => {
                img.src = data.image;
                img.style.display = 'block';
            });
            document.querySelectorAll('#user-avatar-placeholder').forEach(el => el.style.display = 'none');
        }
    } catch(e) { console.error(e); }
}

async function loadSavedPlaylists() {
    const list = document.getElementById('saved-playlists');
    if (!list) return;

    list.innerHTML = '<li><span style="color:#b3b3b3; font-size:12px;">Fetching from Spotify...</span></li>';

    try {
        const res = await fetch('/api/my-playlists');
        const data = await res.json();
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<li><span style="color:#777; font-size:12px;">No playlists found on Spotify.</span></li>';
            return;
        }

        data.forEach(pl => {
            const imgUrl = pl.images && pl.images.length > 0 ? pl.images[0].url : null;
            
            // CSS sınıflarını (playlist-cover) kullanıyoruz
            const imgHtml = imgUrl 
                ? `<img src="${imgUrl}" class="playlist-cover">`
                : `<div class="playlist-cover placeholder"><i class="fas fa-music"></i></div>`;

            const li = document.createElement('li');
            li.innerHTML = `
                <a href="${pl.external_urls.spotify}" target="_blank" class="playlist-item">
                    ${imgHtml}
                    <div class="playlist-info">
                        <span class="playlist-name">${pl.name}</span>
                        <span class="playlist-count">${pl.tracks.total} Tracks</span>
                    </div>
                </a>`;
            
            list.appendChild(li);
        });
    } catch(e) { 
        console.error(e); 
        list.innerHTML = '<li><span style="color:red; font-size:12px;">Connection failed.</span></li>';
    }
}

async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        if (data.error) {
            document.getElementById('loading-stats').innerHTML = `<p style="color:red">${data.error}</p>`;
            return;
        }

        const tracksList = document.getElementById('tracks-list');
        if (tracksList) {
            tracksList.innerHTML = '';
            data.tracks.forEach((t, i) => {
                const img = t.album.images[0]?.url || '';
                tracksList.innerHTML += `
                    <a href="${t.external_urls.spotify}" target="_blank" class="list-item">
                        <div class="rank">${i + 1}</div>
                        <img src="${img}" alt="art">
                        <div class="info"><span class="title">${t.name}</span><span class="artist">${t.artists[0].name}</span></div>
                    </a>`;
            });
        }

        const artistsList = document.getElementById('artists-list');
        if (artistsList) {
            artistsList.innerHTML = '';
            data.artists.forEach((a, i) => {
                const img = a.images[0]?.url || '';
                artistsList.innerHTML += `
                    <a href="${a.external_urls.spotify}" target="_blank" class="list-item">
                        <div class="rank">${i + 1}</div>
                        <img src="${img}" alt="artist" style="border-radius:50%;">
                        <div class="info"><span class="title">${a.name}</span></div>
                    </a>`;
            });
        }

        document.getElementById('loading-stats').style.display = 'none';
        document.getElementById('stats-content').style.display = 'flex';

    } catch(e) { document.getElementById('loading-stats').innerHTML = `<p style="color:red">Error loading stats.</p>`; }
}

async function generateMelody() {
    const input = document.getElementById('mood-prompt');
    const resultDiv = document.getElementById('playlist-results');
    const btn = document.getElementById('generate-button');
    
    if (input.value.length < 3) { alert("Please write something!"); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    resultDiv.innerHTML = '<div class="placeholder-card"><p>AI is analyzing your taste...</p></div>';

    try {
        const res = await fetch('/api/generate-melody', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ feeling_text: input.value })
        });
        const data = await res.json();

        if (data.success) {
            resultDiv.innerHTML = `
                <div class="placeholder-card" style="border-left: 5px solid #1DB954;">
                    <h3>✅ ${data.mood}</h3>
                    <p>Playlist created on Spotify!</p>
                    <a href="${data.playlist_url}" target="_blank" style="color: #1DB954; font-weight: bold; text-decoration: none; font-size: 16px;">
                        <i class="fab fa-spotify"></i> Open in Spotify
                    </a>
                </div>`;
            setTimeout(loadSavedPlaylists, 2000);
        } else { resultDiv.innerHTML = `<p style="color:red">Error: ${data.error}</p>`; }
    } catch (e) { resultDiv.innerHTML = `<p style="color:red">Connection error.</p>`; } 
    finally { btn.disabled = false; btn.innerHTML = 'GENERATE MY MELODY'; }
}

let stream;
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('video-feed').srcObject = stream;
    } catch(e) { alert("Camera permission denied"); }
}
function stopCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}
function captureMood() {
    const input = document.getElementById('mood-prompt');
    const moods = ["I feel happy and energetic!", "I feel sad today...", "I need motivation for gym!", "I want to relax and chill."];
    input.value = moods[Math.floor(Math.random() * moods.length)] + " (AI Camera)";
    stopCamera();
    document.getElementById('camera-feed-container').style.display = 'none';
    document.getElementById('prompt-input-wrapper').style.display = 'flex';
}