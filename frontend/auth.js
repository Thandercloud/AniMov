// frontend/auth.js
// Client-side authentication logic

function initDemoLogin() {
    const demoLoginBtn = document.getElementById('demo-login-btn');
    const demoLoginFooter = document.getElementById('demo-login-footer');

    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }

    if (demoLoginFooter) {
        demoLoginFooter.addEventListener('click', handleDemoLogin);
    }
}

async function handleDemoLogin() {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@movani.com', password: 'demo123' })
        });
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            showMessage('Logged in as demo user! You can explore all features.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage(result.message || 'Demo login failed.', 'error');
        }
    } catch (error) {
        console.error('Demo login error:', error);
        showMessage('Server error. Ensure the backend is running.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isSignupPage = window.location.pathname.includes('signup.html');

    if (isLoginPage || isSignupPage) {
        initPasswordToggle();
        initFormValidation();
        initSocialButtons();
        initForgotPassword();
        initAvatarUpload();
        initGenrePreferences();
        initDemoLogin();

        const hash = window.location.hash.replace('#', '');
        if (hash === 'signup' && isLoginPage) {
            showTab('signup');
        } else if (hash === 'login' && isSignupPage) {
            showTab('login');
        }
    }

    checkAuthStatus();
}

function showTab(tabName) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.querySelector('.auth-tab:nth-child(1)');
    const signupTab = document.querySelector('.auth-tab:nth-child(2)');

    if (tabName === 'login') {
        if (loginForm) loginForm.classList.add('active');
        if (signupForm) signupForm.classList.remove('active');
        if (loginTab) loginTab.classList.add('active');
        if (signupTab) signupTab.classList.remove('active');
    } else {
        if (signupForm) signupForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
        if (signupTab) signupTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
    }
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

// Validation, toggles, and step management

function initPasswordToggle() {
    const toggleSignupPass = document.getElementById('toggle-signup-password');
    const signupPassInput = document.getElementById('signup-password');
    if (toggleSignupPass && signupPassInput) {
        toggleSignupPass.addEventListener('click', () => {
            const type = signupPassInput.type === 'password' ? 'text' : 'password';
            signupPassInput.type = type;
            toggleSignupPass.classList.toggle('fa-eye-slash');
        });
    }

    const toggleLoginPass = document.getElementById('toggle-login-password');
    const loginPassInput = document.getElementById('login-password');
    if (toggleLoginPass && loginPassInput) {
        toggleLoginPass.addEventListener('click', () => {
            const type = loginPassInput.type === 'password' ? 'text' : 'password';
            loginPassInput.type = type;
            toggleLoginPass.classList.toggle('fa-eye-slash');
        });
    }
}

function initFormValidation() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (result.success) {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    showMessage('Logged in successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showMessage(result.message || 'Invalid credentials.', 'error');
                }
            } catch (err) {
                console.error(err);
                showMessage('Server connection error.', 'error');
            }
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const result = await response.json();
                if (result.success) {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    const modal = document.getElementById('verification-modal');
                    if (modal) {
                        modal.style.display = 'flex';
                    } else {
                        showMessage('Registration successful!', 'success');
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1000);
                    }
                } else {
                    showMessage(result.message || 'Registration failed.', 'error');
                }
            } catch (err) {
                console.error(err);
                showMessage('Server connection error.', 'error');
            }
        });
    }
}

function initSocialButtons() {
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Social authentication is currently not configured.');
        });
    });
}

function initForgotPassword() {
    const link = document.querySelector('.forgot-link');
    if (link) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            alert('A simulated password reset code has been sent to your email.');
        });
    }
}

function initAvatarUpload() {
    const input = document.getElementById('avatar-input');
    const preview = document.getElementById('avatar-preview');
    if (input && preview) {
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function initGenrePreferences() {
    document.querySelectorAll('.genre-pref').forEach(pref => {
        pref.addEventListener('click', () => {
            pref.classList.toggle('active');
        });
    });
}

// Signup Multi-Step Form Stepper

function showStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    document.querySelectorAll('.signup-steps .step').forEach(step => {
        const stepVal = parseInt(step.dataset.step);
        if (stepVal <= stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function nextStep(stepNumber) {
    if (stepNumber === 2) {
        const username = document.getElementById('signup-username').value;
        if (!username.trim()) {
            showMessage('Please enter a username.', 'error');
            return;
        }
    } else if (stepNumber === 3) {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (!email.trim() || !password.trim()) {
            showMessage('Please fill out all fields.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }
    }
    showStep(stepNumber);
}

function prevStep(stepNumber) {
    showStep(stepNumber);
}

function closeVerificationModal() {
    const modal = document.getElementById('verification-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.location.href = 'index.html';
}

function resendVerification() {
    showMessage('Verification email resent!', 'success');
}

// Message/Notification Banner helper

function showMessage(message, type) {
    const existing = document.querySelector('.auth-message');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = `auth-message ${type}`;
    banner.style.position = 'fixed';
    banner.style.top = '20px';
    banner.style.right = '20px';
    banner.style.padding = '12px 24px';
    banner.style.borderRadius = '8px';
    banner.style.zIndex = '9999';
    banner.style.fontWeight = 'bold';
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    if (type === 'success') {
        banner.style.backgroundColor = '#10B981';
        banner.style.color = 'white';
    } else {
        banner.style.backgroundColor = '#EF4444';
        banner.style.color = 'white';
    }
    
    banner.textContent = message;
    document.body.appendChild(banner);

    setTimeout(() => {
        banner.remove();
    }, 3000);
}
