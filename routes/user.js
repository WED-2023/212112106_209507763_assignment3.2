var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
const mySql = require("../routes/utils/MySql");


/**
 * Authenticate all incoming requests by middleware
 * user_id --> username
 */ 

router.use(async function (req, res, next) {
  if (req.session && req.session.username) {
    DButils.execQuery("SELECT username FROM users").then((users) => {
      if (users.find((x) => x.username === req.session.username)) {
        req.username = req.session.username;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
// router.post('/favoriteRecipes', async (req,res,next) => {
//   try{
//     console.log("[POST] /users/favoriteRecipes - Incoming request");
//     const user_id = req.session.user_id;
//     const recipe_id = req.body.recipeId;
//     console.log(`Session user_id: ${user_id}`);
//     console.log(`Request body recipeId: ${recipe_id}`);
//     if (!user_id) {
//       console.warn("No user_id found in session.");
//       return res.status(401).send("User not logged in.");
//     }

//     if (!recipe_id) {
//       console.warn("No recipeId provided in request body.");
//       return res.status(400).send("Missing recipeId.");
//     }
//     await user_utils.markAsFavorite(user_id,recipe_id);
//     console.log(`Recipe ${recipe_id} successfully marked as favorite for user ${user_id}`);
//     res.status(200).send("The Recipe successfully saved as favorite");
//     } catch(error){
//     console.error("Error in /users/favoriteRecipes:", error);
//     next(error);
//   }
// })

router.post("/favoriteRecipes/:recipeId", async (req, res) => {
  const username = req.session?.username;
  const recipeId = req.params.recipeId;

  if (!username) {
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
        const apiRes = await recipes_utils.spoonacularGet(`/recipes/${recipeId}/information`);
        if (!apiRes || apiRes.status === 404) {
          return res.status(404).send("Recipe not found locally or in Spoonacular");
        }
        // recipe found in Spoonacular, proceed
      } catch (err) {
        return res.status(404).send("Recipe not found locally or in Spoonacular");
      }
    }

    // 4) Mark as favorite (insert into favorite_recipes if not already favorite)
      favCheck = await conn.query(
      "SELECT * FROM favorite_recipes WHERE username = ? AND recipe_id = ?",
      [username, recipeId]
    );

    if (favCheck.length === 0) {
      await conn.query(
        "INSERT INTO favorite_recipes (username, recipe_id) VALUES (?, ?)",
        [username, recipeId]
      );
      await conn.query("COMMIT"); //Commit changes in DB
    }

    res.status(200).send("Recipe marked as favorite");

  } catch (err) {
    console.error("Error marking recipe as favorite:", err);
    res.status(500).send("Server error");
  } finally {
    if (conn) await conn.release();
  }
});

//BY ABED



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
// BY ABED

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
// router.get('/favoriteRecipes', async (req,res,next) => {
//   try{
//     const username = req.session.username;
//     let favorite_recipes = {};
//     const recipes_id = await user_utils.getFavoriteRecipes(username);
//     let recipes_id_array = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
//     const results = await recipe_utils.extractRecipePreview(recipes_id_array); //change this. search using /recipes/{recipeId} , router.get("/:recipeId", async (req, res) 
//     res.status(200).send(results);
//   } catch(error){
//     next(error); 
//   }
// });
router.get('/favoriteRecipes', async (req, res, next) => {
  try {
    const username = req.session.username;
    if (!username) return res.status(401).send("User not logged in");

    // Step 1: Get favorite recipe IDs
    const recipes_id = await user_utils.getFavoriteRecipes(username);
    const recipes_id_array = recipes_id.map(el => el.recipe_id);

    // Step 2: Get user's personal recipes (for fallback)
    const myRecipes = await user_utils.getMyRecipes(req);

    // Step 3: Try Spoonacular first
    const recipeResults = await Promise.allSettled(
      recipes_id_array.map(id =>
        recipe_utils.spoonacularGet(`/recipes/${id}/information`)
      )
    );

    // Step 4: Build final result set
    const combinedRecipes = recipes_id_array.map((id, index) => {
      const result = recipeResults[index];

      if (result.status === 'fulfilled') {
        return result.value;
      }

      // Fallback to user's own recipes
      const localMatch = myRecipes.find(r => r.recipe_id === parseInt(id));
      if (localMatch) {
        return {
          id: localMatch.recipe_id,
          title: localMatch.title,
          image: localMatch.image,
          readyInMinutes: localMatch.readyInMinutes,
          vegan: localMatch.vegan,
          vegetarian: localMatch.vegetarian,
          glutenFree: localMatch.glutenFree,
          // Add other fields from your schema if needed
          source: "local"
        };
      }

      // If not found anywhere, return null
      return null;
    });

    // Step 5: Remove nulls
    const foundRecipes = combinedRecipes.filter(r => r !== null);

    res.status(200).json(foundRecipes);
  } catch (error) {
    next(error);
  }
});

//BY ABED
router.get('/users/familyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});



//last 3 viewed recipes IDS (/clickOnRecipe adds a recipe to the clicked list)
router.get("/last", async (req, res, next) => {
  let conn;
  try {
    const username = req.session.username;
    if (!username) {
      return res.status(401).send("User not logged in.");
    }

    //conn = await connection();
    conn = await mySql.connection();
    // Fetch lastClicks row for this user
    const result = await conn.query(
      "SELECT firstClicked, secondClicked, thirdClicked FROM lastClicks WHERE username = ?",
      [username]
    );

    if (result.length === 0) {
      // No record yet for this user
      return res.status(200).json([]);
    }

    const { firstClicked, secondClicked, thirdClicked } = result[0];

    // Return in order: most recent first
    const clicked = [thirdClicked, secondClicked, firstClicked].filter(
      (id) => id !== null && id !== undefined
    );

    res.status(200).json(clicked);
  } catch (err) {
    console.error("Error retrieving last viewed recipes:", err.message);
    res.status(500).send("Server error while fetching recipes.");
  } finally {
    if (conn) await conn.release();
  }
});

//add last recipe clicked until a max of 3
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
        const apiRes = await recipes_utils.spoonacularGet(`/recipes/${recipeId}/information`);
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




router.post("/users/familyRecipes", async (req, res, next) => {
  try {
    if (!req.session?.username) {
      return res.status(401).send("Unauthorized");
    }

    const recipeData = req.body;

    if (!recipeData.recipe_title || !recipeData.recipe_author || !recipeData.recipe_instructions) {
      return res.status(400).send("Missing required fields: title, author, or instructions");
    }

    await addMyFamilyRecipe(req.session.username, recipeData);
    res.status(201).send({ message: "Family recipe added successfully" });

  } catch (err) {
    next(err);
  }
});


router.get('/users/myRecipes', async (req, res, next) => {
  try {
    const results = await user_utils.getMyRecipes(req); 
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});


//by ABED


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


//by ABED


module.exports = router;
