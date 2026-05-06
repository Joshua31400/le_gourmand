// Variable to store user's current rating
let userCurrentRating = 0;

// Get recipe ID from URL
function getRecipeIdFromUrl() {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parseInt(parts[parts.length - 1]);
}

// Load recipe details
async function loadRecipe() {
    try {
        const recipeId = getRecipeIdFromUrl();
        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}`);
        const data = await response.json();

        if (data.success) {
            const recipe = data.data;
            renderRecipe(recipe);
            await checkUserInteractions(recipeId);
        } else {
            document.querySelector('main').innerHTML =
                '<p>Recipe not found.</p><a href="/home">Back to Home</a>';
        }
    } catch (error) {
        console.error('Error loading recipe:', error);
        document.querySelector('main').innerHTML =
            '<p>Error loading recipe.</p><a href="/home">Back to Home</a>';
    }
}

// Render recipe in the page
function renderRecipe(recipe) {
    const headerImg    = document.querySelector('.recipe-hero img');
    const headerTitle  = document.querySelector('.recipe-hero h1');
    const headerRating = document.querySelector('.recipe-hero .score');

    headerImg.src = recipe.picture;
    headerImg.alt = recipe.name;
    headerTitle.textContent = recipe.name;

    const avgRating    = recipe.average_rating ? parseFloat(recipe.average_rating).toFixed(1) : 'N/A';
    const totalRatings = recipe.total_ratings || 0;
    headerRating.textContent = `${avgRating} / 5 (${totalRatings} ratings)`;

    document.querySelector('#description p').textContent =
        recipe.description || 'No description available.';

    const infoDl = document.querySelector('#infos dl');
    infoDl.innerHTML = `
        <dt>Country:</dt><dd>${recipe.country_name || 'Unknown'}</dd>
        <dt>Type:</dt><dd>${recipe.type_name || 'Unknown'}</dd>
        <dt>Diet:</dt><dd>${recipe.diet_name || 'Unknown'}</dd>
        <dt>Created by:</dt><dd><a href="/profile/${recipe.user_id}">View profile</a></dd>
    `;

    const ingredientsList = document.querySelector('#ingredients ul');
    ingredientsList.innerHTML = recipe.ingredients?.length
        ? recipe.ingredients.map(i => `<li>${i.name}</li>`).join('')
        : '<li>No ingredients listed.</li>';

    const preparationList = document.querySelector('#preparation ol');
    if (recipe.preparation) {
        const steps = recipe.preparation.split('\n').filter(s => s.trim());
        preparationList.innerHTML = steps
            .map(s => `<li>${s.replace(/^\d+\.\s*/, '')}</li>`)
            .join('');
    } else {
        preparationList.innerHTML = '<li>No preparation steps available.</li>';
    }
}

// Check if recipe is in user's favorites and shared
async function checkUserInteractions(recipeId) {
    try {
        const token   = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user    = JSON.parse(userStr);
        const userId  = user.id;

        const favoritesRes  = await fetch(`${CONFIG.API_URL}/users/${userId}/favorites`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const favoritesData = await favoritesRes.json();
        const isFavorited   = favoritesData.success && favoritesData.data
            ? favoritesData.data.some(r => parseInt(r.id) === parseInt(recipeId))
            : false;
        updateFavoriteButton(isFavorited);

        const sharedRes  = await fetch(`${CONFIG.API_URL}/users/${userId}/shared`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const sharedData = await sharedRes.json();
        const isShared   = sharedData.success && sharedData.data
            ? sharedData.data.some(r => parseInt(r.id) === parseInt(recipeId))
            : false;
        updateShareButton(isShared);

    } catch (error) {
        console.error('Error checking user interactions:', error);
    }
}

// Update favorite button state
function updateFavoriteButton(isFavorited) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    favoriteBtn.textContent      = isFavorited ? '♥ Remove from favorites' : '♡ Add to favorites';
    favoriteBtn.dataset.favorited = isFavorited ? 'true' : 'false';
}

// Update share button state
function updateShareButton(isShared) {
    const shareBtn = document.getElementById('shareBtn');
    shareBtn.textContent   = isShared ? 'Unshare' : '↗ Share';
    shareBtn.dataset.shared = isShared ? 'true' : 'false';
}

// Toggle favorite
async function toggleFavorite() {
    try {
        const recipeId    = getRecipeIdFromUrl();
        const token       = localStorage.getItem('token');
        const favoriteBtn = document.getElementById('favoriteBtn');
        const isFavorited = favoriteBtn.dataset.favorited === 'true';

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/favorite`, {
            method: isFavorited ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            updateFavoriteButton(!isFavorited);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Error updating favorites');
    }
}

// Toggle share
async function toggleShare() {
    try {
        const recipeId = getRecipeIdFromUrl();
        const token    = localStorage.getItem('token');
        const shareBtn = document.getElementById('shareBtn');
        const isShared = shareBtn.dataset.shared === 'true';

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/share`, {
            method: isShared ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            updateShareButton(!isShared);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error toggling share:', error);
        alert('Error updating shared recipes');
    }
}

// Load user's current rating for this recipe
async function loadUserRating() {
    try {
        const recipeId = getRecipeIdFromUrl();
        const token    = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/my-rating`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            userCurrentRating = data.data.note;
            showUserRating();
        }
    } catch (error) {
        console.error('Error loading user rating:', error);
    }
}

// Show user's current rating in stars (via CSS classes)
function showUserRating() {
    const stars = document.querySelectorAll('.rating-stars .star');
    stars.forEach((star, index) => {
        star.classList.toggle('rated', index < userCurrentRating);
        star.classList.remove('hovered');
    });
}

// Highlight stars on hover (via CSS classes)
function highlightStars(rating) {
    const stars = document.querySelectorAll('.rating-stars .star');
    stars.forEach((star, index) => {
        star.classList.toggle('hovered', index < rating);
    });
}

// Rate recipe
async function rateRecipe(rating) {
    try {
        const recipeId = getRecipeIdFromUrl();
        const token    = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ note: rating })
        });
        const data = await response.json();

        if (data.success) {
            userCurrentRating = rating;
            showUserRating();
            await loadRecipe();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error rating recipe:', error);
        alert('Error submitting rating');
    }
}

// Setup rating stars inside the hero
function setupRatingStars() {
    const ratingContainer = document.getElementById('ratingStars');

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent   = '★';
        star.className     = 'star';
        star.dataset.rating = i;

        star.addEventListener('click',     () => rateRecipe(i));
        star.addEventListener('mouseover', () => highlightStars(i));

        ratingContainer.appendChild(star);
    }

    ratingContainer.addEventListener('mouseleave', () => showUserRating());
    showUserRating();
}

// Initialize page
async function init() {
    await loadRecipe();
    await loadUserRating();

    document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite);
    document.getElementById('shareBtn').addEventListener('click', toggleShare);

    setupRatingStars();
}

init();