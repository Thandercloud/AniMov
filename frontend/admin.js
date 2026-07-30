/* admin.js */
/* MovAni Admin Dashboard Controller */

// 1. Session & Access Verification
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'login.html';
}

// 2. Global State Cache
const adminState = {
    user: currentUser,
    activeTab: 'dashboard',
    stats: {},
    users: [],
    movies: [],
    anime: [],
    reviews: [],
    comments: [],
    reports: [],
    requests: [],
    notifications: [],
    settings: {},
    backups: [],
    activityLogs: [],
    ads: [],
    searchLogs: [],
    charts: {
        growth: null,
        distribution: null
    }
};

// 3. Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
    initHeaderProfile();
    initSidebarNav();
    initMobileMenu();
    initModalControls();
    initGlobalSearch();
    initMaintenanceToggle();
    
    // Initial data fetch and default tab render
    refreshDashboardData();
});

// Profile & Notification Bells Dropdowns in Topbar
function initHeaderProfile() {
    const trigger = document.getElementById('profile-trigger-btn');
    const dropdown = document.getElementById('profile-dropdown-box');
    const bellBtn = document.getElementById('notif-bell-btn');
    const bellDropdown = document.getElementById('notif-dropdown-box');

    // Display admin initials on avatar placeholders
    const initials = adminState.user.displayName ? 
        adminState.user.displayName.substring(0, 2).toUpperCase() : 
        adminState.user.username.substring(0, 2).toUpperCase();
        
    document.getElementById('admin-sidebar-avatar').textContent = initials;
    document.getElementById('admin-header-avatar').textContent = initials;
    document.getElementById('admin-sidebar-name').textContent = adminState.user.displayName || adminState.user.username;
    document.getElementById('admin-sidebar-email').textContent = adminState.user.email;
    document.getElementById('admin-profile-name').textContent = adminState.user.displayName || adminState.user.username;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        bellDropdown.style.display = 'none';
    });

    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bellDropdown.style.display = bellDropdown.style.display === 'none' ? 'block' : 'none';
        dropdown.style.display = 'none';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
        bellDropdown.style.display = 'none';
    });
}

// Global logout helper for Admins
window.logoutAdmin = async function(event) {
    if (event) event.preventDefault();
    try {
        await apiCall('/api/auth/logout', 'POST');
    } catch (err) {
        console.error('Logout failed:', err);
    }
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
};

// Sidebar Nav Navigation Switching
function initSidebarNav() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            if (!tab) return;

            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Close mobile menu if open
            document.getElementById('sidebar').classList.remove('open');

            switchTab(tab);
        });
    });
}

// Mobile sidebar panel toggles
function initMobileMenu() {
    const btn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

// Modal controls setup
function initModalControls() {
    const closeBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('admin-modal');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Reusable modal display functions
function showModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('admin-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('admin-modal').style.display = 'none';
}

// Global search bar
function initGlobalSearch() {
    const input = document.getElementById('global-search-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val) {
                // If search input is submitted, redirect automatically to User Management tab with a search query
                switchTab('users', val);
                const userLink = document.querySelector('.nav-link[data-tab="users"]');
                if (userLink) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    userLink.classList.add('active');
                }
            }
        }
    });
}

// Maintenance Mode switch
function initMaintenanceToggle() {
    const toggle = document.getElementById('maintenance-toggle-btn');
    const labelStatus = document.getElementById('maintenance-sidebar-status');

    toggle.addEventListener('change', async () => {
        const enabled = toggle.checked;
        try {
            const res = await apiCall('/api/admin/maintenance', 'PUT', { enabled });
            if (res.success) {
                showToast(`Maintenance mode set to ${enabled ? 'ON' : 'OFF'}`, 'info');
                labelStatus.textContent = enabled ? 'Active' : 'Offline';
                labelStatus.className = `widget-status ${enabled ? 'active' : ''}`;
            }
        } catch (err) {
            toggle.checked = !enabled;
            showToast('Failed to toggle maintenance mode', 'error');
        }
    });
}

// Centralized AJAX helper adding security authentication header `x-user-id` automatically
async function apiCall(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': adminState.user.id
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'API request failed');
    }
    return response.json();
}

