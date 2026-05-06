// Filter state
const filterState = {
    search: '',
    countries: [],
    ingredients: [],
    types: [],
    diets: []
};

// Display username in welcome message
function displayUsername() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const welcomeTitle = document.querySelector('main h1');
        welcomeTitle.textContent = `Welcome to Le Gourmand, ${user.username}!`;
    }
}

// Save filters to localStorage
function saveFilters() {
    localStorage.setItem('recipeFilters', JSON.stringify(filterState));
}

// Load filters from localStorage
function loadSavedFilters() {
    const saved = localStorage.getItem('recipeFilters');
    if (saved) {
        const parsed = JSON.parse(saved);
        filterState.search = parsed.search || '';
        filterState.countries = parsed.countries || [];
        filterState.ingredients = parsed.ingredients || [];
        filterState.types = parsed.types || [];
        filterState.diets = parsed.diets || [];

        // Update search input
        document.getElementById('search').value = filterState.search;

        // Render chips
        renderFilterChips();
    }
}

// Load filter options from API
async function loadFilterOptions() {
    try {
        // Load countries
        const countriesRes = await fetch(`${CONFIG.API_URL}/countries`);
        const countriesData = await countriesRes.json();

        if (countriesData.success) {
            const countrySelect = document.getElementById('countrySelect');
            countriesData.data.forEach(country => {
                countrySelect.innerHTML += `<option class="filter-option" value="${country.id}">${country.name}</option>`;
            });
        }

        // Load ingredients
        const ingredientsRes = await fetch(`${CONFIG.API_URL}/ingredients`);
        const ingredientsData = await ingredientsRes.json();

        if (ingredientsData.success) {
            const ingredientSelect = document.getElementById('ingredientSelect');
            ingredientsData.data.forEach(ingredient => {
                ingredientSelect.innerHTML += `<option class="filter-option" value="${ingredient.id}">${ingredient.name}</option>`;
            });
        }

        // Load recipe types
        const typesRes = await fetch(`${CONFIG.API_URL}/recipe-types`);
        const typesData = await typesRes.json();

        if (typesData.success) {
            const typeSelect = document.getElementById('typeSelect');
            typesData.data.forEach(type => {
                typeSelect.innerHTML += `<option class="filter-option" value="${type.id}">${type.name}</option>`;
            });
        }

        // Load diets
        const dietsRes = await fetch(`${CONFIG.API_URL}/diets`);
        const dietsData = await dietsRes.json();

        if (dietsData.success) {
            const dietSelect = document.getElementById('dietSelect');
            dietsData.data.forEach(diet => {
                dietSelect.innerHTML += `<option class="filter-option" value="${diet.id}">${diet.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Handle select changes
function setupFilterSelects() {
    document.getElementById('countrySelect').addEventListener('change', (e) => {
        handleFilterSelection(e, 'countries', 'countryChips');
    });

    document.getElementById('ingredientSelect').addEventListener('change', (e) => {
        handleFilterSelection(e, 'ingredients', 'ingredientChips');
    });

    document.getElementById('typeSelect').addEventListener('change', (e) => {
        handleFilterSelection(e, 'types', 'typeChips');
    });

    document.getElementById('dietSelect').addEventListener('change', (e) => {
        handleFilterSelection(e, 'diets', 'dietChips');
    });
}

// Handle filter selection
function handleFilterSelection(e, filterKey, chipsContainerId) {
    const select = e.target;
    const selectedId = select.value;
    const selectedText = select.options[select.selectedIndex].text;

    if (!selectedId) return;

    // Check if already added
    if (filterState[filterKey].some(item => item.id === selectedId)) {
        alert('This filter is already added');
        select.value = '';
        return;
    }

    // Add to filter state
    filterState[filterKey].push({ id: selectedId, name: selectedText });

    // Reset select
    select.value = '';

    // Render chips
    renderFilterChips();

    // Save and search
    saveFilters();
    performSearch();
}

// Render all filter chips
function renderFilterChips() {
    renderChips('countries', 'countryChips');
    renderChips('ingredients', 'ingredientChips');
    renderChips('types', 'typeChips');
    renderChips('diets', 'dietChips');
}

// Render chips for a specific filter
function renderChips(filterKey, containerId) {
    const container = document.getElementById(containerId);

    if (filterState[filterKey].length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = filterState[filterKey].map(item => `
        <div class="chip">
            <span>${item.name}</span>
            <button type="button" class="chip-remove" onclick="removeFilter('${filterKey}', '${item.id}')">×</button>
        </div>
    `).join('');
}

// Remove filter
function removeFilter(filterKey, itemId) {
    filterState[filterKey] = filterState[filterKey].filter(item => item.id !== itemId);
    renderFilterChips();
    saveFilters();
    performSearch();
}

// Make removeFilter available globally
window.removeFilter = removeFilter;

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

// Load recipes with current filters
async function loadRecipes() {
    try {
        const queryParams = new URLSearchParams();

        // Add search
        if (filterState.search) {
            queryParams.append('search', filterState.search);
        }

        // Add country filters
        if (filterState.countries.length > 0) {
            queryParams.append('country', filterState.countries.map(c => c.id).join(','));
        }

        // Add ingredient filters
        if (filterState.ingredients.length > 0) {
            queryParams.append('ingredients', filterState.ingredients.map(i => i.id).join(','));
        }

        // Add type filters
        if (filterState.types.length > 0) {
            queryParams.append('type', filterState.types.map(t => t.id).join(','));
        }

        // Add diet filters
        if (filterState.diets.length > 0) {
            queryParams.append('diet', filterState.diets.map(d => d.id).join(','));
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

// Perform search
function performSearch() {
    loadRecipes();
}

// Handle search form submission
function setupSearch() {
    const searchForm = document.getElementById('searchForm');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const searchInput = document.getElementById('search');
        filterState.search = searchInput.value.trim();

        saveFilters();
        performSearch();
    });
}

// Clear all filters and search
function clearSearch() {
    filterState.search = '';
    filterState.countries = [];
    filterState.ingredients = [];
    filterState.types = [];
    filterState.diets = [];

    document.getElementById('search').value = '';

    renderFilterChips();
    saveFilters();
    performSearch();
}

// Setup clear search button
function setupClearSearch() {
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
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
    loadSavedFilters(); // Load saved filters first
    setupFilterSelects();
    setupSearch();
    setupClearSearch();
    await loadRecipes(); // Then load recipes with those filters
}

// Run when page loads
init();