const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Require CORS

const app = express();
app.use(cors()); // Use CORS middleware
app.use(bodyParser.json());

// PostgreSQL connection setup
const pool = new Pool({
  user: 'my_user',
  host: 'localhost',
  database: 'Stock_Management',
  password: 'root',
  port: 5432,
});

// Sign Up endpoint
app.post('/api/signup', async (req, res) => {
  console.log("Received signup data:", req.body);
  const { username, email, password, role } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      res.status(409).send({ message: 'User already exists' });
    } else {
    if (!password) {
        return res.status(400).send({ message: 'Password is required' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, hashedPassword, role]
      );
      res.status(201).send({ message: 'User created', user: newUser.rows[0] });
    }
  } catch (error) {
    console.error('Error during signup:', error.message, error.stack);
      if (error instanceof TypeError) {
        return res.status(400).send({ message: 'Bad input format', error: error.message });
      }
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (isValid) {
        res.status(200).send({ message: 'Login successful', role: user.role });
      } else {
        res.status(403).send({ message: 'Invalid credentials' });
      }
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error during login:', error.message, error.stack);
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool;
