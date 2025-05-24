var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const MySql = require("../routes/utils/MySql");
const { addMyRecipe } = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("I'm here"));


router.get("/:recipeId", async (req, res) => {
  const { recipeId } = req.params;

  try {
    const data = await recipes_utils.spoonacularGet(`/${recipeId}/information`, {
      includeNutrition: false
    });

    const preview = recipes_utils.extractRecipePreview(data);
    res.status(200).json(preview);
  } catch (err) {
    const status = err.response?.status || 500;

    if (status === 404) {
      res.status(404).send({ message: "Recipe not found" });
    } else {
      console.error(`Failed to get recipe ${recipeId}:`, err.message);
      res.status(500).send({ message: "Failed to fetch recipe preview" });
    }
  }
});


router.get("/", async (req, res, next) => {
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


//by michael OLD CREATE RECIPE

// router.post("/create", async (req, res, next) => {
//   try {
//     if (!req.session?.username) {
//       return res.status(401).send("Unauthorized");
//     }

//     const {
//       recipe_image,
//       recipe_title,
//       prep_duration,
//       popularity,
//       vegetarian,
//       vegan,
//       gluten_free,
//       clicked_by_user,
//       saved_by_user,
//       ingredients,
//       instructions,
//       amount_of_meals
//     } = req.body;

//     if (
//         !recipe_image || !recipe_title || !prep_duration ||
//         popularity === undefined || vegetarian === undefined ||
//         vegan === undefined || gluten_free === undefined ||
//         clicked_by_user === undefined || saved_by_user === undefined ||
//         !Array.isArray(ingredients) || ingredients.length === 0 ||
//         !instructions || amount_of_meals === undefined
//     ) {
//       return res.status(400).send("Missing or invalid fields");
//     }

//     const connection = await MySql.connection();

//     try {
//       await connection.query("START TRANSACTION");

//       // Insert into recipes table
//       const result = await connection.query(
//           `INSERT INTO recipes 
//           (username, recipe_title, recipe_image, prep_duration, popularity, vegetarian, vegan, gluten_free, clicked_by_user, saved_by_user, instructions, amount_of_meals)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             req.session.username,
//             recipe_title,
//             recipe_image,
//             prep_duration,
//             popularity,
//             vegetarian,
//             vegan,
//             gluten_free,
//             clicked_by_user,
//             saved_by_user,
//             instructions,
//             amount_of_meals
//           ]
//       );

//       const recipeId = result.insertId;

//       // Insert ingredients
//       for (const { name, amount } of ingredients) {
//         await connection.query(
//             `INSERT INTO ingredients (recipe_id, name, amount) VALUES (?, ?, ?)`,
//             [recipeId, name, amount]
//         );
//       }

//       await connection.query("COMMIT");
//       res.status(201).send({ message: "Recipe created", recipe_id: recipeId });
//     } catch (err) {
//       await connection.query("ROLLBACK");
//       throw err;
//     } finally {
//       await connection.release();
//     }
//   } catch (err) {
//     console.error("Error:", err.message);
//     next(err);
//   }
// });

//by Michael 

//BY ABED



router.post("/create", async (req, res, next) => {
  try {
    if (!req.session?.username) {
      return res.status(401).send("Unauthorized");
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

    if (
      !recipe_title || !recipe_image || !prep_duration ||
      vegetarian === undefined || vegan === undefined || gluten_free === undefined ||
      amount_of_meals === undefined || !instructions ||
      !Array.isArray(extendedIngredients) || extendedIngredients.length === 0
    ) {
      return res.status(400).send("Missing or invalid fields");
    }

    await addMyRecipe(req.session.username, {
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

    res.status(201).send({ message: "Recipe created" });

  } catch (err) {
    console.error("Error:", err.message);
    next(err);
  }
});


router.delete("/:id", async (req, res, next) => {
  try {
    if (!req.session?.username) {
      return res.status(401).send("Unauthorized");
    }

    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      return res.status(400).send("Invalid recipe ID");
    }

    const success = await deleteMyRecipe(req.session.username, recipeId);
    if (success) {
      res.status(200).send({ message: "Recipe deleted" });
    } else {
      res.status(404).send({ message: "Recipe not found or unauthorized" });
    }

  } catch (err) {
    next(err);
  }
});

// Function to get random recipes preview from the backend by abed todo
// export async function getRandomRecipesPreview(numOfRecipes = 3) {
//   try {
//     // Send GET request to the backend to get random recipes
//     const response = await axios.get(`${server_domain}/recipes/random`, {
//       params: {
//         number: numOfRecipes
//       }
//     });

//        // If the response is successful, return the preview data
//     if (response && response.data) {
//       return { status: response.status, data: { recipes: response.data } };
//     } else {
//       throw { status: 500, data: { error: 'Unexpected server response' } };
//     }
//   } catch (error) {
//     // Handle errors, including those returned by the server
//     if (error.response && error.response.data) {
//       throw { status: error.response.status, data: error.response.data };
//     } else {
//       throw { status: 500, data: { error: 'An unexpected error occurred' } };
//     }
//   }
// }

module.exports = router;
