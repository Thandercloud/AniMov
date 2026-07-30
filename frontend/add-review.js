// frontend/add-review.js
// Client-side script for redesigned Write a Review page

let currentRating = 0;
let selectedTitle = null;
let allTitles = [];
let allReviews = [];
let activeSegment = 'all';

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    initRatingSystem();
    
    // Load titles first, then query URL params, then load reviews
    await loadTitlesData();
    checkURLParameters();
    await loadReviews();
    
    setupAuth();
    setupAutocomplete();
    setupValidationListeners();
    setupFormSubmit();
    setupSegmentTabs();
}

// 1. Setup Auth state & display form or login card
function setupAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const addReviewCard = document.getElementById('add-review-card');
    const loginPromptCard = document.getElementById('login-prompt-card');

    if (currentUser) {
        if (addReviewCard) addReviewCard.style.display = 'block';
        if (loginPromptCard) loginPromptCard.style.display = 'none';
    } else {
        if (addReviewCard) addReviewCard.style.display = 'none';
        if (loginPromptCard) loginPromptCard.style.display = 'block';
    }
}

// 2. Load Movies and Anime for Autocomplete and Title mapping
async function loadTitlesData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allTitles = [
            ...(data.movies || []).map(m => ({ ...m, type: 'movie' })),
            ...(data.anime || []).map(a => ({ ...a, type: 'anime' }))
        ];
    } catch (err) {
        console.error('Error loading movies/anime list:', err);
    }
}

// 3. Check URL Params
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    const type = urlParams.get('type');

    if (id && type && allTitles.length > 0) {
        const matched = allTitles.find(t => t.id === id && t.type === type);
        if (matched) {
            selectTitle(matched);
        }
    }
}

// 4. Autocomplete search logic
function setupAutocomplete() {
    const searchInput = document.getElementById('title-search');
    const dropdown = document.getElementById('search-results-dropdown');
    const clearBtn = document.getElementById('clear-selected-title');

    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 1) {
            dropdown.style.display = 'none';
            return;
        }

        const filtered = allTitles.filter(t => 
            t.title.toLowerCase().includes(query) || 
            (t.genres && t.genres.some(g => g.toLowerCase().includes(query)))
        ).slice(0, 6);

        renderAutocompleteResults(filtered);
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            dropdown.style.display = 'none';
        }
    });

    // Clear selection click
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            selectedTitle = null;
            document.getElementById('selected-title-badge').style.display = 'none';
            searchInput.style.display = 'block';
            searchInput.value = '';
            searchInput.focus();
            
            // Re-validate selection state
            const errTitle = document.getElementById('err-title');
            if (errTitle) errTitle.style.display = 'block';
            searchInput.classList.add('input-error');
        });
    }
}

