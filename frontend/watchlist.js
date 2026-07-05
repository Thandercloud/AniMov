document.addEventListener('DOMContentLoaded', function() {
    loadWatchlist();
    initFilters();
});

async function loadWatchlist() {
    const container = document.getElementById('watchlist-content');
    const emptyState = document.getElementById('empty-watchlist');
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    let watchlistItems = [];
    try {
        const res = await fetch(`/api/watchlist?userId=${currentUser.id}`);
        watchlistItems = await res.json();
    } catch (err) {
        console.error('Error fetching watchlist:', err);
    }
    
    if (watchlistItems.length === 0) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        updateStats([]);
        return;
    }
    
    const jsonData = await loadJSON();
    const allItems = [...(jsonData?.movies || []), ...(jsonData?.anime || [])];
    
    let itemsWithDetails = watchlistItems.map(watchlistItem => {
        const details = allItems.find(item => 
            item.id === watchlistItem.itemId && 
            (item.type === watchlistItem.itemType || !item.type)
        );
        
        return {
            ...watchlistItem,
            details: details || {
                title: 'Unknown Title',
                type: watchlistItem.itemType,
                rating: 0,
                year: 'N/A'
            }
        };
    }).filter(item => item.details);
    
    // Get filter and sort choices from DOM
    const sortSelect = document.getElementById('watchlist-sort');
    const filterSelect = document.getElementById('watchlist-filter');
    const statusSelect = document.getElementById('watchlist-status');
    
    const sortVal = sortSelect ? sortSelect.value : 'added';
    const typeVal = filterSelect ? filterSelect.value : 'all';
    const statusVal = statusSelect ? statusSelect.value : 'all';
    
    // Filter by type
    if (typeVal !== 'all') {
        itemsWithDetails = itemsWithDetails.filter(item => item.details.type === typeVal);
    }
    
    // Filter by status
    if (statusVal !== 'all') {
        itemsWithDetails = itemsWithDetails.filter(item => (item.status || 'unwatched') === statusVal);
    }
    
    // Sort
    if (sortVal === 'title-asc') {
        itemsWithDetails.sort((a, b) => a.details.title.localeCompare(b.details.title));
    } else if (sortVal === 'title-desc') {
        itemsWithDetails.sort((a, b) => b.details.title.localeCompare(a.details.title));
    } else if (sortVal === 'rating-desc') {
        itemsWithDetails.sort((a, b) => (b.details.rating || 0) - (a.details.rating || 0));
    } else if (sortVal === 'rating-asc') {
        itemsWithDetails.sort((a, b) => (a.details.rating || 0) - (b.details.rating || 0));
    } else { // default or 'added'
        itemsWithDetails.sort((a, b) => b.id - a.id);
    }
    
    updateStats(itemsWithDetails);
    
    if (itemsWithDetails.length === 0) {
        container.innerHTML = '<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">No items match selected filters.</div>';
    } else {
        container.innerHTML = itemsWithDetails.map(item => createWatchlistCard(item)).join('');
    }
    
    emptyState.style.display = 'none';
    container.style.display = 'grid';
}

async function loadJSON() {
    try {
        const response = await fetch('data.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

function createWatchlistCard(item) {
    const details = item.details;
    const currentStatus = item.status || 'unwatched';
    
    return `
        <div class="movie-card watchlist-card" data-id="${item.itemId}" data-type="${details.type}">
            <div class="movie-poster-container">
                <img src="${details.poster || 'https://via.placeholder.com/200x300?text=No+Image'}" 
                     alt="${details.title}" class="movie-poster" loading="lazy">
                <span class="movie-type ${details.type}">${details.type?.toUpperCase() || 'N/A'}</span>
                <div class="watchlist-actions">
                    <button class="action-btn remove-btn" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="action-btn status-btn" data-id="${item.id}" title="Mark Completed">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${details.title}</h3>
                <div class="movie-meta">
                    <span>${details.year || 'N/A'}</span>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        <span class="rating-value">${details.rating || 'N/A'}</span>
                    </div>
                </div>
                <div class="watchlist-status">
                    <select class="status-select" data-id="${item.id}">
                        <option value="unwatched" ${currentStatus === 'unwatched' ? 'selected' : ''}>Plan To Watch</option>
                        <option value="watching" ${currentStatus === 'watching' ? 'selected' : ''}>Watching</option>
                        <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="dropped" ${currentStatus === 'dropped' ? 'selected' : ''}>Dropped</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

function updateStats(items) {
    document.getElementById('total-count').textContent = items.length;
    
    const totalHours = items.reduce((total, item) => {
        if (item.details.runtime) {
            const match = item.details.runtime.match(/(\d+)/);
            if (match) return total + parseInt(match[1]) / 60;
        }
        return total + 2;
    }, 0);
    
    document.getElementById('total-time').textContent = Math.round(totalHours);
    
    const validRatings = items.filter(item => item.details.rating > 0);
    if (validRatings.length > 0) {
        const avgRating = validRatings.reduce((sum, item) => sum + item.details.rating, 0) / validRatings.length;
        document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
    } else {
        document.getElementById('avg-rating').textContent = '0';
    }
}

function initFilters() {
    const sortSelect = document.getElementById('watchlist-sort');
    const filterSelect = document.getElementById('watchlist-filter');
    const statusSelect = document.getElementById('watchlist-status');
    
    if (sortSelect && filterSelect && statusSelect) {
        [sortSelect, filterSelect, statusSelect].forEach(select => {
            select.addEventListener('change', loadWatchlist);
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-btn')) {
            const itemId = e.target.closest('.remove-btn').dataset.id;
            removeFromWatchlist(itemId);
        }
        if (e.target.closest('.status-btn')) {
            const itemId = e.target.closest('.status-btn').dataset.id;
            updateWatchlistStatus(itemId, 'completed');
        }
    });

    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('status-select')) {
            const itemId = e.target.dataset.id;
            const newStatus = e.target.value;
            updateWatchlistStatus(itemId, newStatus);
        }
    });
}

async function updateWatchlistStatus(watchlistItemId, newStatus) {
    try {
        const response = await fetch(`/api/watchlist/${watchlistItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const result = await response.json();
        if (result.success) {
            loadWatchlist();
            showNotificationHelper('Status updated successfully!', 'success');
        } else {
            showNotificationHelper(result.message || 'Failed to update status.', 'error');
        }
    } catch (err) {
        console.error('Error updating watchlist status:', err);
        showNotificationHelper('Server error occurred while updating status.', 'error');
    }
}

async function removeFromWatchlist(watchlistItemId) {
    try {
        const response = await fetch('/api/watchlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: watchlistItemId })
        });
        const result = await response.json();
        if (result.success) {
            loadWatchlist();
            showNotificationHelper('Removed from watchlist', 'success');
        } else {
            showNotificationHelper(result.message || 'Failed to remove from watchlist', 'error');
        }
    } catch (err) {
        console.error('Error removing from watchlist:', err);
        showNotificationHelper('Server error occurred.', 'error');
    }
}

function showNotificationHelper(message, type) {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        alert(message);
    }
}