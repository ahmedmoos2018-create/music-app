const audioPlayer = document.getElementById("audioPlayer");

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");

const usernameInput = document.getElementById("usernameInput");
const welcomeUser = document.getElementById("welcomeUser");

const searchInput = document.getElementById("searchInput");
const songsList = document.getElementById("songsList");
const favoritesList = document.getElementById("favoritesList");

const playerImage = document.getElementById("playerImage");
const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const playButton = document.getElementById("playButton");

const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const volume = document.getElementById("volume");

let songs = [];
let currentIndex = -1;
let searchTimer = null;

let favorites = JSON.parse(
    localStorage.getItem("andomiFavorites") || "[]"
);


/* =========================
   LOGIN
========================= */

function enterApp() {

    const name = usernameInput.value.trim();

    if (!name) {
        usernameInput.focus();
        return;
    }

    localStorage.setItem("andomiUser", name);

    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");

    welcomeUser.textContent = `Welcome, ${name}`;

    loadMusic("");
}


/* =========================
   START
========================= */

window.addEventListener("DOMContentLoaded", () => {

    const savedUser = localStorage.getItem("andomiUser");

    if (savedUser) {

        loginPage.classList.add("hidden");
        appPage.classList.remove("hidden");

        welcomeUser.textContent =
            `Welcome, ${savedUser}`;

        loadMusic("");

    }

});


/* =========================
   LOAD MUSIC FROM INTERNET
========================= */

async function loadMusic(query = "") {

    songsList.innerHTML = `
        <div class="empty-state">
            Searching music...
        </div>
    `;

    try {

        const url = query
            ? `/api/music?q=${encodeURIComponent(query)}`
            : `/api/music`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Music server error");
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        songs = Array.isArray(data)
            ? data
            : [];

        currentIndex = -1;

        renderSongs(songs);

    } catch (error) {

        console.error(error);

        songsList.innerHTML = `
            <div class="empty-state">
                Music search failed. Check the server.
            </div>
        `;
    }

}


/* =========================
   SEARCH
========================= */

function searchMusic() {

    const query =
        searchInput.value.trim();

    clearTimeout(searchTimer);

    if (!query) {

        loadMusic("");

        return;
    }

    searchTimer = setTimeout(() => {

        loadMusic(query);

    }, 500);

}


/* =========================
   CATEGORY
========================= */

function searchCategory(category) {

    searchInput.value = category;

    loadMusic(category);

    showHome();

}


/* =========================
   RENDER SONGS
========================= */

function renderSongs(list) {

    if (!list.length) {

        songsList.innerHTML = `
            <div class="empty-state">
                No music found.
            </div>
        `;

        return;
    }

    songsList.innerHTML = "";

    list.forEach((song, index) => {

        const card =
            document.createElement("div");

        card.className = "song-card";

        const image =
            song.image ||
            "https://placehold.co/100x100/111111/ffffff?text=A";

        card.innerHTML = `

            <img
                src="${escapeHTML(image)}"
                alt="Album"
            >

            <div class="song-info">

                <strong>
                    ${escapeHTML(
                        song.title ||
                        "Unknown Song"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        song.artist ||
                        "Unknown Artist"
                    )}
                </span>

            </div>

            <div class="song-actions">

                <button
                    onclick="playSong(${index})"
                >
                    Play
                </button>

                <button
                    onclick="toggleFavorite(${index})"
                >
                    ${
                        isFavorite(song)
                        ? "Saved"
                        : "Save"
                    }
                </button>

            </div>
        `;

        songsList.appendChild(card);

    });

}


/* =========================
   PLAY
========================= */

function playSong(index) {

    const song = songs[index];

    if (!song) {
        return;
    }

    if (!song.audio) {

        alert(
            "This track has no playable stream."
        );

        return;
    }

    currentIndex = index;

    playerTitle.textContent =
        song.title || "Unknown Song";

    playerArtist.textContent =
        song.artist || "Unknown Artist";

    playerImage.src =
        song.image ||
        "https://placehold.co/100x100/111111/ffffff?text=A";

    audioPlayer.src = song.audio;

    audioPlayer.load();

    audioPlayer.play()
        .then(() => {

            playButton.textContent =
                "Pause";

        })
        .catch(error => {

            console.error(
                "Playback error:",
                error
            );

            playButton.textContent =
                "Play";

        });

}


/* =========================
   PLAY / PAUSE
========================= */

function togglePlay() {

    if (!audioPlayer.src) {
        return;
    }

    if (audioPlayer.paused) {

        audioPlayer.play()
            .then(() => {

                playButton.textContent =
                    "Pause";

            })
            .catch(error => {

                console.error(error);

            });

    } else {

        audioPlayer.pause();

        playButton.textContent =
            "Play";

    }

}


/* =========================
   NEXT
========================= */

function nextSong() {

    if (!songs.length) {
        return;
    }

    let nextIndex =
        currentIndex + 1;

    if (nextIndex >= songs.length) {
        nextIndex = 0;
    }

    playSong(nextIndex);

}


