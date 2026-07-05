document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    const type = urlParams.get('type');
    
    if (!id) {
        window.location.href = 'index.html';
        return;
    }
    
    const data = await loadJSON();
    if (!data) return;
    
    const items = type === 'movie' ? data.movies : data.anime;
    const item = items.find(i => i.id === id);
    
    if (!item) {
        window.location.href = 'index.html';
        return;
    }
    
    populateDetails(item);
    await loadReviewsForItem(item.id, data);
    loadSimilarItems(item, data);
    initStarRating();
    initTrailerModal(item);
    initTabs();
    checkAuthStatus();
});

async function loadJSON() {
    try {
        const response = await fetch('data.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

function populateDetails(item) {
    const titleEl = document.getElementById('detail-title');
    if (titleEl) titleEl.textContent = item.title;

    const posterEl = document.getElementById('detail-poster');
    if (posterEl) {
        posterEl.src = item.poster || '';
        posterEl.alt = item.title || '';
    }

    const ratingEl = document.getElementById('main-rating');
    if (ratingEl) ratingEl.textContent = item.rating;

    const yearEl = document.getElementById('detail-year');
    if (yearEl) yearEl.textContent = item.year;

    const synopsisEl = document.getElementById('detail-synopsis');
    if (synopsisEl) synopsisEl.textContent = item.synopsis;
    
    const typeBadge = document.getElementById('type-badge');
    if (typeBadge) {
        typeBadge.textContent = (item.type || '').toUpperCase();
        typeBadge.className = `type-badge ${item.type}`;
    }
    
    const runtimeElement = document.getElementById('detail-runtime');
    if (runtimeElement) {
        if (item.type === 'movie') {
            runtimeElement.textContent = item.runtime || '';
        } else {
            runtimeElement.textContent = `${item.episodes || 0} Episodes`;
        }
    }
    
    const statusEl = document.getElementById('detail-status');
    if (statusEl) statusEl.textContent = item.status || '';
    
    const genresContainer = document.getElementById('genres');
    if (genresContainer && item.genres) {
        genresContainer.innerHTML = item.genres.map(genre => 
            `<span class="genre-tag">${genre}</span>`
        ).join('');
    }
    
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
        const fullStars = Math.floor((item.rating || 0) / 2);
        starsContainer.innerHTML = Array(5).fill(0).map((_, i) => 
            `<i class="fas fa-star ${i < fullStars ? 'active' : ''}"></i>`
        ).join('');
    }
    
    const crewContainer = document.getElementById('crew-grid');
    if (crewContainer) {
        crewContainer.innerHTML = '';
        if (item.director) {
            crewContainer.innerHTML += `
                <div class="crew-card">
                    <h4>${item.director}</h4>
                    <p class="crew-role">Director</p>
                </div>
            `;
        }
        if (item.studio) {
            crewContainer.innerHTML += `
                <div class="crew-card">
                    <h4>${item.studio}</h4>
                    <p class="crew-role">Studio</p>
                </div>
            `;
        }
    }
    
    const reviewBtn = document.getElementById('write-review-btn');
    if (reviewBtn) {
        reviewBtn.href = `add-review.html?id=${item.id}&type=${item.type}`;
    }

    const watchlistBtn = document.getElementById('add-watchlist-btn');
    if (watchlistBtn) {
        const newWatchlistBtn = watchlistBtn.cloneNode(true);
        watchlistBtn.parentNode.replaceChild(newWatchlistBtn, watchlistBtn);
        
        newWatchlistBtn.addEventListener('click', async () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('Please login to add titles to your watchlist.');
                return;
            }
            try {
                const response = await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        itemId: item.id,
                        itemType: item.type
                    })
                });
                const result = await response.json();
                if (result.success) {
                    alert('Successfully added to watchlist!');
                } else {
                    alert(result.message || 'Already in watchlist.');
                }
            } catch (err) {
                console.error(err);
                alert('Server error occurred while adding to watchlist.');
            }
        });
    }
}

async function loadReviewsForItem(itemId, data) {
    const container = document.getElementById('user-reviews');
    if (!container) return;
    
    let reviews = [];
    try {
        const response = await fetch(`/api/reviews?movieId=${itemId}`);
        const resData = await response.json();
        if (resData.success && resData.data) {
            reviews = resData.data;
        } else if (data && data.reviews) {
            reviews = data.reviews.filter(r => r.movieId === itemId);
        }
    } catch (err) {
        if (data && data.reviews) {
            reviews = data.reviews.filter(r => r.movieId === itemId);
        }
    }

    renderItemReviews(reviews, container);
}

