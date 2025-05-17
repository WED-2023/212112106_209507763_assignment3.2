const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}


//by ABED
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
 * Check if a username already exists
 * @param {string} username 
 */
async function isUsernameTaken(username) {
  try {
    const users = await DButils.execQuery("SELECT username FROM users");
    return users.some((u) => u.username === username);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUserDetails,
  isUsernameTaken,
};
""

//by ABED


exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