/* =========================
   PREVIOUS
========================= */

function previousSong() {

    if (!songs.length) {
        return;
    }

    let previousIndex =
        currentIndex - 1;

    if (previousIndex < 0) {
        previousIndex =
            songs.length - 1;
    }

    playSong(previousIndex);

}


/* =========================
   AUTO NEXT
========================= */

audioPlayer.addEventListener(
    "ended",
    () => {
        nextSong();
    }
);


/* =========================
   AUDIO EVENTS
========================= */

audioPlayer.addEventListener(
    "loadedmetadata",
    () => {

        if (
            Number.isFinite(
                audioPlayer.duration
            )
        ) {

            duration.textContent =
                formatTime(
                    audioPlayer.duration
                );

        }

    }
);


audioPlayer.addEventListener(
    "timeupdate",
    () => {

        if (!audioPlayer.duration) {
            return;
        }

        const percent =
            (
                audioPlayer.currentTime /
                audioPlayer.duration
            ) * 100;

        progress.value = percent;

        currentTime.textContent =
            formatTime(
                audioPlayer.currentTime
            );

    }
);


audioPlayer.addEventListener(
    "play",
    () => {

        playButton.textContent =
            "Pause";

    }
);


audioPlayer.addEventListener(
    "pause",
    () => {

        playButton.textContent =
            "Play";

    }
);


/* =========================
   PROGRESS
========================= */

progress.addEventListener(
    "input",
    () => {

        if (!audioPlayer.duration) {
            return;
        }

        audioPlayer.currentTime =
            (
                Number(progress.value) /
                100
            ) *
            audioPlayer.duration;

    }
);


/* =========================
   VOLUME
========================= */

volume.addEventListener(
    "input",
    () => {

        audioPlayer.volume =
            Number(volume.value);

    }
);

audioPlayer.volume = 1;


/* =========================
   FAVORITES
========================= */

function isFavorite(song) {

    return favorites.some(item =>

        item.title === song.title &&
        item.artist === song.artist

    );

}


function toggleFavorite(index) {

    const song = songs[index];

    if (!song) {
        return;
    }

    const existing =
        favorites.findIndex(item =>

            item.title === song.title &&
            item.artist === song.artist

        );

    if (existing !== -1) {

        favorites.splice(
            existing,
            1
        );

    } else {

        favorites.push(song);

    }

    localStorage.setItem(
        "andomiFavorites",
        JSON.stringify(favorites)
    );

    renderSongs(songs);
    renderFavorites();

}


/* =========================
   FAVORITES PAGE
========================= */

function renderFavorites() {

    if (!favorites.length) {

        favoritesList.innerHTML = `
            <div class="empty-state">
                You haven't saved any songs yet.
            </div>
        `;

        return;
    }

    favoritesList.innerHTML = "";

    favorites.forEach(song => {

        const card =
            document.createElement("div");

        card.className = "song-card";

        const image =
            song.image ||
            "https://placehold.co/100x100/111111/ffffff?text=A";

        card.innerHTML = `

            <img
                src="${escapeHTML(image)}"
                alt="Album"
            >

            <div class="song-info">

                <strong>
                    ${escapeHTML(
                        song.title ||
                        "Unknown Song"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        song.artist ||
                        "Unknown Artist"
                    )}
                </span>

            </div>

            <div class="song-actions">

                <button
                    onclick="playFavorite(
                        '${escapeHTML(
                            song.id || ""
                        )}'
                    )"
                >
                    Play
                </button>

            </div>
        `;

        favoritesList.appendChild(card);

    });

}


function playFavorite(id) {

    const index =
        songs.findIndex(
            song => String(song.id) === String(id)
        );

    if (index !== -1) {
        playSong(index);
        return;
    }

    const favorite =
        favorites.find(
            song =>
                String(song.id) === String(id)
        );

    if (!favorite) {
        return;
    }

    songs.push(favorite);

    playSong(
        songs.length - 1
    );

}


/* =========================
   PAGES
========================= */

function showHome() {

    document
        .getElementById("homeSection")
        .classList.remove("hidden");

    document
        .getElementById("favoritesSection")
        .classList.add("hidden");

    document
        .getElementById("categoriesSection")
        .classList.add("hidden");

}


function showFavorites() {

    document
        .getElementById("homeSection")
        .classList.add("hidden");

    document
        .getElementById("favoritesSection")
        .classList.remove("hidden");

    document
        .getElementById("categoriesSection")
        .classList.add("hidden");

    renderFavorites();

}


function showCategories() {

    document
        .getElementById("homeSection")
        .classList.add("hidden");

    document
        .getElementById("favoritesSection")
        .classList.add("hidden");

    document
        .getElementById("categoriesSection")
        .classList.remove("hidden");

}


/* =========================
   TIME
========================= */

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const secondsPart =
        Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");

    return `${minutes}:${secondsPart}`;

}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}