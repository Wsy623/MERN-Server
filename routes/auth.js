const router = require("express").Router();
const registerValidation = require("../valiadation").registerValidation;
const loginValidation = require("../valiadation").loginValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

//middlewares
router.use((req, res, next) => {
  console.log("Receiving an Auth-related request");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("Successfully connected to the Auth route");
});

router.post("/register", async (req, res) => {
  let { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) {
    return res.status(400).send("This email has beend registered");
  }
  let { username, email, password, role } = req.body;
  let newUser = new User({ username, email, password, role });

  try {
    let savedUser = await newUser.save();
    res.send({ msg: "User saved successfully!", savedUser });
  } catch (e) {
    return res.status(500).send("Can't save user");
  }
});

router.post("/login", async (req, res) => {
  let { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send("Can't find user");
  }

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (isMatch) {
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        msg: "Successfully logged in!",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      res.status(400).send("Incorrect password");
    }
  });
});

module.exports = router;
