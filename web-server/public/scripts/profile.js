// Get user ID from URL or use logged-in user
function getUserIdFromUrl() {
    const path = window.location.pathname;
    const parts = path.split('/');

    // If URL is /profile/:id, return that ID
    if (parts.length >= 3 && parts[2]) {
        return parseInt(parts[2]);
    }

    // Otherwise, return logged-in user's ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
    }

    return null;
}

// Check if viewing own profile
function isOwnProfile(profileUserId) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;

    const user = JSON.parse(userStr);
    return parseInt(user.id) === parseInt(profileUserId);
}

// Load user profile data
async function loadUserProfile(userId) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/users/${userId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            renderUserInfo(data.data);
        } else {
            document.querySelector('main').innerHTML =
                '<p>User not found.</p><a href="/home">Back to Home</a>';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        document.querySelector('main').innerHTML =
            '<p>Error loading profile.</p><a href="/home">Back to Home</a>';
    }
}

// Render user info section
function renderUserInfo(user) {
    document.getElementById('username').textContent = user.username;
    document.getElementById('user-email').textContent = user.email;

    const userPicture = document.getElementById('user-picture');
    userPicture.src = user.picture;
}

// Load user's favorite recipes
async function loadFavorites(userId, isOwn) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/users/${userId}/favorites`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('favorites-count').textContent = data.count;
            renderRecipes(data.data, 'favorites-grid', isOwn, 'favorite');
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Load user's shared recipes
async function loadShared(userId, isOwn) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/users/${userId}/shared`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('shared-count').textContent = data.count;
            renderRecipes(data.data, 'shared-grid', isOwn, 'shared');
        }
    } catch (error) {
        console.error('Error loading shared recipes:', error);
    }
}

// Load user's created recipes
async function loadMyRecipes(userId, isOwn) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/users/${userId}/recipes`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('recipes-count').textContent = data.count;
            renderRecipes(data.data, 'recipes-grid', isOwn, 'recipe');
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

// Render recipes in a grid
function renderRecipes(recipes, gridId, isOwn, type) {
    const grid = document.getElementById(gridId);

    if (!recipes || recipes.length === 0) {
        grid.innerHTML = '<p>No recipes found.</p>';
        return;
    }

    grid.innerHTML = '';

    recipes.forEach(recipe => {
        const rating = recipe.average_rating ? parseFloat(recipe.average_rating).toFixed(1) : 'N/A';
        const description = recipe.description || 'No description available';
        const imageUrl = recipe.picture || 'https://via.placeholder.com/300x200?text=No+Image';

        const card = document.createElement('div');
        card.className = 'recipe-card-wrapper';

        card.innerHTML = `
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
            ${isOwn ? `<button class="delete-btn" onclick="deleteItem(${recipe.id}, '${type}', '${gridId}')">Delete</button>` : ''}
        `;

        grid.appendChild(card);
    });
}

// Delete favorite, shared, or own recipe
async function deleteItem(recipeId, type, gridId) {
    if (!confirm('Are you sure you want to delete this?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        let endpoint = '';

        if (type === 'favorite') {
            endpoint = `${CONFIG.API_URL}/recipes/${recipeId}/favorite`;
        } else if (type === 'shared') {
            endpoint = `${CONFIG.API_URL}/recipes/${recipeId}/share`;
        } else if (type === 'recipe') {
            endpoint = `${CONFIG.API_URL}/recipes/${recipeId}`;
        }

        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('Deleted successfully!');
            const userId = getUserIdFromUrl();
            const isOwn = isOwnProfile(userId);

            if (type === 'favorite') {
                await loadFavorites(userId, isOwn);
            } else if (type === 'shared') {
                await loadShared(userId, isOwn);
            } else if (type === 'recipe') {
                await loadMyRecipes(userId, isOwn);
            }
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting item');
    }
}

// Make deleteItem available globally
window.deleteItem = deleteItem;

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
    });
}

// Show edit button if viewing own profile
function showEditButtonIfOwn(isOwn) {
    const editBtn = document.getElementById('editProfileBtn');
    if (isOwn) {
        editBtn.style.display = 'inline-block';
        editBtn.addEventListener('click', openEditModal);
    }
}

// Open edit profile modal
function openEditModal() {
    const modal = document.getElementById('editProfileModal');
    const username = document.getElementById('username').textContent;

    // Pre-fill current username
    document.getElementById('editUsername').value = username;

    modal.style.display = 'block';
}

// Close edit profile modal
function closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'none';

    // Clear form
    document.getElementById('editProfileForm').reset();
    document.getElementById('editMessage').style.display = 'none';
    document.getElementById('editMessage').className = '';
}

// Setup modal events
function setupModal() {
    const modal = document.getElementById('editProfileModal');
    const closeBtn = document.querySelector('.close');

    // Close modal when clicking X
    closeBtn.addEventListener('click', closeEditModal);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEditModal();
        }
    });

    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);

    // Show file name when selected
    document.getElementById('profilePicture').addEventListener('change', showFileName);
}

// Show selected file name
function showFileName(e) {
    const fileNameDisplay = document.getElementById('fileName');

    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        fileNameDisplay.textContent = `Selected: ${file.name} (${fileSize} MB)`;
        fileNameDisplay.style.color = '#28a745';
    } else {
        fileNameDisplay.textContent = '';
    }
}

// Handle edit profile form submission
async function handleEditProfile(e) {
    e.preventDefault();

    const userId = getUserIdFromUrl();
    const token = localStorage.getItem('token');
    const messageDiv = document.getElementById('editMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';

    const username = document.getElementById('editUsername').value;
    const pictureInput = document.getElementById('profilePicture');

    let picturePath = null;

    try {
        // 1. If there's an image, upload it first
        if (pictureInput.files.length > 0) {
            submitBtn.textContent = 'Uploading image...';

            const formData = new FormData();
            formData.append('picture', pictureInput.files[0]);

            const uploadRes = await fetch('/upload-image?folder=profile', {
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

        submitBtn.textContent = 'Updating profile...';

        const updateData = {};
        if (username) updateData.username = username;
        if (picturePath) updateData.picture = picturePath;

        if (Object.keys(updateData).length === 0) {
            messageDiv.className = 'error';
            messageDiv.textContent = 'Nothing to update';
            messageDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        const response = await fetch(`${CONFIG.API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.className = 'success';
            messageDiv.textContent = 'Profile updated successfully!';
            messageDiv.style.display = 'block';

            submitBtn.textContent = 'Success!';

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (username) user.username = username;
                if (picturePath) user.picture = picturePath;
                localStorage.setItem('user', JSON.stringify(user));
            }

            setTimeout(() => {
                location.reload();
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
        messageDiv.textContent = 'Error updating profile';
        messageDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

/* ============================================================
   LOGIQUE DE LA MESSAGERIE (CHAT / DM)
   ============================================================ */

let currentConversationId = null;
let chatPollingInterval = null;

// Afficher le bouton DM si on est sur le profil de quelqu'un d'autre
function showDMButtonIfNotOwn(isOwn) {
    const dmBtn = document.getElementById('dmBtn');
    if (!isOwn && dmBtn) {
        dmBtn.style.display = 'inline-block';
        dmBtn.addEventListener('click', openChat);
    }
}

// Ouvrir la fenêtre de chat
async function openChat() {
    const targetUserId = getUserIdFromUrl();
    const userStr = localStorage.getItem('user');

    if (!userStr) return alert("Vous devez être connecté pour envoyer un message.");
    const currentUser = JSON.parse(userStr);

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${CONFIG.API_URL}/chat/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user1Id: currentUser.id,
                targetUserId: targetUserId
            })
        });

        const data = await response.json();

        if (data.success) {
            currentConversationId = data.data.conversationId;

            document.getElementById('chatPopup').style.display = 'flex';
            document.getElementById('chatUserName').textContent = document.getElementById('username').textContent;

            await loadMessages();

            if (chatPollingInterval) clearInterval(chatPollingInterval);
            chatPollingInterval = setInterval(loadMessages, 3000); // Recharge les messages toutes les 3s

            scrollToBottom();
        } else {
            console.error("Erreur création conversation:", data.message);
        }
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du chat:', error);
    }
}

