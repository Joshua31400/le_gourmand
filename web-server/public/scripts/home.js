// Display username in welcome message
function displayUsername() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const welcomeTitle = document.querySelector('main h1');
        welcomeTitle.textContent = `Welcome to Le Gourmand, ${user.username}!`;
    }
}

// Load filter options from API
async function loadFilterOptions() {
    try {
        // Load countries
        const countriesRes = await fetch(`${CONFIG.API_URL}/countries`);
        const countriesData = await countriesRes.json();

        if (countriesData.success) {
            const countryFieldset = document.querySelector('fieldset:nth-of-type(1)');
            countryFieldset.innerHTML = '<legend>Country:</legend>';

            countriesData.data.forEach(country => {
                countryFieldset.innerHTML += `
                    <label><input type="checkbox" name="country" value="${country.id}"> ${country.name}</label>
                `;
            });
        }

        // Load ingredients
        const ingredientsRes = await fetch(`${CONFIG.API_URL}/ingredients`);
        const ingredientsData = await ingredientsRes.json();

        if (ingredientsData.success) {
            const ingredientFieldset = document.querySelector('fieldset:nth-of-type(2)');
            ingredientFieldset.innerHTML = '<legend>Main Ingredient:</legend>';

            ingredientsData.data.forEach(ingredient => {
                ingredientFieldset.innerHTML += `
                    <label><input type="checkbox" name="ingredient" value="${ingredient.id}"> ${ingredient.name}</label>
                `;
            });
        }

        // Load recipe types
        const typesRes = await fetch(`${CONFIG.API_URL}/recipe-types`);
        const typesData = await typesRes.json();

        if (typesData.success) {
            const typeFieldset = document.querySelector('fieldset:nth-of-type(3)');
            typeFieldset.innerHTML = '<legend>Meal Type:</legend>';

            typesData.data.forEach(type => {
                typeFieldset.innerHTML += `
                    <label><input type="checkbox" name="type" value="${type.id}"> ${type.name}</label>
                `;
            });
        }

        // Load diets
        const dietsRes = await fetch(`${CONFIG.API_URL}/diets`);
        const dietsData = await dietsRes.json();

        if (dietsData.success) {
            const dietFieldset = document.querySelector('fieldset:nth-of-type(4)');
            dietFieldset.innerHTML = '<legend>Diet:</legend>';

            dietsData.data.forEach(diet => {
                dietFieldset.innerHTML += `
                    <label><input type="checkbox" name="diet" value="${diet.id}"> ${diet.name}</label>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Render recipes in the grid
function renderRecipes(recipes) {
    const recipesGrid = document.querySelector('.recipes-grid');

    if (!recipes || recipes.length === 0) {
        recipesGrid.innerHTML = '<p>No recipes found.</p>';
        return;
    }

    recipesGrid.innerHTML = '';

    recipes.forEach(recipe => {
        const rating = recipe.average_rating ? parseFloat(recipe.average_rating).toFixed(1) : 'N/A';
        const description = recipe.description || 'No description available';
        const imageUrl = recipe.picture || 'https://via.placeholder.com/300x200?text=No+Image';

        recipesGrid.innerHTML += `
            <a href="/recipe/${recipe.id}" class="recipe-card">
                <div class="card-header">
                    <img src="${imageUrl}" alt="${recipe.name}">
                    <span class="note-badge">${rating} ★</span>
                </div>
                <div class="card-content">
                    <h4>${recipe.name}</h4>
                    <p class="description">${description}</p>
                    <p class="meta">
                        <span>${recipe.country_name || ''}</span>
                        ${recipe.diet_name ? `• <span>${recipe.diet_name}</span>` : ''}
                    </p>
                </div>
            </a>
        `;
    });
}

// Load recipes with optional filters
async function loadRecipes(filters = {}) {
    try {
        const queryParams = new URLSearchParams();

        if (filters.search) {
            queryParams.append('search', filters.search);
        }

        if (filters.country) {
            queryParams.append('country', filters.country);
        }

        if (filters.ingredients) {
            queryParams.append('ingredients', filters.ingredients);
        }

        if (filters.type) {
            queryParams.append('type', filters.type);
        }

        if (filters.diet) {
            queryParams.append('diet', filters.diet);
        }

        const url = queryParams.toString()
            ? `${CONFIG.API_URL}/recipes?${queryParams.toString()}`
            : `${CONFIG.API_URL}/recipes`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderRecipes(data.data);

            const recipesSection = document.querySelector('#recipes-list h3');
            recipesSection.textContent = `All recipes (${data.count})`;
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        document.querySelector('.recipes-grid').innerHTML =
            '<p>Error loading recipes. Please try again later.</p>';
    }
}

// Handle search form submission
function setupSearch() {
    const searchForm = document.querySelector('#search-section form');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const searchInput = document.getElementById('search');
        const searchQuery = searchInput.value.trim();

        if (searchQuery) {
            loadRecipes({ search: searchQuery });
        } else {
            loadRecipes();
        }
    });
}

// Handle filters form submission
function setupFilters() {
    const filtersForm = document.querySelector('#filters form');

    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedCountries = Array.from(
            document.querySelectorAll('input[name="country"]:checked')
        ).map(cb => cb.value);

        const selectedIngredients = Array.from(
            document.querySelectorAll('input[name="ingredient"]:checked')
        ).map(cb => cb.value);

        const selectedTypes = Array.from(
            document.querySelectorAll('input[name="type"]:checked')
        ).map(cb => cb.value);

        const selectedDiets = Array.from(
            document.querySelectorAll('input[name="diet"]:checked')
        ).map(cb => cb.value);

        const filters = {};

        if (selectedCountries.length > 0) {
            filters.country = selectedCountries.join(',');
        }

        if (selectedIngredients.length > 0) {
            filters.ingredients = selectedIngredients.join(',');
        }

        if (selectedTypes.length > 0) {
            filters.type = selectedTypes.join(',');
        }

        if (selectedDiets.length > 0) {
            filters.diet = selectedDiets.join(',');
        }

        loadRecipes(filters);
    });
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
    });
}

// Initialize page
async function init() {
    displayUsername();
    setupLogout();
    await loadFilterOptions();
    await loadRecipes();
    setupSearch();
    setupFilters();
}

// Run when page loads
init();