// Toast Alerts display
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'info') icon = 'fa-info-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 4. SPA tab navigation route switcher
async function switchTab(tab, queryParam = '') {
    adminState.activeTab = tab;
    const canvas = document.getElementById('content-canvas');
    const pageTitle = document.getElementById('page-title');

    // Update Header title
    const readableTitles = {
        dashboard: 'Dashboard',
        notifications: 'System Alerts',
        movies: 'Movie Catalog',
        anime: 'Anime Catalog',
        requests: 'Content Requests',
        genres: 'Genres & Categories',
        users: 'User Accounts',
        reviews: 'Review Moderation',
        comments: 'Comments Moderation',
        reports: 'Reports Inbox',
        homepage: 'Homepage Configuration',
        branding: 'Branding & Theme Settings',
        ads: 'Ad Campaign Slots',
        security: 'Security & Active Sessions',
        api: 'API Gateways',
        email: 'Email Templates & logs',
        backups: 'Database Backups',
        audit: 'System Activity logs'
    };
    pageTitle.textContent = readableTitles[tab] || 'Control Panel';

    // Clear Canvas
    canvas.innerHTML = '<div style="display:flex; justify-content:center; padding:3rem;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i></div>';

    try {
        switch (tab) {
            case 'dashboard':
                canvas.innerHTML = `
                    <div class="module-panel" id="dashboard-panel">
                        <div class="stats-grid" id="dashboard-stats-grid"></div>
                        <div class="dashboard-grid">
                            <div class="dashboard-chart-card">
                                <div class="card-header">
                                    <h3>User Growth Analytics</h3>
                                    <span class="header-legend">Last 7 Days</span>
                                </div>
                                <div class="chart-container"><canvas id="chart-user-growth"></canvas></div>
                            </div>
                            <div class="dashboard-chart-card">
                                <div class="card-header">
                                    <h3>Library Distribution</h3>
                                    <span class="header-legend">Movies vs Anime</span>
                                </div>
                                <div class="chart-container-donut"><canvas id="chart-library-distribution"></canvas></div>
                            </div>
                        </div>
                        <div class="dashboard-lower-grid">
                            <div class="dashboard-table-card">
                                <div class="card-header">
                                    <h3>Recent System Activity</h3>
                                    <button class="view-all-link" onclick="switchTab('audit')">View Audit Logs <i class="fas fa-arrow-right"></i></button>
                                </div>
                                <div class="table-container">
                                    <table class="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Timestamp</th>
                                                <th>User</th>
                                                <th>Action</th>
                                                <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody id="dashboard-recent-activity-body"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                await refreshDashboardData();
                break;
            case 'notifications':
                await renderNotificationsModule();
                break;
            case 'movies':
                await renderMoviesModule();
                break;
            case 'anime':
                await renderAnimeModule();
                break;
            case 'requests':
                await renderRequestsModule();
                break;
            case 'genres':
                await renderGenresModule();
                break;
            case 'users':
                await renderUsersModule(queryParam);
                break;
            case 'reviews':
                await renderReviewsModule();
                break;
            case 'comments':
                await renderCommentsModule();
                break;
            case 'reports':
                await renderReportsModule();
                break;
            case 'homepage':
                await renderHomepageModule();
                break;
            case 'branding':
                await renderBrandingModule();
                break;
            case 'ads':
                await renderAdsModule();
                break;
            case 'security':
                await renderSecurityModule();
                break;
            case 'api':
                await renderAPIModule();
                break;
            case 'email':
                await renderEmailModule();
                break;
            case 'backups':
                await renderBackupsModule();
                break;
            case 'audit':
                await renderAuditModule();
                break;
            default:
                canvas.innerHTML = '<div style="padding: 2rem; color: var(--text-secondary);">Module coming soon.</div>';
        }
    } catch (err) {
        console.error(err);
        canvas.innerHTML = `<div style="padding: 2rem; color: var(--danger); text-align:center;">
            <i class="fas fa-exclamation-triangle fa-2x"></i>
            <p style="margin-top:10px;">Failed to load module data. Please ensure the backend is running.</p>
        </div>`;
    }
}

// 5. Module: Dashboard Data & Chart configurations
async function refreshDashboardData() {
    const res = await apiCall('/api/admin/stats');
    if (!res.success) return;

    adminState.stats = res.stats;
    
    // Setup maintenance toggle state
    const settings = await apiCall('/api/admin/settings');
    const maintenanceModeSetting = settings.data.find(s => s.key === 'maintenanceMode');
    const isMaintenance = maintenanceModeSetting ? maintenanceModeSetting.value === true : false;
    
    document.getElementById('maintenance-toggle-btn').checked = isMaintenance;
    const labelStatus = document.getElementById('maintenance-sidebar-status');
    labelStatus.textContent = isMaintenance ? 'Active' : 'Offline';
    labelStatus.className = `widget-status ${isMaintenance ? 'active' : ''}`;

    // Render badge counts on sidebar links dynamically
    updateSidebarBadges(res.stats.pendingReports, res.stats.pendingRequests);

    // Update stat numbers
    const statsGrid = document.getElementById('dashboard-stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon icon-users"><i class="fas fa-user-friends"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Total Users</span>
                    <h3 class="stat-number">${res.stats.users}</h3>
                    <span class="stat-change text-danger">${res.stats.bannedUsers} banned</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-movies"><i class="fas fa-video"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Total Movies</span>
                    <h3 class="stat-number">${res.stats.movies}</h3>
                    <span class="stat-change text-neutral">Catalog</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-anime"><i class="fas fa-dragon"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Total Anime</span>
                    <h3 class="stat-number">${res.stats.anime}</h3>
                    <span class="stat-change text-neutral">Catalog</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-reviews"><i class="fas fa-star"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Total Reviews</span>
                    <h3 class="stat-number">${res.stats.reviews}</h3>
                    <span class="stat-change text-success">${res.stats.comments} replies</span>
                </div>
            </div>
        `;
    }

    // Render Recent activities logs
    const activityBody = document.getElementById('dashboard-recent-activity-body');
    if (activityBody) {
        if (res.recentActivity.length === 0) {
            activityBody.innerHTML = '<tr><td colspan="4" class="text-center">No system logs recorded yet.</td></tr>';
        } else {
            activityBody.innerHTML = res.recentActivity.map(act => `
                <tr>
                    <td>${new Date(act.date).toLocaleString()}</td>
                    <td><strong>${escapeHTML(act.username)}</strong></td>
                    <td><span class="status-tag status-info">${escapeHTML(act.action)}</span></td>
                    <td>${escapeHTML(act.details)}</td>
                </tr>
            `).join('');
        }
    }

    // Load Charts
    initDashboardCharts(res.charts);
}

function updateSidebarBadges(reports, requests) {
    const badgeRep = document.querySelector('.badge-reports');
    const badgeReq = document.querySelector('.badge-requests');
    
    if (badgeRep) {
        if (reports > 0) {
            badgeRep.style.display = 'inline-block';
            badgeRep.textContent = reports;
        } else {
            badgeRep.style.display = 'none';
        }
    }
    if (badgeReq) {
        if (requests > 0) {
            badgeReq.style.display = 'inline-block';
            badgeReq.textContent = requests;
        } else {
            badgeReq.style.display = 'none';
        }
    }
}

// Chart configuration setups
function initDashboardCharts(chartData) {
    const growthCanvas = document.getElementById('chart-user-growth');
    const distCanvas = document.getElementById('chart-library-distribution');

    if (!growthCanvas || !distCanvas) return;

    // Destroy existing instances if active to avoid canvas redraw glitching
    if (adminState.charts.growth) adminState.charts.growth.destroy();
    if (adminState.charts.distribution) adminState.charts.distribution.destroy();

    // User growth line chart
    const growthCtx = growthCanvas.getContext('2d');
    adminState.charts.growth = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: chartData.userGrowth.map(item => item.date),
            datasets: [{
                label: 'Cumulative Users',
                data: chartData.userGrowth.map(item => item.count),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.05)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointBackgroundColor: '#f5c518',
                pointBorderColor: '#080c14',
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // Donut library distribution chart
    const distCtx = distCanvas.getContext('2d');
    adminState.charts.distribution = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: chartData.categoryDistribution.map(i => i.name),
            datasets: [{
                data: chartData.categoryDistribution.map(i => i.value),
                backgroundColor: ['#f5c518', '#06b6d4'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { family: 'Outfit' } }
                }
            },
            cutout: '70%'
        }
    });
}

// 6. Module: User Management Control Panel
async function renderUsersModule(searchQuery = '') {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="module-header">
                <div class="quick-search" style="width:320px;">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search username, email..." id="user-search-input" value="${searchQuery}">
                </div>
            </div>
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Display Name</th>
                                <th>Email Address</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="user-list-body">
                            <tr><td colspan="6" class="text-center">Loading accounts...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Hook up local search bar
    const searchInput = document.getElementById('user-search-input');
    searchInput.addEventListener('input', debounce(() => {
        loadUsersTable(searchInput.value.trim());
    }, 300));

    await loadUsersTable(searchQuery);
}

