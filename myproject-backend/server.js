const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const purchasesRouter = require('./purchases-CRUD');
const stakeholdersRouter = require('./stakeholders-CRUD');
const productsRouter = require('./product-CRUD');
const appointmentsRouter = require('./appointments-CRUD');

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
