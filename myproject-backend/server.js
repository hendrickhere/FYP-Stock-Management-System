const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./db-config.js');
const purchasesRouter = require('./routes/purchaseRoutes.js');
const stakeholdersRouter = require('./routes/stakeholders-CRUD');
const productsRouter = require('./routes/product-CRUD');
const appointmentsRouter = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes.js');
const salesRoutes = require('./routes/salesRoutes.js');
const chatbotRoutes = require('./chatbot-api/chatBotServer.js');
const userController = require('./controller/userController');
const authMiddleware = require('./backend-middleware/authMiddleware');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// Refresh token endpoint
app.post('/api/token/refresh', userController.refreshToken);
app.post('/api/user/login', userController.login);
app.post('/api/user/signup', userController.signup);

// API routes
app.use(authMiddleware);
app.use('/api/user', userRoutes);
app.use('/api/purchases', purchasesRouter);
app.use('/api/stakeholders', stakeholdersRouter);
app.use('/api/products', productsRouter);
app.use('/api/appointment', appointmentsRouter);
app.use("/api/sales", salesRoutes); 
app.use('/api/chatbot', chatbotRoutes);

// sequelize.sync().then(() => {
//   console.log('Database & tables created!');
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