function renderAutocompleteResults(items) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (items.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item" style="cursor: default;">No titles match search</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = items.map(item => `
        <div class="autocomplete-item" data-id="${item.id}" data-type="${item.type}">
            <img src="${item.poster || 'https://via.placeholder.com/35x50?text=No+Image'}" alt="${escapeHTML(item.title)}">
            <div class="autocomplete-info">
                <span class="autocomplete-title">${escapeHTML(item.title)}</span>
                <span class="autocomplete-meta">${item.year} • ${item.type.toUpperCase()}</span>
            </div>
        </div>
    `).join('');

    dropdown.style.display = 'block';

    // Click handlers for autocomplete items
    dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const type = this.dataset.type;
            const item = allTitles.find(t => t.id === id && t.type === type);
            if (item) {
                selectTitle(item);
                dropdown.style.display = 'none';
            }
        });
    });
}

function selectTitle(item) {
    selectedTitle = item;
    const searchInput = document.getElementById('title-search');
    const badge = document.getElementById('selected-title-badge');
    const text = document.getElementById('selected-title-text');
    const errTitle = document.getElementById('err-title');

    if (searchInput && badge && text) {
        searchInput.style.display = 'none';
        text.textContent = `${item.title} (${item.year}) [${item.type.toUpperCase()}]`;
        badge.style.display = 'flex';
        
        // Clear title selection validation error
        if (errTitle) errTitle.style.display = 'none';
        searchInput.classList.remove('input-error');
    }
}

// Helper to escape HTML and prevent XSS on rendering
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 5. Interactive Star Rating System
function initRatingSystem() {
    const starContainer = document.getElementById('stars-container');
    const label = document.getElementById('rating-label');
    if (!starContainer || !label) return;

    const stars = starContainer.querySelectorAll('.star-btn');
    const ratingTexts = {
        0: 'Select a rating',
        1: 'Terrible',
        2: 'Poor',
        3: 'Average',
        4: 'Good',
        5: 'Excellent'
    };

    stars.forEach(star => {
        // Hover
        star.addEventListener('mouseover', function() {
            const hoverValue = parseInt(this.dataset.value);
            highlightStars(hoverValue);
            label.textContent = `${hoverValue}/5 Stars - ${ratingTexts[hoverValue]}`;
        });

        // Mouse out (restore locked rating)
        star.addEventListener('mouseout', () => {
            highlightStars(currentRating);
            label.textContent = currentRating > 0 ? `${currentRating}/5 Stars - ${ratingTexts[currentRating]}` : ratingTexts[0];
        });

        // Click to lock rating
        star.addEventListener('click', function() {
            currentRating = parseInt(this.dataset.value);
            highlightStars(currentRating);
            label.textContent = `${currentRating}/5 Stars - ${ratingTexts[currentRating]}`;
            // Hide error message
            const errEl = document.getElementById('err-rating');
            if (errEl) errEl.style.display = 'none';
        });
    });
}

function highlightStars(count) {
    const stars = document.querySelectorAll('#stars-container i.star-btn');
    stars.forEach(star => {
        const val = parseInt(star.dataset.value);
        if (val <= count) {
            star.className = 'fas fa-star star-btn active';
        } else {
            star.className = 'far fa-star star-btn';
        }
    });
}

// 6. Load existing reviews from Database
async function loadReviews() {
    const listContainer = document.getElementById('reviews-list');
    if (!listContainer) return;

    try {
        const response = await fetch('/api/reviews');
        const result = await response.json();
        
        if (result.success && result.data) {
            allReviews = result.data;
            filterAndRenderReviews();
        } else {
            listContainer.innerHTML = '<div class="feed-empty">Failed to load reviews.</div>';
        }
    } catch (err) {
        console.error('Error fetching reviews:', err);
        listContainer.innerHTML = '<div class="feed-empty">Error loading reviews from database.</div>';
    }
}

function setupSegmentTabs() {
    const tabsContainer = document.getElementById('segment-tabs');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.segment-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            activeSegment = this.dataset.segment;
            filterAndRenderReviews();
        });
    });
}

function filterAndRenderReviews() {
    const countBadge = document.getElementById('reviews-count');
    let filtered = allReviews;

    if (activeSegment !== 'all') {
        filtered = allReviews.filter(r => {
            const cat = r.category || (allTitles.find(t => t.id === r.movieId)?.type) || 'movie';
            return cat === activeSegment;
        });
    }

    if (countBadge) countBadge.textContent = filtered.length;
    renderReviewsFeed(filtered);
}

function renderReviewsFeed(reviews) {
    const listContainer = document.getElementById('reviews-list');
    if (!listContainer) return;

    if (reviews.length === 0) {
        listContainer.innerHTML = '<div class="feed-empty">No reviews written yet. Be the first!</div>';
        return;
    }

    listContainer.innerHTML = reviews.map(review => {
        // Find movie title
        const movieObj = allTitles.find(t => t.id === review.movieId);
        const movieTitle = movieObj ? movieObj.title : `Title ${review.movieId}`;
        const movieLink = movieObj ? `details.html?id=${movieObj.id}&type=${movieObj.type}` : '#';

        // Draw star ratings
        const ratingVal = review.rating;
        const normalizedStars = Math.round(ratingVal / 2);
        
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= normalizedStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }

        const dateStr = formatDate(review.date);

        const escapedUser = escapeHTML(review.user);
        const escapedAvatar = escapeHTML(review.avatar);
        const escapedTitle = escapeHTML(review.title);
        const escapedContent = escapeHTML(review.content);
        const escapedMovieTitle = escapeHTML(movieTitle);

        return `
            <div class="feed-review-card">
                <div class="feed-review-header">
                    <div class="feed-review-user">
                        <div class="feed-user-avatar">${escapedAvatar}</div>
                        <div>
                            <h4 class="feed-user-name">${escapedUser}</h4>
                            <span class="feed-review-date">${dateStr}</span>
                        </div>
                    </div>
                    <div class="feed-review-rating" title="Rating: ${ratingVal}/5">
                        ${starsHTML}
                    </div>
                </div>
                <a href="${movieLink}" class="feed-movie-tag">
                    <i class="fas fa-film"></i> ${escapedMovieTitle}
                </a>
                <h5 class="feed-review-title">${escapedTitle}</h5>
                <p class="feed-review-text">${escapedContent}</p>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Recently';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        // Format ISO date or date with time
        if (dateString.includes('T') || dateString.length > 10) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + ' at ' + date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
        } else {
            // Legacy date format
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch {
        return dateString;
    }
}

