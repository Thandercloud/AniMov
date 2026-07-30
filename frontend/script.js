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

    container.innerHTML = data.reviews.map(review => {
        const likedReviews = JSON.parse(localStorage.getItem('likedReviews') || '[]');
        const reviewId = review._id || String(review.id);
        const isLiked = likedReviews.includes(reviewId);
        const activeClass = isLiked ? ' active' : '';

        const commentsListHTML = (review.comments || []).map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-user-info">
                        <div class="comment-avatar">${escapeHTML(comment.avatar || 'A')}</div>
                        <span class="comment-username">${escapeHTML(comment.user || 'Anonymous')}</span>
                    </div>
                    <span class="comment-date">${formatReviewDate(comment.date)}</span>
                </div>
                <p class="comment-content">${escapeHTML(comment.content)}</p>
            </div>
        `).join('');

        return `
            <div class="review-card" data-review-id="${reviewId}">
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
                    <div class="review-actions">
                        <button class="review-action-btn like-btn${activeClass}">
                            <i class="fas fa-thumbs-up"></i> <span class="likes-count">${review.likes}</span>
                        </button>
                        <button class="review-action-btn reply-btn">
                            <i class="fas fa-comment"></i> Reply (<span class="replies-count">${(review.comments || []).length}</span>)
                        </button>
                    </div>
                </div>
                <div class="reply-section">
                    <div class="comments-list">${commentsListHTML}</div>
                    <form class="reply-form">
                        <textarea class="reply-textarea" placeholder="Type your reply here..." required></textarea>
                        <div class="reply-form-actions">
                            <button type="button" class="reply-cancel-btn">Cancel</button>
                            <button type="submit" class="reply-submit-btn">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }).join('');

    // Add delegated event listener for liking/replying to reviews
    container.addEventListener('click', async (e) => {
        // 1. Like button click
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            const card = likeBtn.closest('.review-card');
            if (!card) return;
            const reviewId = card.dataset.reviewId;
            if (!reviewId) return;

            let likedReviews = JSON.parse(localStorage.getItem('likedReviews') || '[]');
            const isLiked = likedReviews.includes(reviewId);
            const action = isLiked ? 'unlike' : 'like';

            try {
                const likesCountSpan = likeBtn.querySelector('.likes-count');
                let currentLikes = parseInt(likesCountSpan.textContent) || 0;

                if (isLiked) {
                    likedReviews = likedReviews.filter(id => id !== reviewId);
                    likeBtn.classList.remove('active');
                    likesCountSpan.textContent = Math.max(0, currentLikes - 1);
                } else {
                    likedReviews.push(reviewId);
                    likeBtn.classList.add('active');
                    likesCountSpan.textContent = currentLikes + 1;
                }
                localStorage.setItem('likedReviews', JSON.stringify(likedReviews));

                const response = await fetch(`/api/reviews/${reviewId}/like`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action })
                });
                const result = await response.json();
                if (result.success && result.likes !== undefined) {
                    likesCountSpan.textContent = result.likes;
                }
            } catch (err) {
                console.error('Error toggling like:', err);
            }
            return;
        }

        // 2. Reply toggle button click
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) {
            const card = replyBtn.closest('.review-card');
            if (!card) return;
            const replySection = card.querySelector('.reply-section');
            if (!replySection) return;

            const isExpanded = replySection.style.display === 'block';
            replySection.style.display = isExpanded ? 'none' : 'block';
            return;
        }

        // 3. Cancel button click
        const cancelBtn = e.target.closest('.reply-cancel-btn');
        if (cancelBtn) {
            const card = cancelBtn.closest('.review-card');
            if (!card) return;
            const replySection = card.querySelector('.reply-section');
            if (replySection) replySection.style.display = 'none';
            return;
        }
    });

    // Attach submit event listener for reply forms
    container.querySelectorAll('.reply-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const card = form.closest('.review-card');
            if (!card) return;
            const reviewId = card.dataset.reviewId;
            if (!reviewId) return;

            const textarea = form.querySelector('.reply-textarea');
            const commentContent = textarea.value.trim();
            if (!commentContent) return;

            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('You must be logged in to reply to a review.');
                window.location.href = 'login.html';
                return;
            }

            const submitBtn = form.querySelector('.reply-submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const payload = {
                userId: currentUser.id,
                user: currentUser.displayName || currentUser.username,
                avatar: (currentUser.displayName || currentUser.username).substring(0, 2).toUpperCase(),
                content: commentContent
            };

            try {
                const response = await fetch(`/api/reviews/${reviewId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (response.status === 201 && result.success && result.comments) {
                    const listContainer = card.querySelector('.comments-list');
                    if (listContainer) {
                        listContainer.innerHTML = result.comments.map(comment => `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <div class="comment-user-info">
                                        <div class="comment-avatar">${escapeHTML(comment.avatar || 'A')}</div>
                                        <span class="comment-username">${escapeHTML(comment.user || 'Anonymous')}</span>
                                    </div>
                                    <span class="comment-date">${formatReviewDate(comment.date)}</span>
                                </div>
                                <p class="comment-content">${escapeHTML(comment.content)}</p>
                            </div>
                        `).join('');
                        listContainer.scrollTop = listContainer.scrollHeight;
                    }
                    const replyCountSpan = card.querySelector('.replies-count');
                    if (replyCountSpan) replyCountSpan.textContent = result.comments.length;

                    textarea.value = '';
                } else {
                    alert(result.message || 'Failed to submit reply.');
                }
            } catch (err) {
                console.error('Error submitting reply:', err);
                alert('Connection error occurred while submitting reply.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
        });
    });
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
                    <a href="details.html?id=${item.id}&type=${item.type}" class="view-btn"><i class="fas fa-eye"></i> View Details</a>
                    <a href="add-review.html?id=${item.id}&type=${item.type}" class="review-btn"><i class="fas fa-edit"></i> Write Review</a>
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
