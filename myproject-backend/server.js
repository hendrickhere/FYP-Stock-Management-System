const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

console.log('About to require models...');
const db = require('./models');
const { sequelize } = db;
console.log('\nModels loaded in db object:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

// Import routes after models are initialized
console.log('\nAbout to require routes...');
const userRoutes = require('./routes/userRoutes.js');
console.log('\nAfter loading userRoutes');
console.log('Models still available:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

const purchasesRouter = require('./routes/purchaseRoutes.js');
const stakeholdersRouter = require('./routes/stakeholderRoutes.js');
const productsRouter = require('./routes/product-CRUD');
const appointmentsRouter = require('./routes/appointmentRoutes');
const salesRoutes = require('./routes/salesRoutes.js');
const chatbotRoutes = require('./chatbot-api/chatBotServer.js');
const userController = require('./controller/userController');
const authMiddleware = require('./backend-middleware/authMiddleware');
const warrantyRoutes = require('./routes/warrantyRoutes');
const taxRoutes = require('./routes/taxesRoutes.js')

console.log('\nAfter loading all routes');
console.log('Final model state:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json({limit: '50mb'}));
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Database sync
sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

// Routes
app.post('/api/token/refresh', userController.refreshToken);
app.post('/api/user/login', userController.login);
app.post('/api/user/signup', userController.signup);

app.use(authMiddleware);
app.use('/api/user', userRoutes);
app.use('/api/purchases', purchasesRouter);
app.use('/api/stakeholders', stakeholdersRouter);
app.use('/api/products', productsRouter);
app.use('/api/appointment', appointmentsRouter);
app.use("/api/sales", salesRoutes); 
app.use('/api/chatbot', chatbotRoutes);
app.use('/api', taxRoutes)
app.use('/api', warrantyRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for use in other files
module.exports = { app, sequelize, db };