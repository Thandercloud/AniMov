// frontend/db.js
// Client-side helper for backend REST API calls

const db = {
    async registerUser(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Error registering user:', error);
            return { success: false, message: 'Server connection error.' };
        }
    },

    async loginUser(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Error logging in user:', error);
            return { success: false, message: 'Server connection error.' };
        }
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    },

    logoutUser() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
};

async function loginAsDemo() {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@movani.com', password: 'demo123' })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            alert('Logged in as demo user! You can explore all features.');
            window.location.href = 'index.html';
        } else {
            alert(result.message || 'Demo login failed.');
        }
    } catch (e) {
        console.error('Demo login error:', e);
        alert('Server connection error. Ensure the backend is running.');
    }
}
