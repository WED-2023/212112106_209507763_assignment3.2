var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.get("/", async (req, res) => {
  try {
    // Fetch 3 random recipes from the utility function (like /recipes/random)
    const randomData = await recipes_utils.spoonacularGet("/random", { number: 3 });
    const randomPreviews = randomData.recipes.map(recipe =>
      recipes_utils.extractRecipePreview(recipe)
    );

    // Prepare the response object
    const response = {
      randomRecipes: randomPreviews,
      lastClickedRecipes: []
    };

    // If user is logged in, fetch last clicked recipe IDs
    if (req.session?.username) {
      const conn = await connection();
      try {
        const result = await conn.query(
          "SELECT firstClicked, secondClicked, thirdClicked FROM lastClicks WHERE username = ?",
          [req.session.username]
        );

        if (result.length > 0) {
          const { firstClicked, secondClicked, thirdClicked } = result[0];
          // Most recent first order
          response.lastClickedRecipes = [thirdClicked, secondClicked, firstClicked].filter(id => id !== null && id !== undefined);
        }
      } finally {
        await conn.release();
      }
    } else {
      // User not logged in, optionally you could send 401 or just no lastClickedRecipes
      // return res.status(401).send("You are not logged in");
    }

    res.status(200).json(response);

  } catch (err) {
    console.error("Error in GET /:", err.message);
    res.status(500).send("Server error while fetching recipes.");
  }
});

//Added by Abed 19062025
router.get("/countries", async (req, res, next) => {
  try {
    const response = await axios.get("https://restcountries.com/v3.1/all");
    const countryNames = response.data.map(c => c.name.common).sort();
    res.json(countryNames);
  } catch (err) {
    next(err);
  }
});
//Added by Abed 19062025
router.post("/auth/register", async (req, res, next) => {
  try {
    const {
      username,
      firstname,
      lastname,
      country,
      email,
      password,
      password_confirmation
    } = req.body;

    // Check required parameters
    if (!username || !firstname || !lastname || !country || !email || !password || !password_confirmation) {
      return res.status(400).send("Missing required fields");
    }

    // Check password confirmation
    if (password !== password_confirmation) {
      return res.status(400).send("Password confirmation does not match");
    }
    const connection = await MySql.connection();

    // Check if username already exists
    const existingUsers = await connection.query("SELECT username FROM users WHERE username = ?", [username]);
    if (existingUsers.length > 0) {
      await connection.release();
      return res.status(409).send("Username already exists");
    }
    // Hash password
    const hash_password = bcrypt.hashSync(password, 14);


    // Insert user
    await connection.query(
        `INSERT INTO users (username, first_name, last_name, country, password, email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, firstname, lastname, country, hash_password, email]
    );

    await connection.query("COMMIT"); // doesnt enter intom DB the last commit

    await connection.release();
    res.status(201).send({ message: "user created", success: true });

  } catch (error) {
    next(error);
  }
});


router.post("/auth/login", async (req, res, next) => {
  try {

    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).send("Missing credentials");

    const connection = await MySql.connection();

    const users = await connection.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
    );

    await connection.release();

    if (users.length === 0)
      return res.status(401).send("Invalid username or password");

    const user = users[0];

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword)
      return res.status(401).send("Invalid username or password");

    // Set session (if you're using sessions)
    req.session.username = user.username;

    res.status(200).send({
      token: "session",
      message: "Login successful"
    });

  } catch (err) {
    next(err);
  }
});


router.post("/auth/logout", (req, res) => {
  if (!req.session?.username) {
    return res.status(401).send("You are not logged in");
  }
  console.log(req.session);
  req.session.reset();
  res.status(200).send("logout succeeded");
});



module.exports = router;