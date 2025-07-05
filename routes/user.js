var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
const mySql = require("../routes/utils/MySql");
const { addMyFamilyRecipe,getLastClickedRecipes } = require("./utils/user_utils");




//last clicked 2nd version abed 03072025 below
/**
 * Get the user's 3 last viewed recipes
 */
router.get('/last', async (req, res, next) => {
   console.log("starting /last:");
  try {
    const username = req.session?.username;
    console.log("Username in /last:", username);

    if (!username) {
      return res.status(401).send("User not logged in.");
    }

    // Call the utility function to get last clicked recipes
    const clickedRecipes = await getLastClickedRecipes(username);
    console.log("Last Clicked recipes retrieved:", clickedRecipes);
    // Return the list of clicked recipes
    res.status(200).json(clickedRecipes);

  } catch (err) {
    console.log("JUMPED TO CATCH IN /last 3.2 :");
    console.error("Error retrieving last viewed recipes:", err.message);
    res.status(500).send("Server error while fetching recipes.");
    next(err); // Pass the error to the next middleware
  }
});


/**
 * Get the user's Family Recipes
 */
router.get('/familyRecipes', async (req,res,next) => {
  try{
    console.log(" *******************inside /familyRecipes");
    const username = req.session?.username;
    const familyRecipes = await user_utils.getFamilyRecipes(username);

    const recipeIds = familyRecipes.map(row => row.recipe_id);
    res.status(200).json(recipeIds);
  } catch(error){
    next(error);
  }
});

/**
 * Return the users recipes
 */
router.get('/myRecipes', async (req, res, next) => {
  try {
    //const results = await user_utils.getMyRecipes(req); 
    const results = await user_utils.getMyRecipesIDS(req); 
   // res.status(200).send(results);
    console.log("Results from getMyRecipesIDS:", results);
    const recipeIds = results.map(row => row.recipe_id);
    res.status(200).json(recipeIds);
  } catch (error) {
    next(error);
  }
});


/**
 * Authenticate all incoming requests by middleware
 * user_id --> username
 */ 
// router.use(async function (req, res, next) {
//   if (req.session && req.session.username) {
//     DButils.execQuery("SELECT username FROM users").then((users) => {
//       if (users.find((x) => x.username === req.session.username)) {
//         req.username = req.session.username;
//         next();
//       }
//     }).catch(err => next(err));
//   } else {
//     res.sendStatus(401);
//   }
// });


router.use(async function (req, res, next) {
  if (!req.session?.username || req.session.username === "") {
    return res.status(404).send("Unauthorized from 3.2 express server: No session username found.");
  } 
  next(); // If no session or user found, just continue to next middleware
});

//=================== GET ===================

/**
 * Return the users Favorite Recipes
 */
router.get('/favoriteRecipes', async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) return res.status(401).send("User not logged in");

    // Get favorite recipe IDs
    const recipes = await user_utils.getFavoriteRecipes(username);

    // Map to plain array of IDs
    const recipeIds = recipes.map(row => row.recipe_id);

    res.status(200).json(recipeIds); // Return as JSON array
  } catch (error) {
    console.error("Error in /favoriteRecipes:", error);
    next(error);
  }
});





/**
 * Get user details by username
 */
