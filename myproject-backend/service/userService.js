const User = require("../model/user");
const bcrypt = require('bcryptjs');

exports.signup = async (userData) => {
  const { username, email, password, role, created_at } = userData;

  const userExists = await User.findOne({
    where: {
      email: email,
    },
  });
  if (userExists) {
    throw new Error("User already exists");
  } else {
    if (!password) {
      throw new Error("Password is required");
    }
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password_hash,
      role,
      created_at,
    });
    console.log(newUser);
    if (!newUser) {
      throw new Error("Failed to create user, please try again later");
    }
    return newUser.dataValues;
  }
};

exports.login = async (loginData) => {
  const { email, password } = loginData;

  const result = await User.findOne({
    where: {
      email: email,
    },
  });
  if (result) {
    console.log(result.dataValues);
    const user = result.dataValues; 
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (isValid) {
      return user;
    } else {
      throw new Error("Invalid Credentials");
    }
  } else {
    throw new Error("User not found");
  }
};
