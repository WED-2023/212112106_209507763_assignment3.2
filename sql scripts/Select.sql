-- CREATE SCHEMA IF NOT EXISTS mydb;
-- USE mydb;
--
-- -- Users Table
-- CREATE TABLE Users (
--     username VARCHAR(50) NOT NULL PRIMARY KEY,
--     first_name VARCHAR(50) NOT NULL,
--     last_name VARCHAR(50) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     country VARCHAR(50) NOT NULL
-- );
--
-- -- My Recipes Table (User-created recipes)
-- CREATE TABLE MyRecipes (
--     recipe_id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL,
--     recipe_title VARCHAR(100) NOT NULL,
--     recipe_image VARCHAR(255),
--     prep_duration INT,
--     likes INT DEFAULT 0,
--     vegetarian BOOLEAN,
--     vegan BOOLEAN,
--     gluten_free BOOLEAN,
--     amount_of_meals INT,
--     instructions TEXT,
--     extendedIngredients JSON,
--     FOREIGN KEY (username) REFERENCES Users(username) ON DELETE CASCADE
-- );
--
-- -- Family Recipes Table (A special kind of user recipe)
# CREATE TABLE FamilyRecipes (
#                                recipe_id INT PRIMARY KEY,
#                                recipe_author VARCHAR(100) NOT NULL,
#                                recipe_season VARCHAR(50),
#                                extendedIngredients JSON,
#                                instructions TEXT,
#                                recipe_title VARCHAR(100) NOT NULL,
#                                recipe_image VARCHAR(255),
#                                prep_duration INT,
#                                likes INT DEFAULT 0,
#                                vegetarian BOOLEAN,
#                                vegan BOOLEAN,
#                                gluten_free BOOLEAN
# );
-- -- Favorite Recipes Table (users can save any recipe)
-- CREATE TABLE Favorite_Recipes (
--     username VARCHAR(50) NOT NULL,
--     recipe_id INT NOT NULL,
--     PRIMARY KEY (username, recipe_id),
--     FOREIGN KEY (username) REFERENCES Users(username) ON DELETE CASCADE
-- );
--
--
--
-- CREATE TABLE IF NOT EXISTS lastClicks (
--   username VARCHAR(255) NOT NULL PRIMARY KEY,
--   firstClicked INT,
--   secondClicked INT,
--   thirdClicked INT
-- );

USE mydb;

# INSERT INTO familyrecipes (
#     recipe_id,
#
#     recipe_author,
#     recipe_season,
#     extendedIngredients,
#     instructions,
#     recipe_title,
#     recipe_image,
#     prep_duration,
#     vegetarian,
#     vegan,
#     gluten_free
# )
# VALUES (
#             -1,
#            'Grandmom',
#            'All Seasons',
#            JSON_ARRAY(
#                    JSON_OBJECT('name','cornmeal','amount','250 g (2 cups)'),
#                    JSON_OBJECT('name','plain yogurt','amount','200 g (1 cup)'),
#                    JSON_OBJECT('name','eggs','amount','2'),
#                    JSON_OBJECT('name','sunflower oil','amount','120 ml (1/2 cup)'),
#                    JSON_OBJECT('name','baking soda','amount','1 tsp'),
#                    JSON_OBJECT('name','salt','amount','1/2 tsp'),
#                    JSON_OBJECT('name','sugar','amount','1 tbsp')
#            ),
#            '1) Preheat oven to 180°C (350°F).\n2) Whisk yogurt, eggs, and oil.\n3) Stir in cornmeal, baking soda, salt, and sugar.\n4) Pour into a greased pan.\n5) Bake 30–35 min until golden.\n6) cool slightly before serving.',
#            'Circassian Cornbread (Fydzhyn Lape)',
#            'https://i.ytimg.com/vi/9xrTn3TlqAw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLACpfY3fVGiGtB9TQ86kqHGd9KKZQ',
#            45,
#            1,  -- vegetarian
#            0,  -- vegan
#            1   -- gluten_free (assumes 100% cornmeal)
#        );

