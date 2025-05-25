var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const MySql = require("../routes/utils/MySql");
const { addMyRecipe } = require("./utils/recipes_utils");


//=================== GET ===================

// Random Get 3 Recipes
router.get("/random", async (req, res, next) => {
  try {
    const data = await recipes_utils.spoonacularGet("/random", { number: 3 });
    const previews = data.recipes.map(recipe =>
        recipes_utils.extractRecipePreview(recipe)
    );
    res.status(200).json(previews);
  } catch (err) {
    res.status(500).send("Server error while fetching recipes.");
  }
});




router.get("/search", async (req, res, next) => {
  try {
    let {
      query,
      cuisine,
      diet,
      intolerances,
      number = 5
    } = req.query;

    // If no query provided, check session cache
    if (!query) {
      if (req.session.lastSearch) {
        console.log("Using cached search from session");
        ({ query, cuisine, diet, intolerances, number } = req.session.lastSearch);
      } else {
        // respond with empty result
        return res.status(200).json({
          message: "No recent search in session",
          results: []
        });
      }
    }

    // Store current query in session
    req.session.lastSearch = { query, cuisine, diet, intolerances, number };

    // Call Spoonacular API
    const searchParams = { query, cuisine, diet, intolerances, number };
    const response = await recipes_utils.spoonacularGet("/complexSearch", searchParams);

    res.status(200).json(response.results || response);
  } catch (error) {
    console.error("Spoonacular search failed:", error.message);
    const status = error.response?.status || 500;
    res.status(status).send({ message: "Search failed", detail: error.message });
  }
});



//Search API by ID, first search in database if not exist search in API
router.get("/:recipeId", async (req, res) => {
  const { recipeId } = req.params;

  let conn;
  try {
    // Step 1: Connect to DB
    conn = await MySql.connection();
    const result = await conn.query(
      "SELECT * FROM myrecipes WHERE recipe_id = ?",
      [recipeId]
    );

    if (result.length > 0) {
      console.log(`Recipe ${recipeId} found in local database.`);
      res.status(200).json(result[0]);
    } else {
      console.log(`Recipe ${recipeId} not found in DB. Fetching from Spoonacular.`);

      // Step 2: Fetch from Spoonacular
      const data = await recipes_utils.spoonacularGet(`/${recipeId}/information`, {
        includeNutrition: false
      });

      const preview = recipes_utils.extractRecipePreview(data);
      res.status(200).json(preview);
    }
  } catch (err) {
    console.error(`Error fetching recipe ${recipeId}:`, err.message);
    const status = err.response?.status || 500;

    if (status === 404) {
      res.status(404).send({ message: "Recipe not found" });
    } else {
      res.status(500).send({ message: "Failed to fetch recipe preview" });
    }
  } finally {
    if (conn) {
      await conn.release(); // Ensure connection is released back to pool
    }
  }
});

//=================== END GET ===================


//=================== POST ===================

router.post("/create", async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) {
      return res.status(401).send({ message: "Unauthorized. Please log in." });
    }

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
    } = req.body;

    // Basic validation
    if (
        !recipe_title || !recipe_image || !prep_duration || !instructions ||
        !Array.isArray(extendedIngredients) || extendedIngredients.length === 0 ||
        typeof vegetarian !== "boolean" || typeof vegan !== "boolean" || typeof gluten_free !== "boolean" ||
        typeof amount_of_meals !== "number"
    ) {
      return res.status(400).send({ message: "Invalid or missing fields in request" });
    }

    // Insert into DB
    await addMyRecipe(username, {
      recipe_title,
      recipe_image,
      prep_duration,
      vegetarian,
      vegan,
      gluten_free,
      amount_of_meals,
      instructions,
      extendedIngredients
    });

    res.status(201).send({ message: "Recipe successfully created" });

  } catch (err) {
    console.error("Failed to create recipe:", err.message);
    next(err);
  }
});



//=================== END POST ===================



//=================== DELETE ===================


router.delete("/:recipeId", async (req, res, next) => {
  try {
    if (!req.session?.username) {
      return res.status(401).send("Unauthorized");
    }

    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      return res.status(400).send("Invalid recipe ID");
    }

    const success = await recipes_utils.deleteMyRecipe(req.session.username, recipeId);
    if (success) {
      res.status(200).send({ message: "Recipe deleted" });
    } else {
      res.status(404).send({ message: "Recipe not found or unauthorized" });
    }

  } catch (err) {
    next(err);
  }
});

//=================== END DELETE ===================



module.exports = router;
