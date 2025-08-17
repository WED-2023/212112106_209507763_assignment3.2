const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const rest_countries = "https://restcountries.com/v3.1/all"
const DButils = require("./DButils");
const MySql = require("./MySql");
const mySql = require("./MySql"); // adjust path if needed


/*
 spoonacularGet is an async function that sends a GET request to the Spoonacular API.
 - `path`: the API endpoint path (e.g., "/random").
 - `params`: an object with query parameters (used by the API).
 The function automatically adds the API key from environment variables to the request.
 Returns the response data from Spoonacular, or throws an error if the request fails.
 */
async function spoonacularGet(path, params = {}) {
     if (!process.env.spooncular_apiKey) {
        throw new Error("Missing Spoonacular API key in environment variables.");
    }

    const url = `${api_domain}${path}`;
    const fullParams = {
        ...params,
        apiKey: process.env.spooncular_apiKey // inject automatically
    };

    try {
        const response = await axios.get(url, { params: fullParams });
        return response.data;
    } catch (err) {
        console.error(`Spoonacular GET ${path} failed:`, err.response?.data || err.message);
        throw err;
    }
}



//New extract recipe by Abed 24062025
function extractRecipePreview(recipe, options = {}) {
    return {
    id: recipe.recipe_id || recipe.id || null, // optional if exists
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes,
    aggregateLikes: recipe.aggregateLikes,
    vegetarian: recipe.vegetarian,
    vegan: recipe.vegan,
    glutenFree: recipe.glutenFree
    };
}




// ========================= SQL QUERIES =========================

async function checkIfRecipeIsLocal(username, recipe_id) {
    let conn;
    let localRecipeRes=[];
    try {
        conn = await mySql.connection();
        localRecipeRes = await conn.query(
            "SELECT recipe_id FROM myrecipes WHERE recipe_id = ? AND username = ?",
            [recipe_id, username]
        );
        if (localRecipeRes.length > 0) {
            console.log(`Recipe ID found in my_recipes: ${localRecipeRes}`);
            return 1
        } else {
            localRecipeRes = await conn.query(
                "SELECT recipe_id FROM familyrecipes WHERE recipe_id = ?",
                [recipe_id, username]
            );
            if (localRecipeRes.length > 0) {
                console.log(`Recipe ID found in family_recipes: ${localRecipeRes}`);
                return 2
            } else {
                console.log(`Recipe ID not found in Local DB: ${recipe_id}`);
                return 0 // Recipe not found in either table
            }
        }
    }
    catch (err) {
        console.error("[ERROR] Exception in getLocalRecipe (recipes_utils):", err);
    }
    finally {
        if (conn) await conn.release();
    }
}


async function getLocalRecipe(username, recipe_id) {
    let conn;
    let localRecipeRes;
    try {
        conn = await mySql.connection();
        localRecipeRes = await conn.query(
            "SELECT * FROM myrecipes WHERE recipe_id = ?",
            [recipe_id]
        );
        if (localRecipeRes.length > 0) {
            console.log(`Recipe ID found in my_recipes: ${localRecipeRes}`);
            return localRecipeRes
        } else {
            localRecipeRes = await conn.query(
                "SELECT * FROM familyrecipes WHERE recipe_id = ?",
                [recipe_id]
            );
            if (localRecipeRes.length > 0) {
                console.log(`Recipe ID found in family_recipes: ${localRecipeRes}`);
                return localRecipeRes
            } else {
                console.log(`Recipe ID not found in Local DB: ${recipe_id}`);
                return 0 // Recipe not found in either table
            }
        }
    }
    catch (err) {
        console.error("[ERROR] Exception in getLocalRecipe (recipes_utils):", err);
    }
    finally {
        if (conn) await conn.release();
    }
}

// -----------------------START OF MY RECIPES-----------------------


/**
 * Delete a user-created recipe by ID
 * @param {string} username
 * @param {number} recipe_id
 */
