// Store selected ingredients
let selectedIngredients = [];

// Load options for create recipe modal
async function loadCreateRecipeOptions() {
    try {
        // Load recipe types
        const typesRes = await fetch(`${CONFIG.API_URL}/recipe-types`);
        const typesData = await typesRes.json();

        if (typesData.success) {
            const typeSelect = document.getElementById('recipeType');
            typeSelect.innerHTML = '<option value="">Select type...</option>';
            typesData.data.forEach(type => {
                typeSelect.innerHTML += `<option value="${type.id}">${type.name}</option>`;
            });
        }

        // Load diets
        const dietsRes = await fetch(`${CONFIG.API_URL}/diets`);
        const dietsData = await dietsRes.json();

        if (dietsData.success) {
            const dietSelect = document.getElementById('recipeDiet');
            dietSelect.innerHTML = '<option value="">Select diet...</option>';
            dietsData.data.forEach(diet => {
                dietSelect.innerHTML += `<option value="${diet.id}">${diet.name}</option>`;
            });
        }

        // Load countries
        const countriesRes = await fetch(`${CONFIG.API_URL}/countries`);
        const countriesData = await countriesRes.json();

        if (countriesData.success) {
            const countrySelect = document.getElementById('recipeCountry');
            countrySelect.innerHTML = '<option value="">Select country...</option>';
            countriesData.data.forEach(country => {
                countrySelect.innerHTML += `<option value="${country.id}">${country.name}</option>`;
            });
        }

        // Load ingredients
        const ingredientsRes = await fetch(`${CONFIG.API_URL}/ingredients`);
        const ingredientsData = await ingredientsRes.json();

        if (ingredientsData.success) {
            const ingredientsSelect = document.getElementById('recipeIngredients');
            ingredientsSelect.innerHTML = '<option value="">Select ingredients...</option>';
            ingredientsData.data.forEach(ingredient => {
                ingredientsSelect.innerHTML += `<option value="${ingredient.id}">${ingredient.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading recipe options:', error);
    }
}

// Open create recipe modal
function openCreateRecipeModal() {
    const modal = document.getElementById('createRecipeModal');
    modal.style.display = 'block';

    // Reset form and ingredients
    document.getElementById('createRecipeForm').reset();
    selectedIngredients = [];
    renderSelectedIngredients();
    document.getElementById('createMessage').style.display = 'none';
    document.getElementById('recipeFileName').textContent = '';
}

// Close create recipe modal
function closeCreateRecipeModal() {
    const modal = document.getElementById('createRecipeModal');
    modal.style.display = 'none';
}

// Setup create recipe modal
function setupCreateRecipeModal() {
    const modal = document.getElementById('createRecipeModal');

    if (!modal) {
        console.error('Create recipe modal not found in page');
        return;
    }

    const closeBtn = modal.querySelector('.close');
    const createBtn = document.getElementById('createRecipeBtn');

    if (!createBtn) {
        console.error('Create recipe button not found');
        return;
    }

    createBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCreateRecipeModal();
    });

    closeBtn.addEventListener('click', closeCreateRecipeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCreateRecipeModal();
        }
    });

    // Handle ingredient selection
    document.getElementById('recipeIngredients').addEventListener('change', handleIngredientSelect);

    // Show file name
    document.getElementById('recipeImage').addEventListener('change', showRecipeFileName);

    // Handle form submission
    document.getElementById('createRecipeForm').addEventListener('submit', handleCreateRecipe);
}

// Show selected recipe file name
function showRecipeFileName(e) {
    const fileNameDisplay = document.getElementById('recipeFileName');

    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        fileNameDisplay.textContent = `Selected: ${file.name} (${fileSize} MB)`;
        fileNameDisplay.style.color = '#28a745';
    } else {
        fileNameDisplay.textContent = '';
    }
}

// Handle ingredient selection
function handleIngredientSelect(e) {
    const select = e.target;
    const selectedId = select.value;
    const selectedText = select.options[select.selectedIndex].text;

    if (!selectedId) return;

    // Check if already added
    if (selectedIngredients.some(ing => ing.id === selectedId)) {
        alert('This ingredient is already added');
        select.value = '';
        return;
    }

    // Add to selected ingredients
    selectedIngredients.push({ id: selectedId, name: selectedText });

    // Reset select
    select.value = '';

    // Render chips
    renderSelectedIngredients();
}

// Render selected ingredients as chips
function renderSelectedIngredients() {
    const container = document.getElementById('selectedIngredients');

    if (selectedIngredients.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = selectedIngredients.map(ing => `
        <div class="chip">
            <span>${ing.name}</span>
            <button type="button" class="chip-remove" onclick="removeIngredient('${ing.id}')">×</button>
        </div>
    `).join('');
}

// Remove ingredient from selection
function removeIngredient(ingredientId) {
    selectedIngredients = selectedIngredients.filter(ing => ing.id !== ingredientId);
    renderSelectedIngredients();
}

// Make removeIngredient available globally
window.removeIngredient = removeIngredient;

// Handle create recipe form submission
async function handleCreateRecipe(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const messageDiv = document.getElementById('createMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';

    const name = document.getElementById('recipeName').value.trim();
    const description = document.getElementById('recipeDescription').value.trim();
    const preparation = document.getElementById('recipePreparation').value.trim();
    const type_id = document.getElementById('recipeType').value;
    const diet_id = document.getElementById('recipeDiet').value;
    const country_id = document.getElementById('recipeCountry').value;
    const imageInput = document.getElementById('recipeImage');

    if (selectedIngredients.length === 0) {
        messageDiv.className = 'error';
        messageDiv.textContent = 'Please select at least one ingredient';
        messageDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        return;
    }

    let picturePath = null;

    try {
        // 1. Upload image if selected
        if (imageInput.files.length > 0) {
            submitBtn.textContent = 'Uploading image...';

            const formData = new FormData();
            formData.append('picture', imageInput.files[0]);

            const uploadRes = await fetch('/upload-image?folder=recipe', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();

            if (uploadData.success) {
                picturePath = uploadData.path;
            } else {
                throw new Error('Image upload failed');
            }
        }

        // 2. Create recipe
        submitBtn.textContent = 'Creating recipe...';

        const recipeData = {
            name,
            description,
            preparation,
            type_id,
            diet_id,
            country_id,
            ingredients: selectedIngredients.map(ing => ing.id),
            picture: picturePath
        };

        const response = await fetch(`${CONFIG.API_URL}/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipeData)
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.className = 'success';
            messageDiv.textContent = 'Recipe created successfully!';
            messageDiv.style.display = 'block';

            submitBtn.textContent = 'Success!';

            setTimeout(() => {
                window.location.href = `/recipe/${data.data.id}`;
            }, 1000);
        } else {
            messageDiv.className = 'error';
            messageDiv.textContent = 'Error: ' + data.message;
            messageDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.className = 'error';
        messageDiv.textContent = 'Error creating recipe';
        messageDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Initialize create recipe functionality
async function initCreateRecipe() {
    await loadCreateRecipeOptions();
    setupCreateRecipeModal();
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCreateRecipe);
} else {
    initCreateRecipe();
}