router.get("/:username", async (req, res, next) => {
  try {
    const user = await user_utils.getUserDetails(req.params.username);
    if (!user) {
      res.status(404).send({ message: "User not found" });
    } else {
      res.send(user);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Check if a username is already taken
 */
router.get("/exists/:username", async (req, res, next) => {
  try {
    const exists = await user_utils.isUsernameTaken(req.params.username);
    res.send({ exists });
  } catch (error) {
    next(error);
  }
});


/**
 * Get the user's 3 last viewed recipes
 */
// router.get('/last', async (req, res, next) => {
//   let conn;
//   console.log("inside /last")
//   try {
//     const username = req.session?.username;
//     console.log("Username in /last: ", username)
//     if (!username) {
//       return res.status(401).send("User not logged in.");
//     }

//     //conn = await connection();
//     conn = await mySql.connection();
//     // Fetch lastClicks row for this user
//     const result = await conn.query(
//       "SELECT firstClicked, secondClicked, thirdClicked FROM lastClicks WHERE username = ?",
//       [username]
//     );

//     if (result.length === 0) {
//       // No record yet for this user
//       return res.status(200).json([]);
//     }

//     const { firstClicked, secondClicked, thirdClicked } = result[0];

//     // Return in order: most recent first
//     const clicked = [thirdClicked, secondClicked, firstClicked].filter(
//       (id) => id !== null && id !== undefined
//     );

//     res.status(200).json(clicked);
//   } catch (err) {
//     console.error("Error retrieving last viewed recipes:", err.message);
//     res.status(500).send("Server error while fetching recipes.");
//     next(err); 
//   } finally {
//     if (conn) await conn.release();
//   }
// });




//Dummy test: problem was position of the function (should come above the router.use) and the functionaility, just check req.session?.username instead of DB
router.get('/blah', async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) return res.status(401).send("User not logged in");

    // Get favorite recipe IDs
    const recipes = await user_utils.getFavoriteRecipes(username);

    // Map to plain array of IDs
    const recipeIds = recipes.map(row => row.recipe_id);

    res.status(200).json(recipeIds); // Return as JSON array
  } catch (error) {
    console.error("Error in /favoriteRecipes:", error);
    next(error);
  }
});
//=================== END GET ===================


//=================== POST ===================

/**
 * Mark a recipe as a favorite
 */
router.post("/favoriteRecipes/:recipeId", async (req, res) => {
  const username = req.session?.username;
  const recipeId = req.params.recipeId;
  console.log(`\n[INFO] Incoming favorite mark request for recipe ID: ${recipeId} by user: ${username}`);

  if (!username) {
    console.warn("[WARN] No username in session");
    return res.status(401).send("User not logged in");
  }

  let myRecipesRes;
  let familyRecipesRes;
  let favCheck;
  let conn;
  try {
    conn = await mySql.connection();

    // 1) Check in myrecipes
    myRecipesRes = await conn.query(
      "SELECT recipe_id FROM myrecipes WHERE recipe_id = ? AND username = ?",
      [recipeId, username]
    );
    console.log(`[DB] myRecipes match count: ${myRecipesRes.length}`);
    // 2) Check in familyrecipes if not found in myrecipes
    let foundLocally = myRecipesRes.length > 0;
    if (!foundLocally) {
        familyRecipesRes = await conn.query(
        "SELECT recipe_id FROM familyrecipes WHERE recipe_id = ? AND username = ?",
        [recipeId, username]
      );
      console.log(`[DB] familyRecipes match count: ${familyRecipesRes.length}`);
      foundLocally = familyRecipesRes.length > 0;
    }
         

    // 3) If not found locally, check Spoonacular API
    if (!foundLocally) {
    
      try {
        console.log("[INFO] Recipe not found locally. Trying Spoonacular API...");
        const apiRes = await recipe_utils.spoonacularGet(`/${recipeId}/information`, {
            includeNutrition: false
          });
          console.log("[SPOONACULAR] API response received");

        if (!apiRes || apiRes.status === 404 || !apiRes.id) {
          console.warn("[SPOONACULAR] Recipe not found or bad response");
          return res.status(404).send("Recipe not found locally or in Spoonacular");
        }
        // recipe found in Spoonacular, proceed
      } catch (err) {
        console.error("[SPOONACULAR] API Error:", err.message);
        return res.status(404).send("Recipe not found locally or in Spoonacular");
      }
    }

    // 4) Mark as favorite (insert into favorite_recipes if not already favorite)
      favCheck = await conn.query(
      "SELECT * FROM favorite_recipes WHERE username = ? AND recipe_id = ?",
      [username, recipeId]
    );
    console.log(`[DB] favorite_recipes match count: ${favCheck.length}`);

    if (favCheck.length === 0) {
      await conn.query(
        "INSERT INTO favorite_recipes (username, recipe_id) VALUES (?, ?)",
        [username, recipeId]
      );
      await conn.query("COMMIT"); //Commit changes in DB
      console.log("[DB] Inserted into favorite_recipes");
    }
    else{
        console.log("[INFO] Recipe already marked as favorite");
    }

    res.status(200).send("Recipe marked as favorite");

  } catch (err) {
    console.error("Error marking recipe as favorite:", err);
    res.status(500).send("Server error");
  } finally {
    if (conn) await conn.release();
  }
});




/**
 * Add last recipe clicked into the database until a max of 3
 */
router.post("/clickOnRecipe", async (req, res, next) => {
  let conn;
  try {
    
    const username = req.session.username;
    const recipeId = req.body.recipeId;
    conn = await mySql.connection();
    console.log("[DEBUG] /clickOnRecipe called");
    console.log("[DEBUG] Session username:", username);
    console.log("[DEBUG] Received recipeId:", recipeId);
      // 1) Check in myrecipes
    myRecipesRes = await conn.query(
      "SELECT recipe_id FROM myrecipes WHERE recipe_id = ? AND username = ?",
      [recipeId, username]
    );

    // 2) Check in familyrecipes if not found in myrecipes
    let foundLocally = myRecipesRes.length > 0;
    if (!foundLocally) {
        familyRecipesRes = await conn.query(
        "SELECT recipe_id FROM familyrecipes WHERE recipe_id = ? AND username = ?",
        [recipeId, username]
      );
      foundLocally = familyRecipesRes.length > 0;
    }

    // 3) If not found locally, check Spoonacular API
    if (!foundLocally) {
      try {
          const apiRes = await recipe_utils.spoonacularGet(`/${recipeId}/information`, {
            includeNutrition: false
          });
        if (!apiRes || apiRes.status === 404) {
          return res.status(404).send("Recipe not found locally or in Spoonacular");
        }
        // recipe found in Spoonacular, proceed
      } catch (err) {
        return res.status(404).send("Recipe not found locally or in Spoonacular");
      }
    }
    if (!username) {
      console.warn("[WARN] Missing username in session");
      return res.status(401).send("Unauthorized: No session username found.");
    }

    if (!recipeId) {
      console.warn("[WARN] No recipeId provided in request body");
      return res.status(400).send("Bad Request: recipeId is required.");
    }

    const result = await user_utils.saveLastClick(username, recipeId);
    console.log("[DEBUG] saveLastClick result:", result);
    res.status(200).send({ message: "Recipe click registered." });
    // Fetch recipe preview from DB or Spoonacular here...
  } catch (err) {
        console.error("[ERROR] Exception in /clickOnRecipe:", err);
        res.status(500).send("Server error while fetching recipes.");
  }
});



/**
 * Add a family recipe
 */
router.post("/familyRecipes", async (req, res, next) => {
  const username = req.session.username;
  try {
    if (!req.session?.username) {
      return res.status(401).send("Unauthorized");
    }
    const {
      recipe_id,
      recipe_title,
      recipe_image,
      recipe_author,
      recipe_season,
      prep_duration,
      vegetarian,
      vegan,
      gluten_free,
      amount_of_meals,
      recipe_instructions,
      extendedIngredients
    } = req.body;

    // Basic validation
    if (
        !recipe_title || !recipe_image || !prep_duration || !recipe_instructions ||
        !Array.isArray(extendedIngredients) || extendedIngredients.length === 0 ||
        typeof vegetarian !== "boolean" || typeof vegan !== "boolean" || typeof gluten_free !== "boolean" ||
        typeof amount_of_meals !== "number"
    ) {
      return res.status(400).send({ message: "Invalid or missing fields in request" });
    }
    if (!recipe_title || !recipe_author || !recipe_instructions) {
      return res.status(400).send("Missing required fields: title, author, or instructions");
    }

     // Insert into DB
    await user_utils.addFamilyRecipe(username, {
      recipe_id,
      username,
      recipe_title,
      recipe_image,
      recipe_author,
      recipe_season,
      prep_duration,
      vegetarian,
      vegan,
      gluten_free,
      amount_of_meals,
      recipe_instructions,
      extendedIngredients
    });

    res.status(201).send({ message: "Family recipe added successfully" });

  } catch (err) {
    next(err);
  }
});

//=================== END POST ===================



//=================== DELETE ===================


/**
 * Un-mark (remove) a favorite recipe by recipeId
 */
router.delete('/favoriteRecipes/:recipeId', async (req,res,next) => {
  try{
    const username = req.session.username;
    const recipeId = req.params.recipeId;
    await user_utils.removeFavoriteRecipe(username,recipeId);
    res.status(200).send("The Recipe successfully removed from favorites");
  } catch(error){
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    next(error);
  }
});
//=================== END DELETE ===================

module.exports = router;