async function deleteMyRecipe(username, recipe_id) {
    const connection = await MySql.connection();

    try {
        await connection.query("START TRANSACTION");

        const result = await connection.query(
            `DELETE FROM myrecipes WHERE recipe_id = ? AND username = ?`,
            [recipe_id, username]
        );

        await connection.query("COMMIT");
        return result.affectedRows > 0;

    } catch (error) {
        await connection.query("ROLLBACK");
        throw error;

    } finally {
        await connection.release();
    }
}

/**
 * Add a new user-created recipe
 * @param {string} username
 * @param {object} recipeData
 */
async function addMyRecipe(username, recipeData) {
    console.log("addMyRecipe called with:", { username, recipeData });

    const {
        recipe_title,
        recipe_image,
        prep_duration,
        vegetarian,
        vegan,
        gluten_free,
        amount_of_meals,
        instructions,
        extendedIngredients
    } = recipeData;

    const query = `
    INSERT INTO myrecipes (
      username, recipe_title, recipe_image, prep_duration, vegetarian, vegan,
      gluten_free, amount_of_meals, instructions, extendedIngredients
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
        username,
        recipe_title,
        recipe_image,
        prep_duration,
        vegetarian,
        vegan,
        gluten_free,
        amount_of_meals,
        instructions,
        JSON.stringify(extendedIngredients)
    ];

    const connection = await MySql.connection();

    try {
        await connection.query("START TRANSACTION");

        console.log("Running SQL query:", query);
        console.log("With values:", values);

        await connection.query(query, values);

        await connection.query("COMMIT");
        console.log("Recipe inserted successfully");
    } catch (error) {
        await connection.query("ROLLBACK");
        console.error("Error inserting recipe:", error);
        throw error;
    } finally {
        await connection.release();
    }
}


/**
 * return user's recipes
 * @param {string} username
 */
async function getMyRecipes(username) {
    try{
        return  await DButils.execQuery(`SELECT * FROM myrecipes WHERE username = '${username}'`);
    }
    catch (error) {
        throw error;
    }
}
/**
 * return user's recipes
 * @param {string} username
 */
async function getMyRecipesIDS(username) {
    try{
        const recipes_ids = await DButils.execQuery(`SELECT recipe_id FROM myrecipes WHERE username = '${username}'`);
        console.log("getMyRecipesIDS recipes_ids user_utils 3.2:", recipes_ids);
        return recipes_ids;

    }
    catch (error) {
        throw error;
    }
}




// -----------------------END OF MY RECIPES-----------------------


// -------------------START OF FAVORITE RECIPES-------------------
/**
 * Return user's favorite recipes
 * @param {string} username
 */
async function getFavoriteRecipes(username){
    return await DButils.execQuery(`SELECT recipe_id FROM favorite_recipes WHERE username='${username}'`);
}


/**
 * Remove user's favorite recipe based on ID
 * @param {string} username
 * @param {integer} recipe_id
 */
async function removeFavoriteRecipe(username, recipe_id){
    let conn;
    let res;
    try{

        conn = await MySql.connection();
        await conn.query(
            `DELETE FROM favorite_recipes WHERE username = ? AND recipe_id = ?`,
            [username, recipe_id]
        );
        res = await conn.query("COMMIT"); //Commit changes in DB
    }
    catch (err) {
        // return res.status(404).send("cant remove recipe from  myfavorites");
        throw err;
    }finally {
        if (conn) await conn.release();
    }
}

async function addRecipeToFavorites(username, recipe_id) {
    let conn;
    let favCheck = [];
    try {
        conn = await mySql.connection();
        favCheck = await conn.query( // Check if recipe already exists in favorites
            "SELECT * FROM favorite_recipes WHERE username = ? AND recipe_id = ?",
            [username, recipe_id]
        );
        console.log(`[DB] favorite_recipes match count: ${favCheck.length}`);

        if (favCheck.length === 0) {
            await conn.query(
                "INSERT INTO favorite_recipes (username, recipe_id) VALUES (?, ?)",
                [username, recipe_id]
            );
            await conn.query("COMMIT"); //Commit changes in DB
            console.log("[DB] Inserted into favorite_recipes");
        }
        else{
            console.log("[INFO] Recipe already marked as favorite");
        }
    }
    catch (err) {
        console.error("[ERROR] Exception in addRecipeToFavorites (recipes_utils):", err);
    }
    finally {
        if (conn) await conn.release();
    }
}

async function getRecipeFromFavorites(username, recipe_id) {
    return await DButils.execQuery(
        `SELECT 1 FROM favorite_recipes WHERE username = '${username}' AND recipe_id = '${recipe_id}'`
    );
}

// --------------------END OF FAVORITE RECIPES--------------------


// -------------------START OF FAMILY RECIPES-------------------


/**
 * Return family recipes
 */
async function getFamilyRecipes(){
    try {
        return await DButils.execQuery(`SELECT * FROM familyrecipes`);
    }
    catch (error) {
        throw error;
    }
}

// --------------------END OF FAMILY RECIPES--------------------



// -------------------START OF LAST CLICKED RECIPES-------------------

/**
 * Get the last clicked recipes for a user
 * @param {string} username
 * @returns {Promise<Array>} Array of recipe IDs
 */
async function getLastClickedRecipes(username) {
    let conn;
    try {
        // Get a connection to the database
        conn = await MySql.connection();

        // Fetch the last clicked recipes (firstClicked, secondClicked, thirdClicked)
        const result = await conn.query(
            "SELECT firstClicked, secondClicked, thirdClicked FROM lastClicks WHERE username = ?",
            [username]
        );

        // If no records are found, return an empty array
        if (result.length === 0) {
            console.log("No records found for user:", username);
            return [];
        }

        const { firstClicked, secondClicked, thirdClicked } = result[0];

        // Return the recipe IDs in order of most recent first
        const clicked = [thirdClicked, secondClicked, firstClicked].filter(
            (id) => id !== null && id !== undefined
        );

        console.log("Last clicked recipes for user", username, clicked);
        return clicked;
    } catch (err) {
        console.error("Error retrieving last clicked recipes:", err.message);
        throw err;
    } finally {
        if (conn) await conn.release();
    }
}

/**
 * Saves last clicked recipe ID of user
 * @param {string} username
 * @param {integer} recipeId
 */
async function saveLastClick(username, recipeId) {
    let conn;
    try {
        conn = await MySql.connection();
        // Step 1: Check if user already has a row in lastClicks
        const existing = await conn.query(
            "SELECT * FROM lastClicks WHERE username = ?",
            [username]
        );

        if (existing.length === 0) {

            // First time click – insert new row
            await conn.query(
                "INSERT INTO lastClicks (username, thirdClicked) VALUES (?, ?)",
                [username, recipeId]
            );
            await conn.query("COMMIT"); //Commit changes in DB
        } else {
            const { firstClicked, secondClicked, thirdClicked } = existing[0];

            // Step 2: Check for duplicates
            if (
                recipeId === firstClicked ||
                recipeId === secondClicked ||
                recipeId === thirdClicked
            ) {
                console.log(`[DEBUG] Skipping duplicate recipe click: ${recipeId}`);
                return; // Skip if already clicked
            }
            // Shift clicks to the left and add new to thirdClicked
            const updatedFirst = secondClicked;
            const updatedSecond = thirdClicked;
            const updatedThird = recipeId;
            await conn.query(
                `UPDATE lastClicks
         SET firstClicked = ?, secondClicked = ?, thirdClicked = ?
         WHERE username = ?`,
                [updatedFirst, updatedSecond, updatedThird, username]
            );

            await conn.query("COMMIT"); //Commit changes in DB
        }
    } catch (err) {
        console.error("Error saving last clicked recipe:", err.message);
        throw err;
    } finally {
        if (conn) await conn.release();
    }
}



// -------------------END OF LAST CLICKED RECIPES-------------------
// Export all functions from recipes_utils.js
module.exports = {
    spoonacularGet,
    extractRecipePreview,
    deleteMyRecipe,
    addMyRecipe,
    getMyRecipes,
    getMyRecipesIDS,
    getFavoriteRecipes,
    removeFavoriteRecipe,
    getFamilyRecipes,
    getLastClickedRecipes,
    saveLastClick,
    checkIfRecipeIsLocal,
    addRecipeToFavorites,
    getLocalRecipe,
    getRecipeFromFavorites
};