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
    console.log("Raw data from Spoonacular:", JSON.stringify(data.recipes, null, 2)); 
    const previews = data.recipes.map(recipe =>
        recipes_utils.extractRecipePreview(recipe)
        
    );
  console.log("Preview recipes returned to frontend:", previews); 
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
// router.get("/:recipeId", async (req, res) => {
//   const { recipeId } = req.params;

//   let conn;
//   try {
//     // Step 1: Connect to DB
//     conn = await MySql.connection();
//     const result = await conn.query(
//       "SELECT * FROM myrecipes WHERE recipe_id = ?",
//       [recipeId]
//     );

//     if (result.length > 0) {
//       console.log(`Recipe ${recipeId} found in local database.`);
//       res.status(200).json(result[0]);
//     } else {
//       console.log(`Recipe ${recipeId} not found in DB. Fetching from Spoonacular.`);

//       // Step 2: Fetch from Spoonacular
//       const data = await recipes_utils.spoonacularGet(`/${recipeId}/information`, {
//         includeNutrition: false
//       });

//       const preview = recipes_utils.extractRecipePreview(data);
//       res.status(200).json(preview);
//     }
//   } catch (err) {
//     console.error(`Error fetching recipe ${recipeId}:`, err.message);
//     const status = err.response?.status || 500;

//     if (status === 404) {
//       res.status(404).send({ message: "Recipe not found" });
//     } else {
//       res.status(500).send({ message: "Failed to fetch recipe preview" });
//     }
//   } finally {
//     if (conn) {
//       await conn.release(); // Ensure connection is released back to pool
//     }
//   }
// });

// In your Express router file:
router.get("/:recipeId", async (req, res) => {
  const { recipeId } = req.params;
  const username = req.session?.username;
  let conn;

  try {
    conn = await MySql.connection();

    // Try local DB first
    const rows = await conn.query(
      "SELECT * FROM myrecipes WHERE recipe_id = ?",
      [recipeId]
    );

    let recipeData;
    if (rows.length > 0) {
      // Found in local DB. Adjust column names if different in your schema.
      const row = rows[0];
      // Parse ingredients JSON if stored as text; otherwise adjust.
      let ingredients = [];
      if (row.ingredients_json) {
        try {
          const parsed = JSON.parse(row.ingredients_json);
          if (Array.isArray(parsed)) {
            ingredients = parsed;
          }
        } catch (_) {}
      }
      recipeData = {
        recipe_image: row.recipe_image,
        recipe_title: row.recipe_title,
        prep_duration: row.prep_duration, // e.g. "00:45:00"
        popularity: row.popularity,
        vegetarian: Boolean(row.vegetarian),
        vegan: Boolean(row.vegan),
        gluten_free: Boolean(row.gluten_free),
        ingredients,                 // array of { name, amount }
        instructions: row.instructions || "", // text
        amount_of_meals: row.amount_of_meals,
        id: String(recipeId),
      };
    } else {
      // Not in DB: fetch from Spoonacular
      console.log(`Recipe ${recipeId} not found locally. Fetching from Spoonacular.`);
      let data;
      try {
        data = await recipes_utils.spoonacularGet(`/${recipeId}/information`, {
          includeNutrition: false
        });
      } catch (err) {
        console.error(`Spoonacular fetch error for ${recipeId}:`, err.message);
        return res.status(404).send({ message: "Recipe not found locally or in Spoonacular" });
      }
      if (!data || !data.id) {
        return res.status(404).send({ message: "Recipe not found locally or in Spoonacular" });
      }
      // Build fields:
      // Convert readyInMinutes to "HH:MM:SS"
      const minutes = data.readyInMinutes || 0;
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const pad = (n) => String(n).padStart(2, '0');
      const prep_duration = `${pad(hrs)}:${pad(mins)}:00`;

      // Ingredients array
      const ingredients = Array.isArray(data.extendedIngredients)
        ? data.extendedIngredients.map(i => {
            // e.g. { name: "Sugar", amount: "2 cups" }
            const unit = i.unit || "";
            const amt = i.amount != null ? `${i.amount} ${unit}`.trim() : "";
            return { name: i.name || i.originalName || "", amount: amt };
          })
        : [];

      // Instructions: flatten analyzedInstructions if present
      let instructions = "";
      if (Array.isArray(data.analyzedInstructions) && data.analyzedInstructions.length) {
        data.analyzedInstructions.forEach(block => {
          if (Array.isArray(block.steps)) {
            block.steps.forEach(step => {
              if (step.number != null && step.step) {
                instructions += `${step.number}. ${step.step}\n`;
              }
            });
          }
        });
      } else if (data.instructions) {
        // data.instructions may be HTML; strip tags naively:
        const text = data.instructions.replace(/<[^>]+>/g, '');
        instructions = text + "\n";
      }
      recipeData = {
        recipe_image: data.image || "",
        recipe_title: data.title || "",
        prep_duration,
        popularity: data.aggregateLikes || 0,
        vegetarian: Boolean(data.vegetarian),
        vegan: Boolean(data.vegan),
        gluten_free: Boolean(data.glutenFree),
        ingredients,
        instructions,
        amount_of_meals: data.servings || null,
        id: String(recipeId),
      };
    }

    // Now add user-specific flags:
    // clicked_by_user
    let clicked_by_user = false;
    if (username) {
      try {
        const clickRows = await conn.query(
          "SELECT firstClicked, secondClicked, thirdClicked FROM lastClicks WHERE username = ?",
          [username]
        );
        if (clickRows.length > 0) {
          const { firstClicked, secondClicked, thirdClicked } = clickRows[0];
          // Compare as strings or numbers
          const ids = [firstClicked, secondClicked, thirdClicked].map(x => String(x));
          if (ids.includes(String(recipeId))) {
            clicked_by_user = true;
          }
        }
      } catch (err) {
        console.error("Error checking lastClicks:", err);
      }
    }
    recipeData.clicked_by_user = clicked_by_user;

    // saved_by_user
    let saved_by_user = false;
    if (username) {
      try {
        const favRows = await conn.query(
          "SELECT 1 FROM favorite_recipes WHERE username = ? AND recipe_id = ?",
          [username, recipeId]
        );
        if (favRows.length > 0) {
          saved_by_user = true;
        }
      } catch (err) {
        console.error("Error checking favorite_recipes:", err);
      }
    }
    recipeData.saved_by_user = saved_by_user;

    return res.status(200).json(recipeData);
  } catch (err) {
    console.error(`Error fetching recipe ${recipeId}:`, err);
    return res.status(500).send({ message: "Server error fetching recipe details" });
  } finally {
    if (conn) {
      await conn.release();
    }
  }
});

//=================== END GET ===================


//=================== POST ===================

router.post("/create", async (req, res, next) => {
  try {
    const username = req.session?.username;
    console.log("Session username:", username);
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
    console.log("Received recipe body:", {
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

    // Basic validation
    if (
        !recipe_title || !recipe_image || !prep_duration || !instructions ||
        !Array.isArray(extendedIngredients) || extendedIngredients.length === 0 ||
        typeof vegetarian !== "boolean" || typeof vegan !== "boolean" || typeof gluten_free !== "boolean" ||
        typeof amount_of_meals !== "number"
    ) {
      return res.status(400).send({ message: "Invalid or missing fields in request" });
    }
   console.log("Validation passed. Inserting into DB...");
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

    
    console.log("Recipe inserted successfully.");
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
