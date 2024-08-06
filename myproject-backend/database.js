// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors'); // Require CORS
// const sequelize = require('./db-config.js');
// const userRoutes = require('./routes/userRoutes.js');
// const salesRoutes = require('./routes/salesRoutes.js');

// const app = express();
// app.use(cors()); // Use CORS middleware
// app.use(bodyParser.json());

// //any uri that starts with /api/user can add inside the userRoutes
// app.use("/api/user", userRoutes); 
// app.use("/api/sales", salesRoutes); 


// // PostgreSQL connection setup using sequelize
// sequelize.sync().then(() => {
//   console.log('Database & tables created!');
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