// 7. Client-side Form Validation
function setupValidationListeners() {
    const contentInput = document.getElementById('review-content');
    if (contentInput) {
        contentInput.addEventListener('input', () => {
            validateField('review-content');
        });
    }
}

function validateField(id) {
    const el = document.getElementById(id);
    if (!el) return true;

    const val = el.value.trim();
    let isValid = true;
    let errMsgId = '';

    if (id === 'review-content') {
        errMsgId = 'err-content';
        if (!val) {
            isValid = false;
        }
    }

    const errEl = document.getElementById(errMsgId);
    if (errEl) {
        if (isValid) {
            errEl.style.display = 'none';
            el.classList.remove('input-error');
        } else {
            errEl.style.display = 'block';
            el.classList.add('input-error');
        }
    }

    return isValid;
}

function validateForm() {
    let isValid = true;

    // Check title selection
    const errTitle = document.getElementById('err-title');
    const searchInput = document.getElementById('title-search');
    if (!selectedTitle) {
        if (errTitle) errTitle.style.display = 'block';
        if (searchInput) searchInput.classList.add('input-error');
        isValid = false;
    } else {
        if (errTitle) errTitle.style.display = 'none';
        if (searchInput) searchInput.classList.remove('input-error');
    }

    // Check rating
    const errRating = document.getElementById('err-rating');
    if (currentRating === 0) {
        if (errRating) errRating.style.display = 'block';
        isValid = false;
    } else {
        if (errRating) errRating.style.display = 'none';
    }

    // Check content description
    if (!validateField('review-content')) isValid = false;

    return isValid;
}

// 8. Setup Submit action
function setupFormSubmit() {
    const form = document.getElementById('review-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear existing errors
        const errorBanner = document.getElementById('form-error-banner');
        if (errorBanner) errorBanner.style.display = 'none';

        if (!validateForm()) {
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Please login to submit a review.');
            window.location.href = 'login.html';
            return;
        }

        // Prevent duplicates & show loading indicators
        const submitBtn = document.getElementById('submit-review-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');

        submitBtn.disabled = true;
        if (btnText && btnSpinner) {
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline-block';
        }

        const titleVal = document.getElementById('review-title').value.trim();
        const contentVal = document.getElementById('review-content').value;

        // Construct payload
        const payload = {
            userId: currentUser.id,
            movieId: selectedTitle.id,
            rating: currentRating * 2, // Map 1-5 scale to 1-10 database scale
            title: titleVal || `Review of ${selectedTitle.title}`,
            content: contentVal,
            privacy: 'public',
            category: selectedTitle.type || 'movie'
        };

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.status === 201 && result.success && result.review) {
                // Attach category tag explicitly if missing from response
                result.review.category = result.review.category || selectedTitle.type || 'movie';

                // Dynamically prepend new review card to list
                allReviews.unshift(result.review);
                filterAndRenderReviews();

                // Reset submit button state
                submitBtn.disabled = false;
                if (btnText && btnSpinner) {
                    btnText.style.display = 'inline-block';
                    btnSpinner.style.display = 'none';
                }

                // Success Modal trigger
                showSuccessModal();
            } else {
                // Display error message in error banner
                const errMsg = result.message || 'Error occurred while saving review.';
                if (errorBanner) {
                    const textEl = document.getElementById('error-banner-text');
                    if (textEl) textEl.textContent = errMsg;
                    errorBanner.style.display = 'flex';
                } else {
                    alert(errMsg);
                }

                submitBtn.disabled = false;
                if (btnText && btnSpinner) {
                    btnText.style.display = 'inline-block';
                    btnSpinner.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Submission error:', err);
            if (errorBanner) {
                const textEl = document.getElementById('error-banner-text');
                if (textEl) textEl.textContent = 'Unable to connect to server. Please try again.';
                errorBanner.style.display = 'flex';
            } else {
                alert('Unable to connect to server. Please try again.');
            }
            submitBtn.disabled = false;
            if (btnText && btnSpinner) {
                btnText.style.display = 'inline-block';
                btnSpinner.style.display = 'none';
            }
        }
    });
}

// 9. Success modal callbacks
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.style.display = 'flex';
}

function viewSelectedReview() {
    if (selectedTitle) {
        window.location.href = `details.html?id=${selectedTitle.id}&type=${selectedTitle.type}`;
    } else {
        window.location.href = 'index.html';
    }
}

function writeAnotherReview() {
    // Refresh page cleanly to clear form and update the reviews feed
    window.location.href = 'add-review.html';
}

function goHome() {
    window.location.href = 'index.html';
}