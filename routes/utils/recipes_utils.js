const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const rest_countries = "https://restcountries.com/v3.1/all"
const DButils = require("./DButils");
const MySql = require("./MySql"); // adjust path if needed


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




// function extractRecipePreview(recipe, options = {}) {
//     return {
//         recipe_image: recipe.image,
//         recipe_title: recipe.title,
//         prep_duration: recipe.readyInMinutes,
//         popularity: recipe.aggregateLikes || 0,
//         vegetarian: recipe.vegetarian || false,
//         vegan: recipe.vegan || false,
//         gluten_free: recipe.glutenFree || false,
//     };
// }

//New extract recipe by Abed 24062025


function extractRecipePreview(recipe, options = {}) {
    return {
    id: recipe.recipe_id || recipe.id || null, // optional if exists
    recipe_title: recipe.title,
    recipe_image: recipe.image,
    prep_duration: recipe.readyInMinutes,
    popularity: recipe.aggregateLikes,
    vegetarian: recipe.vegetarian,
    vegan: recipe.vegan,
    gluten_free: recipe.glutenFree
    };
}


// function extractRecipePreview(recipe, options = {}) {
//   return {
    // id: recipe.recipe_id || recipe.id || null, // optional if exists
    // title: recipe.recipe_title,
    // image: recipe.recipe_image,
    // readyInMinutes: recipe.prep_duration,
    // aggregateLikes: recipe.popularity,
    // vegetarian: recipe.vegetarian,
    // vegan: recipe.vegan,
    // glutenFree: recipe.gluten_free
//   };
// }
// ========================= SQL QUERIES =========================

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



module.exports = {
    spoonacularGet,
    extractRecipePreview,
    deleteMyRecipe,
    addMyRecipe
};


