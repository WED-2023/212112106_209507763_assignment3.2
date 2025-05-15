const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";



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

getRecipesPreview(["663559", "642582", "655705", "652100"]);

//  from lab7

exports.getRecipeDetails = getRecipeDetails;



