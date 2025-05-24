const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const rest_countries = "https://restcountries.com/v3.1/all"
const DButils = require("./DButils");


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

/*
 spoonacularGet is an async function that sends a GET request to the Spoonacular API.
 - `path`: the API endpoint path (e.g., "/random").
 - `params`: an object with query parameters (used by the API).
 The function automatically adds the API key from environment variables to the request.
 Returns the response data from Spoonacular, or throws an error if the request fails.
 */
async function spoonacularGet(path, params = {}) {
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




function extractRecipePreview(recipe, options = {}) {
    return {
        recipe_image: recipe.image,
        recipe_title: recipe.title,
        prep_duration: `${recipe.readyInMinutes.toString().padStart(2, "0")}:00:00`,
        popularity: recipe.aggregateLikes || 0,
        vegetarian: recipe.vegetarian || false,
        vegan: recipe.vegan || false,
        gluten_free: recipe.glutenFree || false,
        clicked_by_user: options.clicked_by_user ?? false, // !!!!MAY be will be used later
        saved_by_user: options.saved_by_user ?? false
    };
}


//  from lab7 TODO: check for the correct ruoting path

/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info
 */
async function getRecipeInformationFROMLAB(recipe_id) {
  //https://api.spoonacular.com/recipes/complexSearch
  return await axios.get(`${api_domain}/recipes/${recipe_id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey
    }
  });
}

//  from lab7

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,

    }
}



//  from lab7

function extractPreviewRecipeDetails(recipes_info) {
  return recipes_info.map((recipe_info) => {
    //check the data type so it can work with diffrent types of data
    let data = recipe_info;
    if (recipe_info.data) {
      data = recipe_info.data;
    }
    const {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
    } = data;
    return {
      id: id,
      title: title,
      image: image,
      readyInMinutes: readyInMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree
    }
  })
}

async function getRecipesPreview(recipes_ids_list) {
  let promises = [];
  recipes_ids_list.map((id) => {
    promises.push(getRecipeInformation(id));
  });
  let info_res = await Promise.all(promises);
  info_res.map((recp) => { console.log(recp.data) });
  //   console.log(info_res);
  return extractPreviewRecipeDetails(info_res);
}

// getRecipesPreview(["663559"]);

//  from lab7



//BY ABED


/**
 * Delete a user-created recipe by ID
 * @param {string} username 
 * @param {number} recipe_id 
 */
async function deleteMyRecipe(username, recipe_id) {
  try {
    const query = `
      DELETE FROM MyRecipes
      WHERE recipe_id = ? AND username = ?
    `;

    const result = await DButils.execQuery({
      sql: query,
      values: [recipe_id, username]
    });

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Add a new user-created recipe
 * @param {string} username 
 * @param {object} recipeData 
 */
async function addMyRecipe(username, recipeData) {
  try {
    console.log("addMyRecipe called with:", { username, recipeData }); // Log input data

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
        username, recipe_title, recipe_image, prep_duration, vegetarian, vegan, gluten_free, amount_of_meals, instructions, extendedIngredients
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log("Running SQL query:", query);
    console.log("With values:", [
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
    ]);

    await DButils.execQuery({
      sql: query,
      values: [
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
      ]
    });

    console.log("Recipe inserted successfully");

  } catch (error) {
    console.error("Error inserting recipe:", error);
    throw error;
  }
}





//BY ABED

exports.getRecipeDetails = getRecipeDetails;

module.exports = {
    spoonacularGet,
    extractRecipePreview,
    deleteMyRecipe,
    addMyRecipe
};


