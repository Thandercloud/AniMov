document.addEventListener('DOMContentLoaded', function() {
    initGenreTags();
    initRatingSlider();
    initImagePreview();
    initFormSubmission();
});

const predefinedGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
    'Sci-Fi', 'Thriller', 'Documentary', 'Family', 'Musical',
    'Superhero', 'Historical', 'Sports', 'Psychological', 'Slice of Life'
];

function initGenreTags() {
    const container = document.getElementById('genre-tags');
    const customInput = document.getElementById('custom-genre');
    const selectedGenres = new Set();
    
    container.innerHTML = predefinedGenres.map(genre => `
        <span class="genre-tag" data-genre="${genre}">${genre}</span>
    `).join('');
    
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('genre-tag')) {
            const genre = e.target.dataset.genre;
            if (selectedGenres.has(genre)) {
                selectedGenres.delete(genre);
                e.target.classList.remove('selected');
            } else {
                selectedGenres.add(genre);
                e.target.classList.add('selected');
            }
            updateSelectedGenres();
        }
    });
    
    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && customInput.value.trim()) {
            e.preventDefault();
            const newGenre = customInput.value.trim();
            if (!selectedGenres.has(newGenre)) {
                selectedGenres.add(newGenre);
                const tag = document.createElement('span');
                tag.className = 'genre-tag selected';
                tag.textContent = newGenre;
                tag.dataset.genre = newGenre;
                container.appendChild(tag);
                updateSelectedGenres();
            }
            customInput.value = '';
        }
    });
    
    function updateSelectedGenres() {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'genres';
        hiddenInput.value = Array.from(selectedGenres).join(',');
        const existing = document.querySelector('input[name="genres"]');
        if (existing) existing.remove();
        document.getElementById('add-title-form').appendChild(hiddenInput);
    }
}

function initRatingSlider() {
    const slider = document.getElementById('rating-slider');
    const valueDisplay = document.getElementById('rating-value');
    
    slider.addEventListener('input', function() {
        valueDisplay.textContent = parseFloat(this.value).toFixed(1);
    });
}

function initImagePreview() {
    const posterInput = document.getElementById('poster');
    const preview = document.getElementById('image-preview');
    
    posterInput.addEventListener('input', function() {
        if (this.value) {
            preview.innerHTML = `<img src="${this.value}" alt="Poster Preview" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\'fas fa-image fa-3x\' style=\'color: var(--text-secondary);\'></i>'">`;
        } else {
            preview.innerHTML = '<i class="fas fa-image fa-3x" style="color: var(--text-secondary);"></i>';
        }
    });
}

function initFormSubmission() {
    const form = document.getElementById('add-title-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        const genreInput = this.querySelector('input[name="genres"]');
        data.genres = genreInput ? genreInput.value : '';
        
        data.rating = parseFloat(document.getElementById('rating-slider').value);
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        data.userId = currentUser ? currentUser.id : 0;
        data.added = new Date().toISOString();
        
        try {
            const response = await fetch('/api/movies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                alert('Title added successfully!');
                window.location.href = `details.html?id=${result.movie.id}&type=${result.movie.type}`;
            } else {
                alert(result.message || 'Failed to add title');
            }
        } catch (err) {
            console.error('Error adding movie/anime:', err);
            alert('Server error occurred while adding the title.');
        }
    });
}