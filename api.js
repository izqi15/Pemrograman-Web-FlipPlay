const API_URLS = [
    {
        type: "anime",
        url: "https://api.tenrai.org/v1/top/anime?limit=12"
    },
    {
        type: "manga",
        url: "https://api.tenrai.org/v1/top/manga?limit=12"
    }
];

const TIMEOUT_MS = 20000;
const MIN_LOADING_MS = 400;

const loading = document.querySelector("#loading");
const errorMessage = document.querySelector("#error-message");
const errorDetail = document.querySelector("#error-detail");
const mediaGrid = document.querySelector("#media-grid");
const searchInput = document.querySelector("#search-input");
const resultCount = document.querySelector("#result-count");
const retryButton = document.querySelector("#retry-button");
const emptyMessage = document.querySelector("#empty-message");

let allMedia = [];
let selectedCategory = "all";
let selectedAura = "all";
let currentController = null;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showLoading(active) {
    loading.classList.toggle("hidden", !active);

    if (retryButton) {
        retryButton.disabled = active;
        retryButton.textContent = active
            ? "Memuat..."
            : "Coba Lagi";
    }
}

function showError(message) {
    errorMessage.classList.remove("hidden");
    errorDetail.textContent = message;
    resultCount.textContent = "Data gagal dimuat";
}

function hideError() {
    errorMessage.classList.add("hidden");
    errorDetail.textContent = "";
}

function normalizeMedia(item, type) {
    return {
        id: `${type}-${item.mal_id}`,
        type,
        title: item.title_english || item.title || "Untitled",
        image:
            item.images?.webp?.large_image_url ||
            item.images?.jpg?.large_image_url ||
            "",
        score: item.score || 0,
        synopsis: item.synopsis || "Sinopsis belum tersedia.",
        episodes: item.episodes ?? null,
        chapters: item.chapters ?? null,
        status: item.status || "",
        genres: (item.genres || []).map(genre =>
            genre.name.toLowerCase()
        ),
        url: item.url || ""
    };
}

async function fetchWithTimeout(url, signal) {
    if (!navigator.onLine) {
        throw new Error(
            "Kamu sedang offline. Periksa koneksi internet, lalu coba lagi."
        );
    }

    const response = await fetch(url, {
        method: "GET",
        signal,
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `Server merespons HTTP ${response.status}.`
        );
    }

    return response.json();
}

async function fetchMedia() {
    if (currentController) {
        currentController.abort();
    }

    const controller = new AbortController();
    currentController = controller;

    const startedAt = Date.now();
    let timedOut = false;

    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, TIMEOUT_MS);

    showLoading(true);
    hideError();

    mediaGrid.innerHTML = "";
    emptyMessage.classList.add("hidden");
    resultCount.textContent = "Sedang mengambil data...";

    try {
        const results = [];

        for (let i = 0; i < API_URLS.length; i++) {
            if (currentController !== controller) return;

            const source = API_URLS[i];

            const response = await fetchWithTimeout(
                source.url,
                controller.signal
            );

            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    results.push(
                        normalizeMedia(item, source.type)
                    );
                });
            }

            if (i < API_URLS.length - 1) {
                await new Promise((resolve, reject) => {
                    const delay = setTimeout(resolve, 400);

                    controller.signal.addEventListener(
                        "abort",
                        () => {
                            clearTimeout(delay);
                            reject(
                                new DOMException(
                                    "Request dibatalkan",
                                    "AbortError"
                                )
                            );
                        },
                        { once: true }
                    );
                });
            }
        }

        if (currentController !== controller) return;

        if (results.length === 0) {
            throw new Error(
                "API tidak mengembalikan data media."
            );
        }

        allMedia = results;
        renderMedia();

    } catch (error) {
        if (currentController !== controller) return;

        if (timedOut) {
            showError(
                "Pengambilan data melewati batas waktu 20 detik. Periksa koneksi internet, lalu coba lagi."
            );
        } else if (error.name === "AbortError") {
            showError(
                "Permintaan dibatalkan. Silakan coba lagi."
            );
        } else {
            showError(
                `${error.message || "Gagal mengambil data."} Coba lagi setelah koneksi pulih.`
            );
        }

        console.error("Fetch error:", error);

    } finally {
        clearTimeout(timeoutId);

        if (currentController === controller) {
            const elapsed = Date.now() - startedAt;
            const remaining = MIN_LOADING_MS - elapsed;

            if (remaining > 0) {
                await new Promise(resolve =>
                    setTimeout(resolve, remaining)
                );
            }

            currentController = null;
            showLoading(false);
        }
    }
}

