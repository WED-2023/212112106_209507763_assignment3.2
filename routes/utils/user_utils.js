const DButils = require("./DButils");
const MySql = require("../utils/MySql");
// async function markAsFavorite(username, recipe_id){
//     await DButils.execQuery(`INTRO INTRO favorite_recipes VALUES ('${username}',${recipe_id})`);
// }

async function getFavoriteRecipes(username){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM favorite_recipes WHERE username='${username}'`);
    return recipes_id;
}
//by ABED
// async function removeFavoriteRecipe(username, recipe_id){
//     await DButils.execQuery(`DELETE FROM favorite_recipes WHERE username='${username}' and recipe_id=${recipe_id}`);
// }
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


/**
 * Retrieve user details by username
 * @param {string} username 
 */
async function getUserDetails(username) {
  try {
    const user = await DButils.execQuery(`SELECT * FROM users WHERE username = '${username}'`);
    return user.length ? user[0] : null;
  } catch (error) {
    throw error;
  }
}


async function getFamilyRecipes(req){
    try {
      const username = req.session.username;
      const recipes = await DButils.execQuery(`SELECT * FROM familyrecipes WHERE username = '${username}`);
      return recipes;
    }
    catch (error) {
    throw error;
  }
}
async function getMyRecipes(req) {
  try{
      const username = req.session.username;
      const recipes = await DButils.execQuery(`SELECT * FROM myrecipes WHERE username = '${username}'`);
      return recipes;
}
    catch (error) {
    throw error;
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






 /* Add a new family recipe (base in MyRecipes, details in FamilyRecipes)
 * @param {string} username 
 * @param {object} recipeData 
 */
async function addMyFamilyRecipe(username, recipeData) {
  try {
    const {
      recipe_title,
      recipe_image,
      prep_duration,
      vegetarian,
      vegan,
      gluten_free,
      amount_of_meals,
      recipe_instructions,
      extendedIngredients,
      recipe_author,
      recipe_season
    } = recipeData;

    // Step 1: Insert into MyRecipes
    const insertMyRecipeQuery = `
      INSERT INTO MyRecipes (
        username, recipe_title, recipe_image, prep_duration, vegetarian, vegan, gluten_free, amount_of_meals, instructions, extendedIngredients
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await DButils.execQuery({
      sql: insertMyRecipeQuery,
      values: [
        username,
        recipe_title,
        recipe_image,
        prep_duration,
        vegetarian,
        vegan,
        gluten_free,
        amount_of_meals,
        recipe_instructions,
        JSON.stringify(extendedIngredients)
      ],
      returnLastInsertId: true
    });

    const recipe_id = result.insertId;

    // Step 2: Insert into FamilyRecipes
    const insertFamilyQuery = `
      INSERT INTO FamilyRecipes (
        recipe_id, username, recipe_author, recipe_season, extendedIngredients,
        recipe_instructions, recipe_title, recipe_image, prep_duration,
        vegetarian, vegan, gluten_free
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await DButils.execQuery({
      sql: insertFamilyQuery,
      values: [
        recipe_id,
        username,
        recipe_author,
        recipe_season,
        JSON.stringify(extendedIngredients),
        recipe_instructions,
        recipe_title,
        recipe_image,
        prep_duration,
        vegetarian,
        vegan,
        gluten_free
      ]
    });

  } catch (error) {
    throw error;
  }
}


async function saveLastClick(username, recipeId) {
  let conn;
  try {
    //conn = await connection();
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
//by ABED



exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getUserDetails = getUserDetails;
exports.getMyRecipes = getMyRecipes;
exports.getFamilyRecipes = getFamilyRecipes;
exports.getAllCountries = getAllCountries;
exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.addMyFamilyRecipe = addMyFamilyRecipe;
exports.saveLastClick = saveLastClick;