# INSERT INTO familyrecipes (
#     recipe_id,
#
#     recipe_author,
#     recipe_season,
#     extendedIngredients,
#     instructions,
#     recipe_title,
#     recipe_image,
#     prep_duration,
#     vegetarian,
#     vegan,
#     gluten_free
# )
# VALUES (
#            -2,
#            'Mom',
#            'All Seasons',
#            JSON_ARRAY(
#                    JSON_OBJECT('name','all-purpose flour','amount','360 g (3 cups)'),
#                    JSON_OBJECT('name','egg','amount','1'),
#                    JSON_OBJECT('name','water','amount','240 ml (1 cup)'),
#                    JSON_OBJECT('name','salt (for dough)','amount','1 tsp'),
#                    JSON_OBJECT('name','ground beef','amount','250 g'),
#                    JSON_OBJECT('name','ground pork','amount','250 g'),
#                    JSON_OBJECT('name','onion, finely grated','amount','1 medium'),
#                    JSON_OBJECT('name','garlic, grated','amount','2 cloves (optional)'),
#                    JSON_OBJECT('name','salt (for filling)','amount','1.5 tsp'),
#                    JSON_OBJECT('name','black pepper','amount','1 tsp'),
#                    JSON_OBJECT('name','ice water (for filling)','amount','3 tbsp'),
#                    JSON_OBJECT('name','salt (for boiling)','amount','1 tbsp'),
#                    JSON_OBJECT('name','bay leaves','amount','1–2'),
#                    JSON_OBJECT('name','butter','amount','to taste, for serving'),
#                    JSON_OBJECT('name','sour cream','amount','to serve'),
#                    JSON_OBJECT('name','vinegar','amount','to taste'),
#                    JSON_OBJECT('name','dill, chopped','amount','to serve')
#            ),
#            '1) Make dough: mix egg, water, salt; add flour; knead 8–10 min; rest 30 min.\n2) Make filling: mix meats, onion, garlic, salt, pepper, ice water until sticky.\n3) Roll dough thin; cut 6–7 cm rounds; add 1 tsp filling; seal; pinch corners together.\n4) Boil in salted water with bay leaves; after floating cook 3–4 min (total ~6–7 min).\n5) Toss with butter; serve with sour cream, vinegar, and dill.',
#            'Pelmeni (Russian Meat Dumplings)',
#            'https://www.alyonascooking.com/wp-content/uploads/2015/09/pelmeni-10-500x375.jpg',
#            90,
#            0,  -- vegetarian
#            0,  -- vegan
#            0   -- gluten_free
#        );

INSERT INTO familyrecipes (
    recipe_id,

    recipe_author,
    recipe_season,
    extendedIngredients,
    instructions,
    recipe_title,
    recipe_image,
    prep_duration,
    vegetarian,
    vegan,
    gluten_free
)
VALUES (
           -3,
           'Grandmom',
           'Spring–Summer',
           JSON_ARRAY(
                   JSON_OBJECT('name','beets, cooked & cooled','amount','500 g (3 medium)'),
                   JSON_OBJECT('name','cucumbers, diced','amount','2 medium (~300 g)'),
                   JSON_OBJECT('name','radishes, sliced','amount','6-8 (~150 g)'),
                   JSON_OBJECT('name','green onions, chopped','amount','4-5 stalks'),
                   JSON_OBJECT('name','fresh dill, chopped','amount','1/2 cup (~20 g)'),
                   JSON_OBJECT('name','kefir','amount','1 L (4 cups)'),
                   JSON_OBJECT('name','cold water','amount','250-500 ml (to taste)'),
                   JSON_OBJECT('name','lemon juice (or pickle brine)','amount','1-2 tbsp'),
                   JSON_OBJECT('name','salt','amount','1.5 tsp, to taste'),
                   JSON_OBJECT('name','sugar (optional)','amount','1 tsp'),
                   JSON_OBJECT('name','black pepper','amount','1/2 tsp'),
                   JSON_OBJECT('name','hard-boiled eggs','amount','4, to serve'),
                   JSON_OBJECT('name','sour cream (optional)','amount','to serve'),
                   JSON_OBJECT('name','boiled potatoes (optional)','amount','to serve on the side')
           ),
           '1) Cook beets; cool, peel, grate.\n2) Whisk kefir with 250-500 ml cold water; season with salt, pepper, lemon juice (and sugar if using).\n3) Stir in beets, cucumbers, radishes, green onions, dill; chill 30 min.\n4) Serve cold with egg; garnish with dill; offer sour cream and potatoes.',
           'Holodnik (Cold Beet Soup)',
           'https://www.inspirationsforall.com/wp-content/uploads/2019/04/swekolnik-chlodnik-rezept-3-775x775-1.jpg',
           45,
           1,  -- vegetarian
           0,  -- vegan
           1   -- gluten_free
       );