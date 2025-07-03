const DButils = require("./DButils");
const MySql = require("../utils/MySql");



/**
 * Return user's favorite recipes
 * @param {string} username 
 */
async function getFavoriteRecipes(username){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM favorite_recipes WHERE username='${username}'`);
    return recipes_id;
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

/**
 * Return user's family recipes
 * @param {string} username 
 */
async function getFamilyRecipes(username){
    try {
     // const username = req.session.username;
      const recipes = await DButils.execQuery(`SELECT * FROM familyrecipes WHERE username = '${username}'`);
      return recipes;
    }
    catch (error) {
    throw error;
  }
}


/**
 * return user's recipes
 * @param {string} req 
 */
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


 /** Add a new family recipe (base in MyRecipes, details in FamilyRecipes)
 * @param {string} username 
 * @param {object} recipeData 
 */
async function addFamilyRecipe(username, recipeData) {
  try {
    const {
      recipe_id,
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

    // Step 2: Insert into FamilyRecipes
    const insertFamilyQuery = `
      INSERT INTO FamilyRecipes (
        recipe_id, username, recipe_author, recipe_season, extendedIngredients,
        recipe_instructions, recipe_title, recipe_image, prep_duration,
        vegetarian, vegan, gluten_free, amount_of_meals
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        gluten_free,
        amount_of_meals
      ]
    });

  } catch (error) {
    throw error;
  }
}


/**
 * Saves last clicked recipe ID of user
 * @param {string} username 
 * @param {integer} recipeID 
 */
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

//################### EXPORTS ################################
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getUserDetails = getUserDetails;
exports.getMyRecipes = getMyRecipes;
exports.getFamilyRecipes = getFamilyRecipes;
exports.getAllCountries = getAllCountries;
exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.addFamilyRecipe = addFamilyRecipe;
exports.saveLastClick = saveLastClick;
exports.getLastClickedRecipes = getLastClickedRecipes;