// Charger les messages de la conversation active
async function loadMessages() {
    if (!currentConversationId) return;

    try {
        const token = localStorage.getItem('token');
        const currentUser = JSON.parse(localStorage.getItem('user'));

        const response = await fetch(`${CONFIG.API_URL}/chat/conversations/${currentConversationId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            const chatBox = document.getElementById('chatMessages');
            chatBox.innerHTML = ''; // On vide avant de remplir

            data.data.forEach(msg => {
                const msgDiv = document.createElement('div');
                const isMe = parseInt(msg.sender_id) === parseInt(currentUser.id);

                msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;
                msgDiv.textContent = msg.content;
                chatBox.appendChild(msgDiv);
            });

            scrollToBottom();
        }
    } catch (error) {
        console.error('Erreur chargement des messages:', error);
    }
}

// Configuration des événements du Chat (Envoi de formulaire et fermeture)
function setupChatEvents() {
    const chatForm = document.getElementById('chatForm');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const input = document.getElementById('chatInput');
            const content = input.value.trim();
            const userStr = localStorage.getItem('user');

            if (!content || !currentConversationId || !userStr) return;
            const currentUser = JSON.parse(userStr);

            try {
                const token = localStorage.getItem('token');

                const response = await fetch(`${CONFIG.API_URL}/chat/conversations/${currentConversationId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        senderId: currentUser.id,
                        content: content
                    })
                });

                const data = await response.json();
                if (data.success) {
                    input.value = ''; // Vide le champ après envoi
                    await loadMessages(); // Recharge la discussion immédiatement
                }
            } catch (error) {
                console.error('Erreur envoi message:', error);
            }
        });
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            document.getElementById('chatPopup').style.display = 'none';
            if (chatPollingInterval) {
                clearInterval(chatPollingInterval);
            }
        });
    }
}

// Auto-scroll vers le bas de la discussion
function scrollToBottom() {
    const chatBox = document.getElementById('chatMessages');
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}


// Initialize page
async function init() {
    const userId = getUserIdFromUrl();

    if (!userId) {
        window.location.href = '/home';
        return;
    }

    const isOwn = isOwnProfile(userId);

    setupLogout();
    setupModal();
    setupChatEvents(); // Initialisation des events du chat

    await loadUserProfile(userId);
    await loadFavorites(userId, isOwn);
    await loadShared(userId, isOwn);
    await loadMyRecipes(userId, isOwn);

    showEditButtonIfOwn(isOwn);
    showDMButtonIfNotOwn(isOwn); // Affichage du bouton de chat si ce n'est pas notre profil
}

init();