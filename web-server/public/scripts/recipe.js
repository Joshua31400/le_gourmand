// Variable to store user's current rating
let userCurrentRating = 0;

// Get recipe ID from URL
function getRecipeIdFromUrl() {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parseInt(parts[parts.length - 1]); // Return as number
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

            // Check if recipe is in user's favorites and shared
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
    // Header: image, name, rating
    const headerImg = document.querySelector('article header img');
    const headerTitle = document.querySelector('article header h1');
    const headerRating = document.querySelector('article header p span');

    headerImg.src = recipe.picture || 'https://via.placeholder.com/300x200?text=No+Image';
    headerImg.alt = recipe.name;
    headerTitle.textContent = recipe.name;

    const avgRating = recipe.average_rating ? parseFloat(recipe.average_rating).toFixed(1) : 'N/A';
    const totalRatings = recipe.total_ratings || 0;
    headerRating.textContent = `${avgRating}/5 (${totalRatings} ratings)`;

    // Description
    document.querySelector('#description p').textContent =
        recipe.description || 'No description available.';

    // Information
    const infoDl = document.querySelector('#infos dl');
    infoDl.innerHTML = `
        <dt>Country:</dt>
        <dd>${recipe.country_name || 'Unknown'}</dd>
        <dt>Type:</dt>
        <dd>${recipe.type_name || 'Unknown'}</dd>
        <dt>Diet:</dt>
        <dd>${recipe.diet_name || 'Unknown'}</dd>
        <dt>Created by:</dt>
        <dd><a href="/profile/${recipe.user_id}">View profile</a></dd>
    `;

    // Ingredients
    const ingredientsList = document.querySelector('#ingredients ul');
    ingredientsList.innerHTML = '';

    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            ingredientsList.innerHTML += `<li>${ingredient.name}</li>`;
        });
    } else {
        ingredientsList.innerHTML = '<li>No ingredients listed.</li>';
    }

    // Preparation
    const preparationList = document.querySelector('#preparation ol');
    preparationList.innerHTML = '';

    if (recipe.preparation) {
        const steps = recipe.preparation.split('\n').filter(step => step.trim());
        steps.forEach(step => {
            const cleanStep = step.replace(/^\d+\.\s*/, '');
            if (cleanStep) {
                preparationList.innerHTML += `<li>${cleanStep}</li>`;
            }
        });
    } else {
        preparationList.innerHTML = '<li>No preparation steps available.</li>';
    }
}

// Check if recipe is in user's favorites and shared
async function checkUserInteractions(recipeId) {
    try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        const user = JSON.parse(userStr);
        const userId = user.id;

        // Get user's favorites
        const favoritesRes = await fetch(`${CONFIG.API_URL}/users/${userId}/favorites`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const favoritesData = await favoritesRes.json();

        // Check if current recipe is in favorites
        let isFavorited = false;
        if (favoritesData.success && favoritesData.data) {
            isFavorited = favoritesData.data.some(r => {
                return parseInt(r.id) === parseInt(recipeId);
            });
        }

        updateFavoriteButton(isFavorited);

        // Get user's shared recipes
        const sharedRes = await fetch(`${CONFIG.API_URL}/users/${userId}/shared`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const sharedData = await sharedRes.json();

        // Check if current recipe is shared
        let isShared = false;
        if (sharedData.success && sharedData.data) {
            isShared = sharedData.data.some(r => {
                return parseInt(r.id) === parseInt(recipeId);
            });
        }

        updateShareButton(isShared);

    } catch (error) {
        console.error('Error checking user interactions:', error);
    }
}

// Update favorite button state
function updateFavoriteButton(isFavorited) {
    const favoriteBtn = document.getElementById('favoriteBtn');

    if (isFavorited) {
        favoriteBtn.textContent = 'Remove from favorites';
        favoriteBtn.dataset.favorited = 'true';
    } else {
        favoriteBtn.textContent = 'Add to favorites';
        favoriteBtn.dataset.favorited = 'false';
    }
}

// Update share button state
function updateShareButton(isShared) {
    const shareBtn = document.getElementById('shareBtn');

    if (isShared) {
        shareBtn.textContent = 'Unshare';
        shareBtn.dataset.shared = 'true';
    } else {
        shareBtn.textContent = 'Share';
        shareBtn.dataset.shared = 'false';
    }
}

// Toggle favorite
async function toggleFavorite() {
    try {
        const recipeId = getRecipeIdFromUrl();
        const token = localStorage.getItem('token');
        const favoriteBtn = document.getElementById('favoriteBtn');
        const isFavorited = favoriteBtn.dataset.favorited === 'true';

        const method = isFavorited ? 'DELETE' : 'POST';

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/favorite`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
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
        const token = localStorage.getItem('token');
        const shareBtn = document.getElementById('shareBtn');
        const isShared = shareBtn.dataset.shared === 'true';

        const method = isShared ? 'DELETE' : 'POST';

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/share`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
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
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/my-rating`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            userCurrentRating = data.data.note;
            console.log('User current rating:', userCurrentRating);
            // Update stars to show current rating
            showUserRating();
        }
    } catch (error) {
        console.error('Error loading user rating:', error);
    }
}

// Show user's current rating in stars
function showUserRating() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < userCurrentRating) {
            star.style.color = '#ffd700'; // Gold for rated stars
        } else {
            star.style.color = '#ccc'; // Gray for unrated stars
        }
    });
}

// Rate recipe
async function rateRecipe(rating) {
    try {
        const recipeId = getRecipeIdFromUrl();
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/recipes/${recipeId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ note: rating })
        });

        const data = await response.json();

        if (data.success) {
            // Update current rating
            userCurrentRating = rating;

            // Show updated stars
            showUserRating();

            // Reload recipe to show updated average rating
            await loadRecipe();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error rating recipe:', error);
        alert('Error submitting rating');
    }
}

// Setup rating stars
function setupRatingStars() {
    const ratingContainer = document.getElementById('ratingStars');

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.className = 'star';
        star.dataset.rating = i;
        star.style.cursor = 'pointer';
        star.style.fontSize = '2rem';
        star.style.color = '#ccc';

        star.addEventListener('click', () => rateRecipe(i));

        star.addEventListener('mouseover', () => {
            highlightStars(i);
        });

        ratingContainer.addEventListener('mouseleave', () => {
            showUserRating();
        });

        ratingContainer.appendChild(star);
        showUserRating();
    }
}

// Highlight stars on hover
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffd700';
        } else {
            star.style.color = '#ccc';
        }
    });
}


// Initialize page
async function init() {
    // Load recipe data
    await loadRecipe();

    // Load user's rating for this recipe
    await loadUserRating();

    // Setup buttons
    document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite);
    document.getElementById('shareBtn').addEventListener('click', toggleShare);

    // Setup rating stars
    setupRatingStars();
}

// Run when page loads
init();