async function loadUsersTable(query = '') {
    const body = document.getElementById('user-list-body');
    const res = await apiCall(`/api/admin/users?q=${encodeURIComponent(query)}`);
    if (!res.success) return;

    adminState.users = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center">No user profiles matched your query.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(usr => {
        const isBanned = usr.banned === true;
        const statusBadge = isBanned ? 
            '<span class="status-tag status-banned">Banned</span>' : 
            '<span class="status-tag status-approved">Active</span>';
            
        const banIcon = isBanned ? 'fa-user-check' : 'fa-user-slash';
        const banTitle = isBanned ? 'Unban User' : 'Ban User';

        return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="admin-avatar" style="width:32px; height:32px; font-size:0.8rem; background:rgba(255,255,255,0.05); color:var(--text-primary);">${escapeHTML(usr.avatar || usr.username.substring(0, 2).toUpperCase())}</div>
                        <div>
                            <div style="font-weight:600;">${escapeHTML(usr.displayName || usr.username)}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">@${escapeHTML(usr.username)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHTML(usr.email)}</td>
                <td>
                    <select class="form-control" style="width:100px; padding:4px 8px; font-size:0.8rem;" onchange="changeUserRole(${usr.id}, this.value)">
                        <option value="user" ${usr.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${usr.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>${statusBadge}</td>
                <td>${new Date(usr.joined).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-icon btn-icon-warning" title="${banTitle}" onclick="toggleUserBan(${usr.id}, ${!isBanned})">
                            <i class="fas ${banIcon}"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger" title="Delete Profile" onclick="deleteUserProfile(${usr.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.changeUserRole = async function(userId, role) {
    try {
        const res = await apiCall(`/api/admin/users/${userId}`, 'PUT', { role });
        if (res.success) {
            showToast(`Role updated to ${role} successfully.`, 'success');
        }
    } catch (err) {
        showToast(err.message, 'error');
        switchTab('users'); // reload to revert selector UI
    }
};

window.toggleUserBan = async function(userId, banState) {
    if (confirm(`Are you sure you want to ${banState ? 'BAN' : 'UNBAN'} this user?`)) {
        try {
            const res = await apiCall(`/api/admin/users/${userId}`, 'PUT', { banned: banState });
            if (res.success) {
                showToast(`User has been ${banState ? 'banned' : 'unbanned'} successfully.`, 'info');
                loadUsersTable(document.getElementById('user-search-input').value.trim());
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

window.deleteUserProfile = async function(userId) {
    if (confirm('WARNING: Removing a user profile is permanent and cannot be undone. Do you wish to proceed?')) {
        try {
            const res = await apiCall(`/api/admin/users/${userId}`, 'DELETE');
            if (res.success) {
                showToast('User account successfully deleted.', 'success');
                loadUsersTable(document.getElementById('user-search-input').value.trim());
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 7. Module: Movie Catalog Management
async function renderMoviesModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="module-header">
                <h3>System Movies Catalog</h3>
                <button class="btn-primary" onclick="showAddTitleModal('movie')"><i class="fas fa-plus-circle"></i> Add Movie</button>
            </div>
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Release Year</th>
                                <th>Director</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="movie-catalog-body">
                            <tr><td colspan="5" class="text-center">Loading movies list...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    await loadMoviesCatalog();
}

async function loadMoviesCatalog() {
    const body = document.getElementById('movie-catalog-body');
    const res = await apiCall('/data.json'); // uses aggregated endpoint for client compatibility
    adminState.movies = res.movies;

    if (res.movies.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="text-center">No movies currently seeded.</td></tr>';
        return;
    }

    body.innerHTML = res.movies.map(movie => `
        <tr>
            <td>
                <div class="table-media-item">
                    <img src="${escapeHTML(movie.poster || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')}" alt="">
                    <div class="media-meta">
                        <span class="media-title">${escapeHTML(movie.title)}</span>
                        <span class="media-subtitle">${escapeHTML(movie.genres.join(', '))}</span>
                    </div>
                </div>
            </td>
            <td>${movie.year || 'N/A'}</td>
            <td>${escapeHTML(movie.director || 'N/A')}</td>
            <td><strong>★ ${movie.rating || 0}</strong></td>
            <td>
                <div class="btn-group">
                    <button class="btn-icon" title="Edit Metadata" onclick="showEditTitleModal('movie', ${movie.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Remove Title" onclick="deleteTitle('movie', ${movie.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 8. Module: Anime Catalog Management
async function renderAnimeModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="module-header">
                <h3>System Anime Catalog</h3>
                <button class="btn-primary" onclick="showAddTitleModal('anime')"><i class="fas fa-plus-circle"></i> Add Anime</button>
            </div>
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Release Year</th>
                                <th>Studio</th>
                                <th>Episodes</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="anime-catalog-body">
                            <tr><td colspan="6" class="text-center">Loading anime list...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    await loadAnimeCatalog();
}

async function loadAnimeCatalog() {
    const body = document.getElementById('anime-catalog-body');
    const res = await apiCall('/data.json');
    adminState.anime = res.anime;

    if (res.anime.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center">No anime entries currently seeded.</td></tr>';
        return;
    }

    body.innerHTML = res.anime.map(ani => `
        <tr>
            <td>
                <div class="table-media-item">
                    <img src="${escapeHTML(ani.poster || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')}" alt="">
                    <div class="media-meta">
                        <span class="media-title">${escapeHTML(ani.title)}</span>
                        <span class="media-subtitle">${escapeHTML(ani.genres.join(', '))}</span>
                    </div>
                </div>
            </td>
            <td>${ani.year || 'N/A'}</td>
            <td>${escapeHTML(ani.studio || 'N/A')}</td>
            <td>${ani.episodes || 'N/A'} ep</td>
            <td><strong>★ ${ani.rating || 0}</strong></td>
            <td>
                <div class="btn-group">
                    <button class="btn-icon" title="Edit Metadata" onclick="showEditTitleModal('anime', ${ani.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Remove Title" onclick="deleteTitle('anime', ${ani.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 9. Module Shared modals logic for Adding/Editing movies or anime
window.showAddTitleModal = function(type) {
    const isMovie = type === 'movie';
    const formHTML = `
        <form id="title-crud-form" onsubmit="saveNewTitle(event, '${type}')">
            <div class="form-group">
                <label>Title Name *</label>
                <input type="text" class="form-control" name="title" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Release Year</label>
                    <input type="number" class="form-control" name="year" value="2026">
                </div>
                <div class="form-group">
                    <label>Rating (1-10)</label>
                    <input type="number" step="0.1" min="1" max="10" class="form-control" name="rating" value="7.5">
                </div>
            </div>
            <div class="form-group">
                <label>Genres (comma separated)</label>
                <input type="text" class="form-control" name="genres" placeholder="Action, Adventure, Drama">
            </div>
            <div class="form-group">
                <label>Poster Image URL</label>
                <input type="url" class="form-control" name="poster" placeholder="https://images.unsplash.com/...">
            </div>
            <div class="form-group">
                <label>Banner Image URL</label>
                <input type="url" class="form-control" name="banner" placeholder="https://images.unsplash.com/...">
            </div>
            ${isMovie ? `
                <div class="form-row">
                    <div class="form-group">
                        <label>Runtime</label>
                        <input type="text" class="form-control" name="runtime" placeholder="120 min">
                    </div>
                    <div class="form-group">
                        <label>Director</label>
                        <input type="text" class="form-control" name="director">
                    </div>
                </div>
            ` : `
                <div class="form-row">
                    <div class="form-group">
                        <label>Total Episodes</label>
                        <input type="number" class="form-control" name="episodes">
                    </div>
                    <div class="form-group">
                        <label>Studio</label>
                        <input type="text" class="form-control" name="studio">
                    </div>
                </div>
            `}
            <div class="form-group">
                <label>Synopsis / Story</label>
                <textarea class="form-control" name="synopsis" rows="4"></textarea>
            </div>
            <button type="submit" class="btn-primary" style="width:100%;">Create Entry</button>
        </form>
    `;
    showModal(`Add New ${isMovie ? 'Movie' : 'Anime'} Entry`, formHTML);
};

window.saveNewTitle = async function(event, type) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {};
    formData.forEach((value, key) => {
        if (key === 'genres') {
            payload[key] = value.split(',').map(g => g.trim()).filter(Boolean);
        } else if (key === 'year' || key === 'rating' || key === 'episodes') {
            payload[key] = Number(value);
        } else {
            payload[key] = value;
        }
    });

    try {
        const endpoint = type === 'movie' ? '/api/admin/movies' : '/api/admin/anime';
        const res = await apiCall(endpoint, 'POST', payload);
        if (res.success) {
            showToast(`"${payload.title}" successfully added.`, 'success');
            closeModal();
            if (type === 'movie') renderMoviesModule();
            else renderAnimeModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.showEditTitleModal = function(type, id) {
    const list = type === 'movie' ? adminState.movies : adminState.anime;
    const item = list.find(x => x.id === id);
    if (!item) return;

    const isMovie = type === 'movie';
    const formHTML = `
        <form id="title-crud-form" onsubmit="updateTitleDetails(event, '${type}', ${id})">
            <div class="form-group">
                <label>Title Name *</label>
                <input type="text" class="form-control" name="title" value="${escapeHTML(item.title)}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Release Year</label>
                    <input type="number" class="form-control" name="year" value="${item.year || ''}">
                </div>
                <div class="form-group">
                    <label>Rating (1-10)</label>
                    <input type="number" step="0.1" min="1" max="10" class="form-control" name="rating" value="${item.rating || 0}">
                </div>
            </div>
            <div class="form-group">
                <label>Genres (comma separated)</label>
                <input type="text" class="form-control" name="genres" value="${item.genres ? item.genres.join(', ') : ''}">
            </div>
            <div class="form-group">
                <label>Poster Image URL</label>
                <input type="url" class="form-control" name="poster" value="${escapeHTML(item.poster || '')}">
            </div>
            <div class="form-group">
                <label>Banner Image URL</label>
                <input type="url" class="form-control" name="banner" value="${escapeHTML(item.banner || '')}">
            </div>
            ${isMovie ? `
                <div class="form-row">
                    <div class="form-group">
                        <label>Runtime</label>
                        <input type="text" class="form-control" name="runtime" value="${escapeHTML(item.runtime || '')}">
                    </div>
                    <div class="form-group">
                        <label>Director</label>
                        <input type="text" class="form-control" name="director" value="${escapeHTML(item.director || '')}">
                    </div>
                </div>
            ` : `
                <div class="form-row">
                    <div class="form-group">
                        <label>Total Episodes</label>
                        <input type="number" class="form-control" name="episodes" value="${item.episodes || ''}">
                    </div>
                    <div class="form-group">
                        <label>Studio</label>
                        <input type="text" class="form-control" name="studio" value="${escapeHTML(item.studio || '')}">
                    </div>
                </div>
            `}
            <div class="form-group">
                <label>Synopsis / Story</label>
                <textarea class="form-control" name="synopsis" rows="4">${escapeHTML(item.synopsis || '')}</textarea>
            </div>
            <button type="submit" class="btn-primary" style="width:100%;">Save Changes</button>
        </form>
    `;
    showModal(`Edit ${isMovie ? 'Movie' : 'Anime'} Details`, formHTML);
};

window.updateTitleDetails = async function(event, type, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {};
    formData.forEach((value, key) => {
        if (key === 'genres') {
            payload[key] = value.split(',').map(g => g.trim()).filter(Boolean);
        } else if (key === 'year' || key === 'rating' || key === 'episodes') {
            payload[key] = Number(value);
        } else {
            payload[key] = value;
        }
    });

    try {
        const endpoint = type === 'movie' ? `/api/admin/movies/${id}` : `/api/admin/anime/${id}`;
        const res = await apiCall(endpoint, 'PUT', payload);
        if (res.success) {
            showToast('Catalog details successfully updated.', 'success');
            closeModal();
            if (type === 'movie') renderMoviesModule();
            else renderAnimeModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteTitle = async function(type, id) {
    if (confirm('Are you sure you want to delete this title from the database catalog?')) {
        try {
            const endpoint = type === 'movie' ? `/api/admin/movies/${id}` : `/api/admin/anime/${id}`;
            const res = await apiCall(endpoint, 'DELETE');
            if (res.success) {
                showToast('Entry removed successfully.', 'info');
                if (type === 'movie') renderMoviesModule();
                else renderAnimeModule();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 10. Module: Content Requests Inbox
async function renderRequestsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Title Name</th>
                                <th>Requested Category</th>
                                <th>User Notes</th>
                                <th>Requestor</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="requests-list-body">
                            <tr><td colspan="6" class="text-center">Loading requests...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const body = document.getElementById('requests-list-body');
    const res = await apiCall('/api/admin/content-requests');
    if (!res.success) return;

    adminState.requests = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center">No missing title requests registered.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(req => {
        let tag = 'status-pending';
        if (req.status === 'approved') tag = 'status-approved';
        if (req.status === 'rejected') tag = 'status-rejected';

        return `
            <tr>
                <td><strong>${escapeHTML(req.title)}</strong></td>
                <td><span style="text-transform: capitalize;">${req.type}</span></td>
                <td>${escapeHTML(req.notes || 'None')}</td>
                <td>${escapeHTML(req.username)}</td>
                <td><span class="status-tag ${tag}">${req.status}</span></td>
                <td>
                    ${req.status === 'pending' ? `
                        <div class="btn-group">
                            <button class="btn-icon btn-icon-success" title="Approve Request" onclick="handleContentRequest(${req.id}, 'approved')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon btn-icon-danger" title="Reject Request" onclick="handleContentRequest(${req.id}, 'rejected')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : 'Processed'}
                </td>
            </tr>
        `;
    }).join('');
}

window.handleContentRequest = async function(reqId, status) {
    try {
        const res = await apiCall(`/api/admin/content-requests/${reqId}`, 'PUT', { status });
        if (res.success) {
            showToast(`Request has been marked as ${status}.`, 'info');
            renderRequestsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// 11. Module: Genres & Categories Management
async function renderGenresModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card">
                <div class="card-header" style="border-bottom:none; margin-bottom:0;">
                    <h3>Manage Media Genres</h3>
                </div>
                <div style="display:flex; gap:12px; margin-bottom:20px;">
                    <input type="text" id="new-genre-input" class="form-control" style="max-width:280px;" placeholder="Add new genre name (e.g. Comedy)">
                    <button class="btn-primary" onclick="addNewGenreTag()"><i class="fas fa-plus"></i> Add Genre</button>
                </div>
                <hr style="border-color:var(--border-color); margin-bottom:16px;">
                <div class="genres-list-tags" id="genres-tag-container">
                    <p style="color:var(--text-muted);">Fetching genres list...</p>
                </div>
            </div>
        </div>
    `;
    await loadGenresTags();
}

async function loadGenresTags() {
    const container = document.getElementById('genres-tag-container');
    const res = await apiCall('/api/admin/genres');
    if (!res.success) return;

    if (res.data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No genres defined.</p>';
        return;
    }

    container.innerHTML = res.data.map(genre => `
        <div class="genre-tag">
            <span>${escapeHTML(genre)}</span>
            <button onclick="deleteGenreTag('${encodeURIComponent(genre)}')" title="Remove"><i class="fas fa-times-circle"></i></button>
        </div>
    `).join('');
}

window.addNewGenreTag = async function() {
    const input = document.getElementById('new-genre-input');
    const genre = input.value.trim();
    if (!genre) return;

    try {
        const res = await apiCall('/api/admin/genres', 'POST', { genre });
        if (res.success) {
            showToast(`Genre "${genre}" successfully added.`, 'success');
            input.value = '';
            loadGenresTags();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteGenreTag = async function(genreName) {
    const decName = decodeURIComponent(genreName);
    if (confirm(`Remove the genre tag "${decName}"?`)) {
        try {
            const res = await apiCall(`/api/admin/genres/${genreName}`, 'DELETE');
            if (res.success) {
                showToast(`Genre "${decName}" removed.`, 'info');
                loadGenresTags();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 12. Module: Review Moderation Center
async function renderReviewsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Title ID</th>
                                <th>Rating</th>
                                <th>Content Snip</th>
                                <th>Privacy / Featured</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="reviews-mod-body">
                            <tr><td colspan="6" class="text-center">Loading reviews...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const body = document.getElementById('reviews-mod-body');
    const res = await apiCall('/api/admin/reviews');
    if (!res.success) return;

    adminState.reviews = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center">No reviews submitted on the site.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(rev => {
        const isFeatured = rev.privacy === 'featured';
        const isHidden = rev.privacy === 'private';
        const pinIcon = isFeatured ? 'fa-thumbtack' : 'fa-thumbtack';
        const pinTitle = isFeatured ? 'Unpin from Featured' : 'Pin to Homepage Featured';
        const hideIcon = isHidden ? 'fa-eye' : 'fa-eye-slash';
        const hideTitle = isHidden ? 'Approve & Show' : 'Hide from Public';

        return `
            <tr>
                <td><strong>${escapeHTML(rev.user)}</strong></td>
                <td>ID: ${rev.movieId}</td>
                <td><strong>★ ${rev.rating}/10</strong></td>
                <td style="max-width:260px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${escapeHTML(rev.content)}
                </td>
                <td>
                    ${isFeatured ? '<span class="status-tag status-approved">Featured</span>' : ''}
                    ${isHidden ? '<span class="status-tag status-banned">Hidden</span>' : ''}
                    ${!isFeatured && !isHidden ? '<span class="status-tag status-info">Public</span>' : ''}
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn-icon ${isFeatured ? 'btn-icon-success' : ''}" title="${pinTitle}" onclick="toggleReviewFeature(${rev.id}, ${!isFeatured})">
                            <i class="fas ${pinIcon}"></i>
                        </button>
                        <button class="btn-icon ${isHidden ? 'btn-icon-warning' : ''}" title="${hideTitle}" onclick="toggleReviewVisibility(${rev.id}, ${isHidden ? 'public' : 'private'})">
                            <i class="fas ${hideIcon}"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger" title="Delete Review" onclick="deleteReviewEntity(${rev.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.toggleReviewFeature = async function(revId, featureState) {
    try {
        const payload = { privacy: featureState ? 'featured' : 'public' };
        const res = await apiCall(`/api/admin/reviews/${revId}`, 'PUT', payload);
        if (res.success) {
            showToast(featureState ? 'Review pinned to homepage!' : 'Review unpinned.', 'success');
            renderReviewsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.toggleReviewVisibility = async function(revId, privacyState) {
    try {
        const res = await apiCall(`/api/admin/reviews/${revId}`, 'PUT', { privacy: privacyState });
        if (res.success) {
            showToast(`Review is now ${privacyState === 'public' ? 'visible' : 'hidden'}.`, 'info');
            renderReviewsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteReviewEntity = async function(revId) {
    if (confirm('Permanently delete this user review? This changes the author\'s review counts.')) {
        try {
            const res = await apiCall(`/api/admin/reviews/${revId}`, 'DELETE');
            if (res.success) {
                showToast('Review removed.', 'success');
                renderReviewsModule();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 13. Module: Comments Control
async function renderCommentsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Parent Review</th>
                                <th>Comment Content</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="comments-mod-body">
                            <tr><td colspan="6" class="text-center">Loading comments...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const body = document.getElementById('comments-mod-body');
    const res = await apiCall('/api/admin/comments');
    if (!res.success) return;

    adminState.comments = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="text-center">No comments logged in the system.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(comment => {
        const isHidden = comment.status === 'hidden';
        const hideIcon = isHidden ? 'fa-eye' : 'fa-eye-slash';
        const hideTitle = isHidden ? 'Approve & Show' : 'Hide Comment';

        return `
            <tr>
                <td><strong>${escapeHTML(comment.username)}</strong></td>
                <td>ID: ${comment.reviewId}</td>
                <td style="max-width:240px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${escapeHTML(comment.content)}
                </td>
                <td>
                    <span class="status-tag ${isHidden ? 'status-banned' : 'status-approved'}">
                        ${comment.status || 'Approved'}
                    </span>
                </td>
                <td>${new Date(comment.date).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-icon" title="${hideTitle}" onclick="toggleCommentVisibility(${comment.id}, '${isHidden ? 'approved' : 'hidden'}')">
                            <i class="fas ${hideIcon}"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger" title="Delete Comment" onclick="deleteCommentEntity(${comment.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.toggleCommentVisibility = async function(commentId, state) {
    try {
        const res = await apiCall(`/api/admin/comments/${commentId}`, 'PUT', { status: state });
        if (res.success) {
            showToast(`Comment status updated to ${state}.`, 'info');
            renderCommentsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteCommentEntity = async function(commentId) {
    if (confirm('Permanently remove this comment from the review?')) {
        try {
            const res = await apiCall(`/api/admin/comments/${commentId}`, 'DELETE');
            if (res.success) {
                showToast('Comment deleted successfully.', 'success');
                renderCommentsModule();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 14. Module: Reports Inbox & Moderation
async function renderReportsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Reporter</th>
                                <th>Content Type</th>
                                <th>Content ID</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="reports-inbox-body">
                            <tr><td colspan="7" class="text-center">Loading reports...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const body = document.getElementById('reports-inbox-body');
    const res = await apiCall('/api/admin/reports');
    if (!res.success) return;

    adminState.reports = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="text-center">Inbox clean! No reports pending.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(rep => {
        let tag = 'status-pending';
        if (rep.status === 'resolved') tag = 'status-approved';
        if (rep.status === 'dismissed') tag = 'status-info';

        return `
            <tr>
                <td><strong>${escapeHTML(rep.reporterName)}</strong></td>
                <td><span class="status-tag status-info">${rep.contentType}</span></td>
                <td>ID: ${rep.contentId}</td>
                <td>${escapeHTML(rep.reason)}</td>
                <td><span class="status-tag ${tag}">${rep.status}</span></td>
                <td>${new Date(rep.date).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-icon" title="View Details" onclick="showReportDetailsModal(${rep.id})">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.showReportDetailsModal = function(reportId) {
    const rep = adminState.reports.find(r => r.id === reportId);
    if (!rep) return;

    const modalHTML = `
        <div style="font-size:0.9rem; line-height:1.6;">
            <p><strong>Reporter:</strong> ${escapeHTML(rep.reporterName)} (ID: ${rep.reporterId})</p>
            <p><strong>Content Type:</strong> ${rep.contentType.toUpperCase()}</p>
            <p><strong>Content Item ID:</strong> ${rep.contentId}</p>
            <p><strong>Reporting Reason:</strong> ${escapeHTML(rep.reason)}</p>
            <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; margin:14px 0; border:1px solid var(--border-color);">
                <strong>Reporter Details:</strong><br>
                ${escapeHTML(rep.details || 'No additional details provided.')}
            </div>
            ${rep.status === 'pending' ? `
                <div style="display:flex; gap:10px; margin-top:16px;">
                    <button class="btn-primary" style="flex:1; background:var(--success);" onclick="resolveReport(${rep.id}, 'resolved')">Resolve Report</button>
                    <button class="btn-primary" style="flex:1; background:var(--text-muted);" onclick="resolveReport(${rep.id}, 'dismissed')">Dismiss Report</button>
                </div>
            ` : `<p><strong>Status:</strong> Resolved as ${rep.status.toUpperCase()}</p>`}
        </div>
    `;
    showModal(`Report Audit Trail (ID: ${rep.id})`, modalHTML);
};

window.resolveReport = async function(reportId, state) {
    try {
        const res = await apiCall(`/api/admin/reports/${reportId}`, 'PUT', { status: state });
        if (res.success) {
            showToast(`Report marked as ${state}.`, 'success');
            closeModal();
            renderReportsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// 15. Module: Homepage Configuration
async function renderHomepageModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card" style="margin-bottom:24px;">
                <div class="card-header">
                    <h3>Homepage Hero Banners</h3>
                    <button class="btn-primary" onclick="addNewSliderSlide()"><i class="fas fa-plus"></i> Add Slide</button>
                </div>
                <div id="homepage-banners-list">
                    <p style="color:var(--text-muted)">Loading slider layout...</p>
                </div>
            </div>
        </div>
    `;

    const container = document.getElementById('homepage-banners-list');
    const res = await apiCall('/api/admin/homepage');
    if (!res.success) return;

    adminState.homepageConfig = res.data;

    if (!res.data.heroSlides || res.data.heroSlides.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); padding:16px 0;">No banner slides configured. Will fallback to template slides.</p>';
        return;
    }

    container.innerHTML = res.data.heroSlides.map((slide, idx) => `
        <div class="carousel-slide-item">
            <div>
                <strong>Slide #${idx + 1}: ${escapeHTML(slide.title)}</strong>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Target Title ID: ${slide.id} (${slide.type})</div>
            </div>
            <div class="btn-group">
                <button class="btn-icon btn-icon-danger" title="Remove slide" onclick="deleteSliderSlide(${idx})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.addNewSliderSlide = function() {
    const modalHTML = `
        <form onsubmit="saveNewSliderSlide(event)">
            <div class="form-group">
                <label>Slide Title Name *</label>
                <input type="text" class="form-control" name="title" required>
            </div>
            <div class="form-group">
                <label>Slide Subtitle / Description</label>
                <input type="text" class="form-control" name="subtitle">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Target ID *</label>
                    <input type="number" class="form-control" name="id" required>
                </div>
                <div class="form-group">
                    <label>Target Category</label>
                    <select class="form-control" name="type">
                        <option value="movie">Movie</option>
                        <option value="anime">Anime</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Custom Slide Image URL (Optional)</label>
                <input type="url" class="form-control" name="image" placeholder="https://unsplash.com/...">
            </div>
            <button type="submit" class="btn-primary" style="width:100%;">Append Slide</button>
        </form>
    `;
    showModal('Add Homepage Hero Slide', modalHTML);
};

window.saveNewSliderSlide = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newSlide = {
        title: formData.get('title'),
        subtitle: formData.get('subtitle'),
        id: Number(formData.get('id')),
        type: formData.get('type'),
        image: formData.get('image') || ''
    };

    const currentSlides = adminState.homepageConfig.heroSlides || [];
    currentSlides.push(newSlide);

    try {
        const res = await apiCall('/api/admin/homepage', 'PUT', { heroSlides: currentSlides });
        if (res.success) {
            showToast('Homepage hero carousel updated.', 'success');
            closeModal();
            renderHomepageModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteSliderSlide = async function(index) {
    if (confirm('Delete this hero banner slide?')) {
        const currentSlides = adminState.homepageConfig.heroSlides || [];
        currentSlides.splice(index, 1);
        try {
            const res = await apiCall('/api/admin/homepage', 'PUT', { heroSlides: currentSlides });
            if (res.success) {
                showToast('Slide removed.', 'info');
                renderHomepageModule();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 16. Module: Branding Settings (Website Branding)
async function renderBrandingModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card" style="max-width:650px;">
                <form id="branding-settings-form" onsubmit="saveBrandingSettings(event)">
                    <div class="form-group">
                        <label>Website Name Branding</label>
                        <input type="text" class="form-control" id="set-siteName" required>
                    </div>
                    <div class="form-group">
                        <label>Branding Logo Image URL</label>
                        <input type="text" class="form-control" id="set-logoUrl" placeholder="Leave empty for text logo icon">
                    </div>
                    <div class="form-group">
                        <label>Site Favicon URL</label>
                        <input type="text" class="form-control" id="set-faviconUrl">
                    </div>
                    <div class="form-group">
                        <label>Admin Support Contact Email</label>
                        <input type="email" class="form-control" id="set-contactEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Footer Copyright Text</label>
                        <input type="text" class="form-control" id="set-footerText" required>
                    </div>
                    <div class="form-group">
                        <label>Active Theme Selection</label>
                        <select class="form-control" id="set-theme">
                            <option value="dark">Dark Theme (MovAni Dark)</option>
                            <option value="light">Light Slate Theme</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary" style="margin-top:10px;">Save Configuration</button>
                </form>
            </div>
        </div>
    `;

    const res = await apiCall('/api/admin/settings');
    if (!res.success) return;

    res.data.forEach(setting => {
        const input = document.getElementById(`set-${setting.key}`);
        if (input) {
            input.value = setting.value;
        }
    });
}

window.saveBrandingSettings = async function(event) {
    event.preventDefault();
    const payload = {
        siteName: document.getElementById('set-siteName').value,
        logoUrl: document.getElementById('set-logoUrl').value,
        faviconUrl: document.getElementById('set-faviconUrl').value,
        contactEmail: document.getElementById('set-contactEmail').value,
        footerText: document.getElementById('set-footerText').value,
        theme: document.getElementById('set-theme').value
    };

    try {
        const res = await apiCall('/api/admin/settings', 'PUT', payload);
        if (res.success) {
            showToast('Branding configurations updated successfully.', 'success');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// 17. Module: Advertisement Campaigns Management
async function renderAdsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="module-header">
                <h3>Active Advertisement Slots</h3>
                <button class="btn-primary" onclick="showAddAdModal()"><i class="fas fa-plus-circle"></i> Add Ad Slot</button>
            </div>
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Ad Campaign</th>
                                <th>Target Url</th>
                                <th>Page Slot</th>
                                <th>Impressions</th>
                                <th>Clicks</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ads-list-body">
                            <tr><td colspan="7" class="text-center">Loading ads...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const body = document.getElementById('ads-list-body');
    const res = await apiCall('/api/admin/ads');
    if (!res.success) return;

    adminState.ads = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="text-center">No promo banner campaigns active.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(ad => `
        <tr>
            <td>
                <div class="table-media-item">
                    <img src="${escapeHTML(ad.imageUrl)}" alt="" style="width:48px; height:48px; border-radius:8px;">
                    <span class="media-title">${escapeHTML(ad.title)}</span>
                </div>
            </td>
            <td><a href="${escapeHTML(ad.targetUrl)}" target="_blank" style="color:var(--primary); font-size:0.8rem;">Link <i class="fas fa-external-link-alt"></i></a></td>
            <td><span class="status-tag status-info" style="text-transform:uppercase;">${ad.slot}</span></td>
            <td>${ad.impressions}</td>
            <td>${ad.clicks}</td>
            <td>
                <span class="status-tag ${ad.active ? 'status-approved' : 'status-banned'}">
                    ${ad.active ? 'Active' : 'Paused'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn-icon" title="Toggle Campaign" onclick="toggleAdState(${ad.id}, ${!ad.active})">
                        <i class="fas ${ad.active ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Delete Ad" onclick="deleteAdCampaign(${ad.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.showAddAdModal = function() {
    const modalHTML = `
        <form onsubmit="saveNewAd(event)">
            <div class="form-group">
                <label>Campaign Title *</label>
                <input type="text" class="form-control" name="title" required>
            </div>
            <div class="form-group">
                <label>Banner Image URL *</label>
                <input type="url" class="form-control" name="imageUrl" required>
            </div>
            <div class="form-group">
                <label>Target Redirect URL</label>
                <input type="url" class="form-control" name="targetUrl" value="https://">
            </div>
            <div class="form-group">
                <label>Display Banner Slot</label>
                <select class="form-control" name="slot">
                    <option value="sidebar">Right Sidebar Spot</option>
                    <option value="banner">Leaderboard Main Header Banner</option>
                    <option value="popup">Overlay Dialog Popup</option>
                </select>
            </div>
            <button type="submit" class="btn-primary" style="width:100%;">Launch Campaign</button>
        </form>
    `;
    showModal('Launch Advertisement Slot', modalHTML);
};

window.saveNewAd = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
        title: formData.get('title'),
        imageUrl: formData.get('imageUrl'),
        targetUrl: formData.get('targetUrl'),
        slot: formData.get('slot'),
        active: true
    };

    try {
        const res = await apiCall('/api/admin/ads', 'POST', payload);
        if (res.success) {
            showToast('Ad slot launched successfully.', 'success');
            closeModal();
            renderAdsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.toggleAdState = async function(adId, state) {
    try {
        const res = await apiCall(`/api/admin/ads/${adId}`, 'PUT', { active: state });
        if (res.success) {
            showToast(`Campaign ${state ? 'resumed' : 'paused'}`, 'info');
            renderAdsModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteAdCampaign = async function(adId) {
    if (confirm('Are you sure you want to permanently delete this ad slot?')) {
        try {
            const res = await apiCall(`/api/admin/ads/${adId}`, 'DELETE');
            if (res.success) {
                showToast('Campaign slot deleted.', 'info');
                renderAdsModule();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 18. Module: Security Audit & IP Ban
async function renderSecurityModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <!-- Active Sessions -->
            <div class="dashboard-table-card" style="margin-bottom:24px;">
                <div class="card-header">
                    <h3>Active Administrative Sessions</h3>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Platform Device</th>
                                <th>Logged IP</th>
                                <th>Login Time</th>
                            </tr>
                        </thead>
                        <tbody id="security-sessions-body">
                            <tr><td colspan="4" class="text-center">Querying sessions...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Login Logs & IP Blocks Side-by-Side -->
            <div class="dashboard-grid">
                <!-- IP blocks -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>IP Traffic Restrictions</h3>
                    </div>
                    <div style="display:flex; gap:10px; margin-bottom:16px;">
                        <input type="text" id="new-ip-block-input" class="form-control" placeholder="Block IP address (e.g. 203.0.113.5)">
                        <button class="btn-primary" onclick="blockNewIPAddress()"><i class="fas fa-user-slash"></i> Ban IP</button>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Banned IP Address</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="security-ip-blocks-body">
                                <tr><td colspan="2" class="text-center">Loading list...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent authentication logs -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>Recent Authentication Events</h3>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>IP</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody id="security-logins-body">
                                <tr><td colspan="3" class="text-center">Loading logs...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 1. Fetch Sessions
    const sessRes = await apiCall('/api/admin/security/sessions');
    const sessBody = document.getElementById('security-sessions-body');
    if (sessRes.success) {
        sessBody.innerHTML = sessRes.data.map(sess => `
            <tr>
                <td><strong>${escapeHTML(sess.username)}</strong> <span class="status-tag status-info" style="font-size:0.6rem;">${sess.role}</span></td>
                <td>${escapeHTML(sess.device)}</td>
                <td><code>${escapeHTML(sess.ip)}</code></td>
                <td>${new Date(sess.loginTime).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    }

    // 2. Fetch IP blocks
    await loadSecurityIPBlocks();

    // 3. Fetch Login logs
    const loginRes = await apiCall('/api/admin/security/login-logs');
    const loginBody = document.getElementById('security-logins-body');
    if (loginRes.success) {
        loginBody.innerHTML = loginRes.data.map(log => `
            <tr>
                <td>
                    <span class="status-tag ${log.status === 'Success' ? 'status-approved' : 'status-banned'}">
                        ${log.status}
                    </span>
                    <span style="font-size:0.75rem; display:block; color:var(--text-secondary);">${escapeHTML(log.email)}</span>
                </td>
                <td><code>${escapeHTML(log.ip)}</code></td>
                <td>${new Date(log.date).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    }
}

async function loadSecurityIPBlocks() {
    const body = document.getElementById('security-ip-blocks-body');
    const res = await apiCall('/api/admin/settings');
    if (!res.success) return;

    const blockedSetting = res.data.find(s => s.key === 'blockedIPs');
    const list = blockedSetting ? blockedSetting.value || [] : [];

    if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="2" class="text-center">No firewall IP bans active.</td></tr>';
        return;
    }

    body.innerHTML = list.map(ip => `
        <tr>
            <td><code>${escapeHTML(ip)}</code></td>
            <td>
                <button class="btn-icon btn-icon-success" title="Unban IP" onclick="removeIPBlock('${ip}')">
                    <i class="fas fa-trash-restore"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.blockNewIPAddress = async function() {
    const input = document.getElementById('new-ip-block-input');
    const ip = input.value.trim();
    if (!ip) return;

    try {
        const res = await apiCall('/api/admin/security/ip-block', 'POST', { ip });
        if (res.success) {
            showToast(`IP ${ip} is now blocked from visiting.`, 'success');
            input.value = '';
            loadSecurityIPBlocks();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.removeIPBlock = async function(ip) {
    if (confirm(`Lift traffic restrictions for IP: ${ip}?`)) {
        try {
            const res = await apiCall(`/api/admin/security/ip-block/${ip}`, 'DELETE');
            if (res.success) {
                showToast(`IP ${ip} restored.`, 'info');
                loadSecurityIPBlocks();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 19. Module: System API reference & Keys
async function renderAPIModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-grid">
                <!-- APIs catalog -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>Web Service Endpoints</h3>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>API Calls Today</th>
                                </tr>
                            </thead>
                            <tbody id="api-endpoints-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- API Keys list -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>Client Integrations</h3>
                        <button class="btn-primary" onclick="generateSimulatedAPIKey()"><i class="fas fa-plus"></i> Generate Key</button>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>API Key Prefix</th>
                                    <th>Device / description</th>
                                </tr>
                            </thead>
                            <tbody id="api-keys-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    const res = await apiCall('/api/admin/api-management');
    if (!res.success) return;

    document.getElementById('api-endpoints-body').innerHTML = res.endpoints.map(ep => `
        <tr>
            <td>
                <span class="status-tag status-info" style="font-size:0.65rem; width:54px; justify-content:center;">${ep.method}</span>
                <code style="margin-left:8px; font-weight:600;">${escapeHTML(ep.path)}</code>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHTML(ep.description)}</div>
            </td>
            <td><strong>${ep.callsToday}</strong></td>
        </tr>
    `).join('');

    document.getElementById('api-keys-body').innerHTML = res.apiKeys.map(k => `
        <tr>
            <td><code>${escapeHTML(k.key)}</code></td>
            <td>${escapeHTML(k.description)}</td>
        </tr>
    `).join('');
}

window.generateSimulatedAPIKey = function() {
    showToast('Simulated developer API key generated!', 'success');
};

// 20. Module: Mail Center (Email management)
async function renderEmailModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-grid">
                <!-- Templates -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>System Mail Templates</h3>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Template Name</th>
                                    <th>Subject Line</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="email-templates-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Dispatch Simulation -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>Simulate Mail Delivery</h3>
                    </div>
                    <form onsubmit="simulateMailSend(event)">
                        <div class="form-group">
                            <label>Recipient Email Address</label>
                            <input type="email" class="form-control" name="recipient" required placeholder="user@example.com">
                        </div>
                        <div class="form-group">
                            <label>Subject Line</label>
                            <input type="text" class="form-control" name="subject" required>
                        </div>
                        <div class="form-group">
                            <label>Body HTML Message</label>
                            <textarea class="form-control" name="body" rows="4" required></textarea>
                        </div>
                        <button type="submit" class="btn-primary" style="width:100%;">Dispatch Simulated Mail</button>
                    </form>
                </div>
            </div>

            <!-- Email dispatch log -->
            <div class="dashboard-table-card" style="margin-top:24px;">
                <div class="card-header">
                    <h3>Sent Mail Logs</h3>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Subject Topic</th>
                                <th>Delivery Status</th>
                                <th>Dispatch Date</th>
                            </tr>
                        </thead>
                        <tbody id="email-logs-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const res = await apiCall('/api/admin/emails');
    if (!res.success) return;

    document.getElementById('email-templates-body').innerHTML = res.templates.map(t => `
        <tr>
            <td><strong>${escapeHTML(t.name)}</strong></td>
            <td>${escapeHTML(t.subject)}</td>
            <td>
                <button class="btn-icon" title="Preview Template HTML" onclick="showMailTemplatePreview('${t.name}', '${escapeJSString(t.body)}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('email-logs-body').innerHTML = res.log.map(l => `
        <tr>
            <td><code>${escapeHTML(l.recipient)}</code></td>
            <td>${escapeHTML(l.subject)}</td>
            <td><span class="status-tag status-approved">${escapeHTML(l.status)}</span></td>
            <td>${new Date(l.date).toLocaleString()}</td>
        </tr>
    `).join('');
}

window.showMailTemplatePreview = function(name, body) {
    showModal(`Template: ${name}`, `<div style="background:white; color:black; padding:20px; border-radius:8px; border:1px solid var(--border-color);">${body}</div>`);
};

window.simulateMailSend = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
        recipient: formData.get('recipient'),
        subject: formData.get('subject'),
        body: formData.get('body')
    };

    try {
        const res = await apiCall('/api/admin/emails/send', 'POST', payload);
        if (res.success) {
            showToast('Mail dispatch simulation successful.', 'success');
            event.target.reset();
            renderEmailModule();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// 21. Module: System Backups
async function renderBackupsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="module-header">
                <h3>System Snapshot Backups</h3>
                <button class="btn-primary" onclick="triggerSystemBackup()"><i class="fas fa-save"></i> Take Snapshot</button>
            </div>
            <div class="backup-grid" id="backups-grid-container">
                <p style="color:var(--text-muted)">Loading backups archives...</p>
            </div>
        </div>
    `;
    await loadBackupsGrid();
}

async function loadBackupsGrid() {
    const container = document.getElementById('backups-grid-container');
    const res = await apiCall('/api/admin/backups');
    if (!res.success) return;

    if (res.data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No snapshot files found on the server.</p>';
        return;
    }

    container.innerHTML = res.data.map(b => `
        <div class="backup-card">
            <div class="backup-info">
                <h4>${escapeHTML(b.filename)}</h4>
                <div class="backup-meta">
                    <div>Size: ${(b.size / 1024).toFixed(2)} KB</div>
                    <div>Created: ${new Date(b.created).toLocaleString()}</div>
                </div>
            </div>
            <div style="display:flex; gap:10px; margin-top: auto;">
                <button class="btn-primary" style="flex:1; padding:6px 12px; font-size:0.8rem; background:var(--success);" onclick="restoreSystemBackup('${b.filename}')">Restore</button>
                <button class="btn-primary" style="flex:none; padding:6px 12px; background:var(--danger);" title="Delete file" onclick="deleteBackupFile('${b.filename}')"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

window.triggerSystemBackup = async function() {
    showToast('Compressing and exporting databases...', 'info');
    try {
        const res = await apiCall('/api/admin/backups', 'POST');
        if (res.success) {
            showToast(`Snapshot ${res.filename} saved successfully.`, 'success');
            loadBackupsGrid();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.restoreSystemBackup = async function(filename) {
    if (confirm(`CRITICAL WARNING: Restoring the system database to ${filename} will replace all current database collections. Do you wish to continue?`)) {
        showToast('Restoring collection states...', 'info');
        try {
            const res = await apiCall('/api/admin/backups/restore', 'POST', { filename });
            if (res.success) {
                showToast('System snapshot restored successfully!', 'success');
                refreshDashboardData();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

window.deleteBackupFile = async function(filename) {
    if (confirm(`Permanently delete the backup file "${filename}"?`)) {
        try {
            const res = await apiCall(`/api/admin/backups/${filename}`, 'DELETE');
            if (res.success) {
                showToast('Backup archive deleted.', 'info');
                loadBackupsGrid();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// 22. Module: Audit Trails (Activity Logs)
async function renderAuditModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-table-card">
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User Account</th>
                                <th>Action Label</th>
                                <th>Details</th>
                                <th>Client IP</th>
                            </tr>
                        </thead>
                        <tbody id="audit-logs-body">
                            <tr><td colspan="5" class="text-center">Loading audit logs...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const body = document.getElementById('audit-logs-body');
    const res = await apiCall('/api/admin/activity-logs');
    if (!res.success) return;

    adminState.activityLogs = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="text-center">No logs found.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(log => `
        <tr>
            <td>${new Date(log.date).toLocaleString()}</td>
            <td><strong>${escapeHTML(log.username)}</strong> <span style="font-size:0.7rem; color:var(--text-muted);">ID: ${log.userId}</span></td>
            <td><span class="status-tag status-info">${escapeHTML(log.action)}</span></td>
            <td>${escapeHTML(log.details)}</td>
            <td><code>${escapeHTML(log.ip)}</code></td>
        </tr>
    `).join('');
}

// 23. Module: System Broadcast Alerts & Notifications Control
async function renderNotificationsModule() {
    const canvas = document.getElementById('content-canvas');
    canvas.innerHTML = `
        <div class="module-panel">
            <div class="dashboard-grid">
                <!-- Broadcast Alert Dispatcher -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>Send Global Alert Banner</h3>
                    </div>
                    <form onsubmit="dispatchSystemAlert(event)">
                        <div class="form-group">
                            <label>Notification Header *</label>
                            <input type="text" class="form-control" name="title" required placeholder="e.g. Welcome back!">
                        </div>
                        <div class="form-group">
                            <label>Banner Body Text *</label>
                            <textarea class="form-control" name="message" rows="4" required placeholder="Information details for the alert..."></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Notification Level</label>
                                <select class="form-control" name="type">
                                    <option value="info">Info (cyan)</option>
                                    <option value="success">Success (green)</option>
                                    <option value="warning">Warning (amber)</option>
                                    <option value="error">Error (red)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Recipients</label>
                                <select class="form-control" name="userId">
                                    <option value="0">Broadcast to All Users</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary" style="width:100%;">Send System Alert</button>
                    </form>
                </div>

                <!-- Active notices lists -->
                <div class="dashboard-table-card">
                    <div class="card-header">
                        <h3>Active Announcements</h3>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Details</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="notifications-list-body">
                                <tr><td colspan="2" class="text-center">Loading list...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    await loadAnnouncementsTable();
}

async function loadAnnouncementsTable() {
    const body = document.getElementById('notifications-list-body');
    const res = await apiCall('/api/admin/notifications');
    if (!res.success) return;

    adminState.notifications = res.data;
    if (res.data.length === 0) {
        body.innerHTML = '<tr><td colspan="2" class="text-center">No system announcements published.</td></tr>';
        return;
    }

    body.innerHTML = res.data.map(notif => `
        <tr>
            <td>
                <span class="status-tag status-${notif.type || 'info'}" style="font-size:0.6rem;">${notif.type}</span>
                <strong style="display:block; margin:4px 0;">${escapeHTML(notif.title)}</strong>
                <span style="font-size:0.8rem; color:var(--text-secondary);">${escapeHTML(notif.message)}</span>
            </td>
            <td>
                <button class="btn-icon btn-icon-danger" title="Delete notification" onclick="deleteAnnouncementAlert(${notif.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.dispatchSystemAlert = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
        title: formData.get('title'),
        message: formData.get('message'),
        type: formData.get('type'),
        userId: Number(formData.get('userId'))
    };

    try {
        const res = await apiCall('/api/admin/notifications', 'POST', payload);
        if (res.success) {
            showToast('System announcement dispatched successfully.', 'success');
            event.target.reset();
            loadAnnouncementsTable();
            refreshDashboardData();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteAnnouncementAlert = async function(notifId) {
    if (confirm('Delete this system notification?')) {
        try {
            const res = await apiCall(`/api/admin/notifications/${notifId}`, 'DELETE');
            if (res.success) {
                showToast('Notification deleted.', 'info');
                loadAnnouncementsTable();
                refreshDashboardData();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// Reusable Utilities
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJSString(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
