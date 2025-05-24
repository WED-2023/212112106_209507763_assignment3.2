var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");



// router.post("/Register", async (req, res, next) => {
//   try {
//     // parameters exists
//     // valid parameters
//     // username exists
//     let user_details = {
//       username: req.body.username,
//       firstname: req.body.firstname,
//       lastname: req.body.lastname,
//       country: req.body.country,
//       password: req.body.password,
//       email: req.body.email,
//     }
//     let users = [];
//     users = await DButils.execQuery("SELECT username from users");

//     if (users.find((x) => x.username === user_details.username))
//       throw { status: 409, message: "Username taken" };

//     // add the new username
//     let hash_password = bcrypt.hashSync(
//       user_details.password,
//       parseInt(process.env.bcrypt_saltRounds)
//     );
//     await DButils.execQuery(
//       `INSERT INTO users VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
//       '${user_details.country}', '${hash_password}', '${user_details.email}')`
//     );
//     res.status(201).send({ message: "user created", success: true });
//   } catch (error) {
//     next(error);
//   }
// });



// "/auth/register" --> /register by abed
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