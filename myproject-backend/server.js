const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./db-config.js');
const purchasesRouter = require('./routes/purchases-CRUD');
const stakeholdersRouter = require('./routes/stakeholders-CRUD');
const productsRouter = require('./routes/product-CRUD');
const appointmentsRouter = require('./routes/appointments-CRUD');
const userRoutes = require('./routes/userRoutes.js');
const salesRoutes = require('./routes/salesRoutes.js');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/purchases', purchasesRouter);
app.use('/api/stakeholders', stakeholdersRouter);
app.use('/api/products', productsRouter);
app.use('/api', appointmentsRouter);
app.use("/api/user", userRoutes); 
app.use("/api/sales", salesRoutes); 

// sequelize.sync().then(() => {
//   console.log('Database & tables created!');
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
