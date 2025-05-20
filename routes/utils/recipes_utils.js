const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const rest_countries = "https://restcountries.com/v3.1/all"




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



/**
 * Get all countries from the REST Countries API by Abed
 */
async function getAllCountries() {
  try {
    const response = await axios.get(rest_countries);
    return response.data.map((country) => ({
      name: country.name.common,
      code: country.cca2,
    }));
  } catch (error) {
    console.error("Error fetching countries:", error.message);
    throw error;
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

exports.getRecipeDetails = getRecipeDetails;

module.exports = {
    spoonacularGet,
    extractRecipePreview,
};