function renderItemReviews(reviews, container) {
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;">No reviews yet. Be the first to write one!</div>';
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user-info">
                    <div class="review-avatar">${escapeHTML(review.avatar)}</div>
                    <div class="review-meta">
                        <h4>${escapeHTML(review.user)}</h4>
                        <span class="review-date">${formatReviewDate(review.date)}</span>
                    </div>
                </div>
                <div class="review-rating">${review.rating}/10</div>
            </div>
            <p class="review-content">${escapeHTML(review.content)}</p>
            <div class="review-actions">
                <button class="review-action-btn">
                    <i class="fas fa-thumbs-up"></i> ${review.likes || 0}
                </button>
                <button class="review-action-btn">
                    <i class="fas fa-comment"></i> Reply
                </button>
            </div>
        </div>
    `).join('');
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

function loadSimilarItems(item, data) {
    const container = document.getElementById('similar-content');
    if (!container) return;
    const allItems = [...data.movies, ...data.anime];
    const similarItems = allItems
        .filter(i => i.id !== item.id && i.type === item.type)
        .sort((a, b) => {
            const aSimilarity = calculateSimilarity(item, a);
            const bSimilarity = calculateSimilarity(item, b);
            return bSimilarity - aSimilarity;
        })
        .slice(0, 6);
    
    container.innerHTML = similarItems.map(similarItem => createMovieCard(similarItem)).join('');
}

function calculateSimilarity(item1, item2) {
    const sharedGenres = item1.genres.filter(genre => item2.genres.includes(genre)).length;
    const yearDiff = Math.abs(item1.year - item2.year);
    const yearScore = Math.max(0, 10 - yearDiff / 2);
    return sharedGenres * 2 + yearScore;
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

let selectedRating = 0;

function initStarRating() {
    const stars = document.querySelectorAll('.star-rating i');
    const ratingValue = document.querySelector('.rating-value');
    
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
        
        star.addEventListener('mouseout', () => {
            highlightStars(selectedRating);
        });
        
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            if (ratingValue) ratingValue.textContent = `${selectedRating}/10`;
            highlightStars(selectedRating);
        });
    });

    const submitBtn = document.querySelector('.submit-review-btn');
    const textarea = document.querySelector('.reviews-section textarea');
    if (submitBtn && textarea) {
        submitBtn.addEventListener('click', async () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('Please login to submit a review.');
                return;
            }
            if (selectedRating === 0) {
                alert('Please select a star rating.');
                return;
            }
            const content = textarea.value.trim();
            if (!content) {
                alert('Please enter review text.');
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const movieId = parseInt(urlParams.get('id'));
            const movieType = urlParams.get('type') || 'movie';

            try {
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        movieId: movieId,
                        rating: selectedRating,
                        title: `Review of Title ${movieId}`,
                        content: content,
                        category: movieType
                    })
                });
                const result = await response.json();
                if (result.success) {
                    alert('Review submitted successfully!');
                    textarea.value = '';
                    selectedRating = 0;
                    highlightStars(0);
                    if (ratingValue) ratingValue.textContent = '0/10';
                    await loadReviewsForItem(movieId, null);
                } else {
                    alert(result.message || 'Failed to submit review.');
                }
            } catch (err) {
                console.error(err);
                alert('Server error occurred while submitting review.');
            }
        });
    }
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('active', starRating <= rating);
    });
}

function initTrailerModal(item) {
    const modal = document.getElementById('trailer-modal');
    const trailerBtn = document.getElementById('trailer-btn');
    const closeBtn = document.querySelector('.close-modal');
    const videoFrame = document.getElementById('trailer-video');
    
    if (!trailerBtn) return;
    if (!item.trailer) {
        trailerBtn.style.display = 'none';
        return;
    }
    
    if (modal && videoFrame && closeBtn) {
        trailerBtn.addEventListener('click', () => {
            videoFrame.src = item.trailer;
            modal.style.display = 'flex';
        });
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            videoFrame.src = '';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                videoFrame.src = '';
            }
        });
    }
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const usernameElement = document.getElementById('username');
    
    if (currentUser && usernameElement) {
        const user = JSON.parse(currentUser);
        usernameElement.textContent = user.displayName || user.username;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}