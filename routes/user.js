var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");



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
router.post('/users/favoriteRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

//BY ABED



router.delete('/users/favoriteRecipes', async (req,res,next) => {
  try{
    const username = req.session.username;
    const recipeId = req.body.recipeId;
    await user_utils.removeFavoriteRecipe(username,recipeId);
    res.status(200).send("The Recipe successfully removed from favorites");
  } catch(error){
    next(error);
  }
});
// BY ABED

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/users/favoriteRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
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

/**
 * Check if a username is already taken
 */
router.delete("/exists/:username", async (req, res, next) => {
  try {
    const exists = await user_utils.isUsernameTaken(req.params.username);
    res.send({ exists });
  } catch (error) {
    next(error);
  }
});

//by ABED


module.exports = router;
