CREATE DATABASE IF NOT EXISTS le_gourmand;
USE le_gourmand;

CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     picture VARCHAR(200) DEFAULT '/assets/default-profile.png',
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL
    );

CREATE TABLE IF NOT EXISTS diets (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     name VARCHAR(45) NOT NULL
    );

CREATE TABLE IF NOT EXISTS recipe_types (
                                            id INT AUTO_INCREMENT PRIMARY KEY,
                                            name VARCHAR(45) NOT NULL
    );

CREATE TABLE IF NOT EXISTS countries (
                                         id INT AUTO_INCREMENT PRIMARY KEY,
                                         name VARCHAR(45) NOT NULL
    );

CREATE TABLE IF NOT EXISTS recipes (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       name VARCHAR(45) NOT NULL,
    picture VARCHAR(200) DEFAULT '/assets/default-food.png',
    description TEXT,
    preparation TEXT,
    diet_id INT DEFAULT 1,
    type_id INT,
    country_id INT,
    user_id INT,
    FOREIGN KEY (diet_id) REFERENCES diets(id),
    FOREIGN KEY (type_id) REFERENCES recipe_types(id),
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
    );

CREATE TABLE IF NOT EXISTS ingredients (
                                           id INT AUTO_INCREMENT PRIMARY KEY,
                                           name VARCHAR(45) NOT NULL
    );

CREATE TABLE IF NOT EXISTS relation_recipe_ingredients (
                                                           id INT AUTO_INCREMENT PRIMARY KEY,
                                                           recipe_id INT NOT NULL,
                                                           ingredient_id INT NOT NULL,
                                                           FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS recipe_notes (
                                            id INT AUTO_INCREMENT PRIMARY KEY,
                                            user_id INT NOT NULL,
                                            recipe_id INT NOT NULL,
                                            note INT NOT NULL,
                                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS user_favorites (
                                              id INT AUTO_INCREMENT PRIMARY KEY,
                                              user_id INT NOT NULL,
                                              recipe_id INT NOT NULL,
                                              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS user_shared (
                                           id INT AUTO_INCREMENT PRIMARY KEY,
                                           user_id INT NOT NULL,
                                           recipe_id INT NOT NULL,
                                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

-- ============================================================
-- TABLES POUR LE SYSTÈME DE MESSAGERIE (CHAT)
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             user1_id INT NOT NULL,
                                             user2_id INT NOT NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Une seule conversation unique entre deux mêmes utilisateurs
    UNIQUE KEY unique_conversation (user1_id, user2_id)
    );

CREATE TABLE IF NOT EXISTS messages (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        conversation_id INT NOT NULL,
                                        sender_id INT NOT NULL,
                                        content TEXT NOT NULL,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- ============================================================
-- INSERTION DES DONNÉES DE RÉFÉRENCE
-- ============================================================

INSERT IGNORE INTO diets (id, name) VALUES (1, 'No Diet'), (2, 'Vegetarian'), (3, 'Vegan'), (4, 'Gluten Free');
INSERT IGNORE INTO recipe_types (id, name) VALUES (1, 'Appetizer'), (2, 'Main Course'), (3, 'Dessert'), (4, 'Cocktail');
INSERT IGNORE INTO countries (id, name) VALUES (1, 'France'), (2, 'Italy'), (3, 'Japan'), (4, 'Mexico'), (5, 'India');

-- AJOUT DES INGRÉDIENTS POUR LE FORMULAIRE DE CRÉATION
INSERT IGNORE INTO ingredients (id, name) VALUES
(1, 'Tomato'), (2, 'Potato'), (3, 'Onion'), (4, 'Garlic'), (5, 'Olive Oil'),
(6, 'Salt'), (7, 'Pepper'), (8, 'Chicken'), (9, 'Beef'), (10, 'Pasta'),
(11, 'Rice'), (12, 'Butter'), (13, 'Milk'), (14, 'Eggs'), (15, 'Flour');