const express = require('express');
const router = express.Router();
const UserController = require('../controller/userController');

//add here, and then construct the controller and service method, service is 
//data access layer, while controller is the presentation layer
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);

module.exports = router;