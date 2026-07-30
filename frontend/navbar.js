// frontend/navbar.js
// Shared navigation bar component for all pages

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Navbar] Initializing navbar component...');
    renderNavbar();
    initNavbarSearch();
    initMobileMenuToggle();
    updateWatchlistBadge();
});

function renderNavbar() {
    const header = document.querySelector('.header') || document.querySelector('header');
    if (!header) {
        console.error('[Navbar] Header element not found in DOM.');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('[Navbar] Current authentication state:', currentUser ? 'Logged In' : 'Guest');

    const currentPath = window.location.pathname;
    const isHomeActive = currentPath.endsWith('/') || currentPath.endsWith('index.html') ? 'active' : '';
    const isPageActive = (path) => currentPath.includes(path) ? 'active' : '';

    // Search bar HTML used on both desktop and mobile layouts
    const searchHTML = (className) => `
        <div class="search-container ${className}">
            <select class="search-filter">
                <option value="all">All</option>
                <option value="movie">Movies</option>
                <option value="anime">Anime</option>
            </select>
            <input type="text" class="search-input" placeholder="Search movies, anime, genres...">
            <button class="search-btn"><i class="fas fa-search"></i></button>
            <div class="search-results-dropdown" style="display: none;"></div>
        </div>
    `;

    // Header Right section (Desktop version)
    let desktopRightHTML = '';
    if (currentUser) {
        desktopRightHTML = `
            <div class="header-right desktop-actions">
                <a href="add-movie.html" class="nav-item-btn ${isPageActive('add-movie.html')}">
                    <i class="fas fa-plus-circle"></i> Add New
                </a>
                <a href="add-review.html" class="add-review-btn ${isPageActive('add-review.html')}">
                    <i class="fas fa-edit"></i> Write Review
                </a>
                <a href="watchlist.html" class="watchlist-btn ${isPageActive('watchlist.html')}">
                    <i class="fas fa-bookmark"></i>
                    <span class="watchlist-count">0</span>
                </a>
                <div class="user-dropdown">
                    <button class="user-btn">
                        <i class="fas fa-user-circle"></i>
                        <span id="username">${currentUser.displayName || currentUser.username}</span>
                    </button>
                    <div class="dropdown-menu">
                        <a href="index.html#profile"><i class="fas fa-user"></i> My Profile</a>
                        ${currentUser.role === 'admin' ? '<a href="admin.html"><i class="fas fa-user-shield"></i> Admin Panel</a>' : ''}
                        <a href="add-review.html"><i class="fas fa-star"></i> Write Review</a>
                        <a href="watchlist.html"><i class="fas fa-bookmark"></i> My Watchlist</a>
                        <a href="#" onclick="logoutUser(event)"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            </div>
        `;
    } else {
        desktopRightHTML = `
            <div class="header-right desktop-actions auth-buttons">
                <a href="login.html" class="auth-btn login-btn">Login</a>
                <a href="login.html#signup" class="auth-btn signup-btn">Register</a>
            </div>
        `;
    }

    // Mobile Drawer content
    const mobileDrawerHTML = `
        <div class="mobile-drawer" id="mobile-drawer">
            <nav class="mobile-nav-links">
                <a href="index.html" class="${isHomeActive}"><i class="fas fa-home"></i> Home</a>
                <a href="index.html#movies"><i class="fas fa-video"></i> Movies</a>
                <a href="index.html#anime"><i class="fas fa-dragon"></i> Anime</a>
                <a href="index.html#trending"><i class="fas fa-fire"></i> Trending</a>
                <hr class="mobile-divider">
                ${currentUser ? `
                    ${currentUser.role === 'admin' ? `<a href="admin.html"><i class="fas fa-user-shield"></i> Admin Panel</a>` : ''}
                    <a href="add-movie.html" class="${isPageActive('add-movie.html')}"><i class="fas fa-plus-circle"></i> Add New Title</a>
                    <a href="add-review.html" class="${isPageActive('add-review.html')}"><i class="fas fa-edit"></i> Write Review</a>
                    <a href="watchlist.html" class="${isPageActive('watchlist.html')}"><i class="fas fa-bookmark"></i> My Watchlist</a>
                    <a href="index.html#profile"><i class="fas fa-user-circle"></i> My Profile</a>
                    <a href="#" onclick="logoutUser(event)"><i class="fas fa-sign-out-alt"></i> Logout (${currentUser.displayName || currentUser.username})</a>
                ` : `
                    <a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
                    <a href="login.html#signup"><i class="fas fa-user-plus"></i> Register</a>
                `}
            </nav>
        </div>
    `;

    // Wrap header in a structured container
    header.innerHTML = `
        <div class="header-container">
            <div class="header-main-row">
                <!-- Logo on the left -->
                <div class="logo" onclick="window.location.href='index.html'" style="cursor: pointer;">
                    <i class="fas fa-film"></i>
                    <span>MovAni</span>
                </div>
                
                <!-- Navigation links coming after logo -->
                <nav class="nav desktop-nav">
                    <a href="index.html#movies"><i class="fas fa-video"></i> Movies</a>
                    <a href="index.html#anime"><i class="fas fa-dragon"></i> Anime</a>
                    <a href="index.html#trending"><i class="fas fa-fire"></i> Trending</a>
                </nav>

                <!-- Search Container (Desktop) -->
                ${searchHTML('desktop-search')}

                <!-- Actions on the right -->
                ${desktopRightHTML}

                <!-- Hamburger toggle button (visible on mobile) -->
                <button class="menu-toggle-btn" id="menu-toggle-btn" aria-label="Toggle Menu">
                    <i class="fas fa-bars"></i>
                </button>
            </div>

            <!-- Search row (visible on mobile below header row) -->
            <div class="mobile-search-row">
                ${searchHTML('mobile-search')}
            </div>

            <!-- Mobile drawer navigation list links -->
            ${mobileDrawerHTML}
        </div>
    `;
    console.log('[Navbar] Navbar rendering completed.');
}

async function updateWatchlistBadge() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/watchlist?userId=${currentUser.id}`);
        const list = await response.json();
        const badge = document.querySelector('.watchlist-count');
        if (badge) {
            badge.textContent = list.length;
        }
    } catch (err) {
        console.error('[Navbar] Error updating watchlist badge:', err);
    }
}

function initMobileMenuToggle() {
    const toggleBtn = document.getElementById('menu-toggle-btn');
    const drawer = document.getElementById('mobile-drawer');
    
    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', () => {
            drawer.classList.toggle('active');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                if (drawer.classList.contains('active')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            }
        });
    }
}

function initNavbarSearch() {
    const containers = document.querySelectorAll('.search-container');
    containers.forEach(container => {
        const input = container.querySelector('.search-input');
        const filter = container.querySelector('.search-filter');
        const btn = container.querySelector('.search-btn');
        const dropdown = container.querySelector('.search-results-dropdown');
        
        if (!input || !dropdown) return;
        
        let searchTimeout = null;
        
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();

            if (query.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const result = await response.json();

                    if (result.success) {
                        const filterVal = filter.value;
                        let matches = [...(result.movies || []), ...(result.anime || [])];

                        if (filterVal !== 'all') {
                            matches = matches.filter(item => item.type === filterVal);
                        }

                        renderSearchResults(matches, dropdown);
                    }
                } catch (err) {
                    console.error('[Navbar] Live search query failed:', err);
                }
            }, 300);
        });

        input.addEventListener('focus', function() {
            if (dropdown.children.length > 0 && this.value.trim().length >= 2) {
                dropdown.style.display = 'block';
            }
        });

        if (btn) {
            btn.addEventListener('click', () => performNavbarSearch(container));
        }
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performNavbarSearch(container);
        });
        if (filter) {
            filter.addEventListener('change', () => performNavbarSearch(container));
        }
    });

    // Close dropdowns on clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.querySelectorAll('.search-results-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
}

function renderSearchResults(items, dropdown) {
    if (items.length === 0) {
        dropdown.innerHTML = '<div class="no-search-results">No matches found.</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = items.map(item => `
        <a href="details.html?id=${item.id}&type=${item.type}" class="search-result-item">
            <img src="${item.poster || 'https://via.placeholder.com/40x60?text=No+Poster'}" alt="${escapeHTML(item.title)}">
            <div class="result-details">
                <span class="result-title">${escapeHTML(item.title)}</span>
                <span class="result-meta">${item.year || 'N/A'} • ${item.type.toUpperCase()}</span>
            </div>
        </a>
    `).join('');
    dropdown.style.display = 'block';
}

async function performNavbarSearch(container) {
    const input = container.querySelector('.search-input');
    const filter = container.querySelector('.search-filter');
    const dropdown = container.querySelector('.search-results-dropdown');

    if (!input || !dropdown) return;
    const query = input.value.trim();
    if (query.length < 2) return;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success) {
            const filterVal = filter.value;
            let matches = [...(result.movies || []), ...(result.anime || [])];

            if (filterVal !== 'all') {
                matches = matches.filter(item => item.type === filterVal);
            }

            renderSearchResults(matches, dropdown);
        }
    } catch (err) {
        console.error('[Navbar] Live search query failed:', err);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.logoutUser = async function(event) {
    if (event) event.preventDefault();
    console.log('[Navbar] Performing user logout...');
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
        console.error('[Navbar] Logout API call failed:', err);
    }
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
};
