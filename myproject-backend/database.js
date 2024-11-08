// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const { Sequelize } = require('sequelize');
// const sequelize = require('./config/db-config');
// const userRoutes = require('./routes/userRoutes');
// const salesRoutes = require('./routes/salesRoutes');

// // Import models
// const User = require('./models/user');
// const Customer = require('./models/customer');
// // Import other models...

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Initialize models
// const db = {
//   sequelize,
//   Sequelize,
//   User: User.init(sequelize),
//   Customer: Customer.init(sequelize),
//   // Initialize other models...
// };

// // Set up associations
// require('./models/association')(db);

// // Routes
// app.use("/api/user", userRoutes);
// app.use("/api/sales", salesRoutes);

// // Sync database
// sequelize.sync().then(() => {
//   console.log('Database & tables created!');
// }).catch(err => {
//   console.error('Error syncing database:', err);
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// module.exports = { app, sequelize };