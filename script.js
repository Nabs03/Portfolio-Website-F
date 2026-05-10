document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // --- Dark Mode Toggle (optional; only works if button exists) ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        const updateButtonIcon = () => {
            const icon = darkModeToggle.querySelector('i');
            if (!icon) return;
            if (body.classList.contains('dark-mode')) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        };

        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') body.classList.add('dark-mode');
        updateButtonIcon();

        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            updateButtonIcon();
        });
    }

    // --- Tab Navigation ---
    const navTabs = document.querySelectorAll('.nav-tab');
    const gridSections = document.querySelectorAll('.posts-grid');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetId = tab.dataset.target;

            gridSections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // --- Modal Functionality ---
    const modal = document.getElementById('image-modal');
    const modalMedia = document.getElementById('modal-media');
    const modalCaption = document.getElementById('modal-caption');
    const modalDate = document.getElementById('modal-date');
    const modalLikes = document.getElementById('modal-likes');
    const closeModalBtn = document.querySelector('.close-modal');
    const gridPosts = document.querySelectorAll('.grid-post');

    if (!modal || !modalMedia || !modalCaption) return;

    const openModal = () => {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const mediaElement = modalMedia.querySelector('video, audio');
        if (mediaElement) mediaElement.pause();
    };

    gridPosts.forEach(post => {
        post.addEventListener('click', () => {
            const imageSrc = post.getAttribute('data-image');
            const videoSrc = post.getAttribute('data-video');
            const caption = post.getAttribute('data-caption');
            const date = post.getAttribute('data-date');
            const likesEl = post.querySelector('.overlay-stats span:first-child');
            const likes = likesEl ? likesEl.textContent.trim() : '';

            modalMedia.innerHTML = '';

            if (videoSrc) {
                const videoEl = document.createElement('video');
                videoEl.src = videoSrc;
                videoEl.controls = true;
                videoEl.autoplay = true;
                modalMedia.appendChild(videoEl);
            } else if (imageSrc) {
                const imgEl = document.createElement('img');
                imgEl.src = imageSrc;
                imgEl.alt = caption || '';
                modalMedia.appendChild(imgEl);
            }

            modalCaption.textContent = caption || '';
            if (modalDate) modalDate.textContent = date || '';
            if (modalLikes) modalLikes.textContent = `${likes} likes`;

            openModal();
        });
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
    });
});