function matchesAura(media) {
    const genres = media.genres;

    if (selectedAura === "energy") {
        return genres.some(genre =>
            [
                "action",
                "adventure",
                "sports",
                "supernatural"
            ].includes(genre)
        );
    }

    if (selectedAura === "melancholy") {
        return genres.some(genre =>
            [
                "drama",
                "romance",
                "slice of life"
            ].includes(genre)
        );
    }

    if (selectedAura === "binge") {
        if (media.type === "anime") {
            return (
                media.episodes !== null &&
                media.episodes <= 24
            );
        }

        return (
            media.chapters !== null &&
            media.chapters <= 50
        );
    }

    return true;
}

function renderMedia() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filteredMedia = allMedia.filter(media => {
        const matchesSearch =
            media.title.toLowerCase().includes(keyword);

        const matchesCategory =
            selectedCategory === "all" ||
            media.type === selectedCategory ||
            (
                selectedCategory === "drama" &&
                media.genres.includes("drama")
            );

        return (
            matchesSearch &&
            matchesCategory &&
            matchesAura(media)
        );
    });

    mediaGrid.innerHTML = filteredMedia.map(media => `
        <article class="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-blue-500/50">
            <a href="${escapeHTML(media.url)}"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Lihat ${escapeHTML(media.title)}">
                ${
                    media.image
                        ? `<img
                            src="${escapeHTML(media.image)}"
                            alt="${escapeHTML(media.title)}"
                            loading="lazy"
                            class="h-72 w-full object-cover"
                        >`
                        : `<div class="flex h-72 items-center justify-center bg-slate-800 text-slate-400">Poster tidak tersedia</div>`
                }
            </a>

            <div class="p-5">
                <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase text-blue-400">
                        ${escapeHTML(media.type)}
                    </span>

                    <span class="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                        ★ ${media.score ? escapeHTML(media.score) : "N/A"}
                    </span>
                </div>

                <h3 class="mb-3 text-lg font-bold text-white">
                    ${escapeHTML(media.title)}
                </h3>

                <p class="mb-4 text-sm leading-6 text-slate-400">
                    ${escapeHTML(media.synopsis)}
                </p>

                <p class="text-xs text-slate-500">
                    ${
                        media.type === "anime"
                            ? `Episode: ${media.episodes ?? "Tidak diketahui"}`
                            : `Chapter: ${media.chapters ?? "Tidak diketahui"}`
                    }
                </p>
            </div>
        </article>
    `).join("");

    resultCount.textContent =
        `${filteredMedia.length} dari ${allMedia.length} media`;

    emptyMessage.classList.toggle(
        "hidden",
        filteredMedia.length !== 0
    );
}

searchInput.addEventListener("input", renderMedia);

document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        document.querySelectorAll(".category-btn").forEach(item => {
            item.classList.remove("bg-blue-600");
            item.classList.add(
                "border",
                "border-white/10",
                "bg-slate-900"
            );
        });

        button.classList.add("bg-blue-600");
        button.classList.remove(
            "border",
            "border-white/10",
            "bg-slate-900"
        );

        renderMedia();
    });
});

document.querySelectorAll(".aura-btn").forEach(button => {
    button.addEventListener("click", () => {
        selectedAura = button.dataset.aura;

        document.querySelectorAll(".aura-btn").forEach(item => {
            item.classList.remove(
                "border-blue-500",
                "bg-blue-500/10",
                "text-blue-300"
            );

            item.classList.add(
                "border-white/10",
                "bg-slate-900"
            );
        });

        button.classList.add(
            "border-blue-500",
            "bg-blue-500/10",
            "text-blue-300"
        );

        button.classList.remove(
            "border-white/10",
            "bg-slate-900"
        );

        renderMedia();
    });
});

retryButton.addEventListener("click", fetchMedia);

window.addEventListener("offline", () => {
    if (currentController) {
        currentController.abort();
    }

    showError(
        "Koneksi internet terputus. Sambungkan kembali internet, lalu tekan Coba Lagi."
    );

    showLoading(false);
});

window.addEventListener("online", () => {
    if (errorMessage.classList.contains("hidden")) {
        return;
    }

    errorDetail.textContent =
        "Koneksi kembali tersedia. Tekan Coba Lagi untuk mengambil data.";
});

fetchMedia();