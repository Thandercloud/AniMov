document.addEventListener('DOMContentLoaded', function() {
    initSlider();
    loadTrending();
    loadTopRated();
    loadRecent();
    loadReviews();
    initFilters();
    checkAuthStatus();
    initReviewLinks();
});

async function quickDemoLogin() {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@movani.com', password: 'demo123' })
        });
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            showNotification('Logged in as demo user!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Demo login failed.', 'error');
        }
    } catch (e) {
        console.error('Demo login error:', e);
        showNotification('Server connection error.', 'error');
    }
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 5000);
}

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function initSlider() {
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', showPrevSlide);
        nextBtn.addEventListener('click', showNextSlide);
        setInterval(showNextSlide, 5000);
    }
}

function showNextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % totalSlides;
    slides[currentSlide].classList.add('active');
}

function showPrevSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    slides[currentSlide].classList.add('active');
}

async function loadJSON() {
    try {
        const response = await fetch('data.json');
        return await response.json();
    } catch {
        return null;
    }
}

async function loadTrending() {
    const container = document.getElementById('trending-content');
    if (!container) return;

    const data = await loadJSON();
    if (!data) return;

    container.innerHTML = data.trending.map(id => {
        const item = [...data.movies, ...data.anime].find(i => i.id === id);
        if (!item) return '';
        return createMovieCard(item);
    }).join('');
}

async function loadTopRated() {
    const container = document.getElementById('top-rated-content');
    if (!container) return;

    const data = await loadJSON();
    if (!data) return;

    const allItems = [...data.movies, ...data.anime];
    const sortedItems = allItems.sort((a, b) => b.rating - a.rating).slice(0, 8);
    container.innerHTML = sortedItems.map(item => createMovieCard(item)).join('');
}

async function loadRecent() {
    const container = document.getElementById('recent-content');
    if (!container) return;

    const data = await loadJSON();
    if (!data) return;

    const allItems = [...data.movies, ...data.anime];
    const recentItems = allItems.sort((a, b) => b.id - a.id).slice(0, 6);
    container.innerHTML = recentItems.map(item => createMovieCard(item)).join('');
}

async function loadReviews() {
    const container = document.getElementById('reviews-content');
    if (!container) return;

    const data = await loadJSON();
    if (!data) return;

    container.innerHTML = data.reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user">
                    <div class="user-avatar">${review.avatar}</div>
                    <div>
                        <h4>${review.user}</h4>
                        <span class="review-movie">${getMovieTitle(review.movieId, data)}</span>
                    </div>
                </div>
                <div class="review-rating">${review.rating}/10</div>
            </div>
            <p class="review-content">${review.content}</p>
            <div class="review-footer">
                <span>${formatReviewDate(review.date)}</span>
                <div>
                    <button class="review-action-btn">
                        <i class="fas fa-thumbs-up"></i> ${review.likes}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function formatReviewDate(dateString) {
    if (!dateString) return 'Recently';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        if (dateString.includes('T') || dateString.length > 10) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + ' at ' + date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function createMovieCard(item) {
    return `
        <div class="movie-card" data-id="${item.id}" data-type="${item.type}">
            <div class="movie-poster-container">
                <img src="${item.poster}" alt="${item.title}" class="movie-poster" loading="lazy">
                <span class="movie-type ${item.type}">${item.type.toUpperCase()}</span>
                <div class="movie-actions">
                    <a href="details.html?id=${item.id}&type=${item.type}" class="view-btn">View</a>
                    <a href="add-review.html?id=${item.id}&type=${item.type}" class="review-btn">Review</a>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${item.title}</h3>
                <div class="movie-meta">
                    <span>${item.year}</span>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        <span class="rating-value">${item.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getMovieTitle(id, data) {
    const item = [...data.movies, ...data.anime].find(i => i.id === id);
    return item ? item.title : 'Unknown';
}

function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

async function performSearch() {
    const searchInput = document.querySelector('.search-input');
    const filter = document.querySelector('.search-filter').value;
    const query = searchInput.value.toLowerCase();
    if (!query.trim()) return;

    const data = await loadJSON();
    if (!data) return;

    let results = [...data.movies, ...data.anime];
    if (filter !== 'all') results = results.filter(item => item.type === filter);
    results = results.filter(item => item.title.toLowerCase().includes(query) || item.genres.some(g => g.toLowerCase().includes(query)));

    alert(`Found ${results.length} results for "${query}"`);
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            const container = document.getElementById('top-rated-content');
            const data = await loadJSON();
            if (!data) return;

            let allItems = [...data.movies, ...data.anime];
            if (filter !== 'all') allItems = allItems.filter(item => item.type === filter);

            const sortedItems = allItems.sort((a, b) => b.rating - a.rating).slice(0, 8);
            container.innerHTML = sortedItems.map(item => createMovieCard(item)).join('');
        });
    });
}

function initReviewLinks() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.review-btn')) {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                if (confirm('You need to login to write a review. Go to login page?')) {
                    window.location.href = 'login.html';
                }
            }
        }
    });
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const userDropdown = document.querySelector('.user-dropdown');
    const loginLinks = document.querySelectorAll('a[href*="login"], a[href*="signup"]');

    if (currentUser && userDropdown) {
        const user = JSON.parse(currentUser);
        const userBtn = userDropdown.querySelector('.user-btn span');
        if (userBtn) userBtn.textContent = user.displayName || user.username;
        loginLinks.forEach(link => link.style.display = 'none');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}
