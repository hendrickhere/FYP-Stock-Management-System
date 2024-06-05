const UserService = require("../service/userService");

exports.signup = async (req, res) => {
  console.log("Received signup data:", req.body);
  try {
    const signupData = req.body;
    const user = await UserService.signup(signupData);
    res.status(201).send({ message: "User created", user: user });
  } catch (err) {
    console.error("Error during signup:", err.message, err.stack);
    if (err instanceof TypeError) {
      res
        .status(400)
        .send({ message: "Bad input format", error: err.message });
    } else if (err.message == "Password is required") {
      res.status(400).send({ message: "Password is required" });
    } else if (err.message == "User already exists") {
      res.status(409).send({ message: "User already exists" });
    } else
      res.status(500).send({ message: "Server error", err: err.message });
  }
};

exports.login = async (req, res) => {
  const loginData = req.body;
  try {
    const user = await UserService.login(loginData);
    res.status(200).send({ message: "Login successful", role: user.role });
  } catch (err) {
    if (err.message === "Invalid Credentials") {
      res.status(403).send({ message: err.message });
    } else if (err.message === "User not found") {
      res.status(404).send({ message: err.message });
    }
  }
};
