const menuToggle = document.querySelector("#menu-toggle");
const sidebar = document.querySelector("#sidebar");
const sidebarClose = document.querySelector("#sidebar-close");
const sidebarOverlay = document.querySelector("#sidebar-overlay");

function openSidebar() {
    if (!sidebar || !sidebarOverlay || !menuToggle) return;

    sidebar.classList.remove("-translate-x-full");
    sidebarOverlay.classList.remove("hidden");
    sidebarOverlay.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("overflow-hidden");

    sidebarClose?.focus();
}

function closeSidebar() {
    if (!sidebar || !sidebarOverlay || !menuToggle) return;

    sidebar.classList.add("-translate-x-full");
    sidebarOverlay.classList.add("hidden");
    sidebarOverlay.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("overflow-hidden");
}

if (menuToggle && sidebar && sidebarClose && sidebarOverlay) {
    menuToggle.addEventListener("click", openSidebar);
    sidebarClose.addEventListener("click", closeSidebar);
    sidebarOverlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeSidebar();
    });
}

const navLinks = document.querySelectorAll(
    "#sidebar nav a[href^='#']"
);

const sections = document.querySelectorAll(
    "#home, #explore, #about, #contact"
);

function setActiveLink(activeLink) {
    navLinks.forEach((link) => {
        link.classList.remove(
            "bg-blue-600/15",
            "text-blue-400",
            "font-medium"
        );

        link.classList.add("text-slate-300");
        link.removeAttribute("aria-current");
    });

    if (activeLink) {
        activeLink.classList.remove("text-slate-300");

        activeLink.classList.add(
            "bg-blue-600/15",
            "text-blue-400",
            "font-medium"
        );

        activeLink.setAttribute("aria-current", "location");
    }
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            setActiveLink(link);
        }

        closeSidebar();
    });
});

if ("IntersectionObserver" in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const visibleSections = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                    (a, b) =>
                        b.intersectionRatio - a.intersectionRatio
                );

            if (visibleSections.length === 0) return;

            const sectionId = visibleSections[0].target.id;

            const activeLink = document.querySelector(
                `#sidebar nav a[href="#${sectionId}"]`
            );

            if (activeLink) {
                setActiveLink(activeLink);
            }
        },
        {
            root: null,
            rootMargin: "-20% 0px -55% 0px",
            threshold: [0, 0.1, 0.25, 0.5]
        }
    );

    sections.forEach((section) => {
        sectionObserver.observe(section);
    });
}

const notification = document.querySelector("#notification");
const notificationIcon = document.querySelector("#notification-icon");
const notificationSymbol = document.querySelector("#notification-symbol");
const notificationTitle = document.querySelector("#notification-title");
const notificationMessage = document.querySelector("#notification-message");
const notificationClose = document.querySelector("#notification-close");

let notificationTimer;

function showNotification(type, title, message) {
    if (
        !notification ||
        !notificationIcon ||
        !notificationSymbol ||
        !notificationTitle ||
        !notificationMessage
    ) {
        alert(`${title}\n\n${message}`);
        return;
    }

    const styles = {
        success: {
            symbol: "✓",
            icon: "bg-emerald-500/10 text-emerald-400",
            border: "border-emerald-500/30"
        },
        error: {
            symbol: "!",
            icon: "bg-red-500/10 text-red-400",
            border: "border-red-500/30"
        }
    };

    const style = styles[type] || styles.error;

    notificationSymbol.textContent = style.symbol;
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;

    notificationIcon.className =
        `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`;

    notification.classList.remove(
        "border-emerald-500/30",
        "border-red-500/30",
        "translate-x-[120%]",
        "opacity-0"
    );

    notification.classList.add(
        style.border,
        "translate-x-0",
        "opacity-100"
    );

    clearTimeout(notificationTimer);

    notificationTimer = setTimeout(hideNotification, 3500);
}

function hideNotification() {
    if (!notification) return;

    notification.classList.remove(
        "translate-x-0",
        "opacity-100"
    );

    notification.classList.add(
        "translate-x-[120%]",
        "opacity-0"
    );
}

notificationClose?.addEventListener("click", hideNotification);

const contactForm = document.querySelector("#contact form");

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name =
            document.querySelector("#name")?.value.trim() || "";

        const email =
            document.querySelector("#email")?.value.trim() || "";

        const message =
            document.querySelector("#message")?.value.trim() || "";

        if (!name || !email || !message) {
            showNotification(
                "error",
                "Form belum lengkap",
                "Isi nama, email, dan pesan terlebih dahulu."
            );
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showNotification(
                "error",
                "Email tidak valid",
                "Periksa kembali format alamat email kamu."
            );
            return;
        }

        showNotification(
            "success",
            "Validasi berhasil!",
            "Semua data sudah terisi dengan benar."
        );
        contactForm.reset();
    });
}