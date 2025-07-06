const DButils = require("./DButils");
const mySql = require("./MySql");

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

async function addUser(username, firstname, lastname, country, email, hash_password) {
  let conn;
  try {
    conn = await mySql.connection();
    // Insert user
    await conn.query(
        `INSERT INTO users (username, first_name, last_name, country, password, email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, firstname, lastname, country, hash_password, email]
    );
    await conn.query("COMMIT"); // doesnt enter intom DB the last commit

  }
  catch (err) {
    console.error("[ERROR] Exception in addUser (user_utils):", err);
  }
  finally {
    if (conn) await conn.release();
  }
}


async function checkIfUserExist(username) {

  try{
    return await DButils.execQuery(`SELECT username FROM users WHERE username = '${username}'`);
  }
  catch (error) {
    throw error;
  }
}

//################### EXPORTS ################################

module.exports = {
  getUserDetails,
  getAllCountries,
  checkIfUserExist,
  addUser
};