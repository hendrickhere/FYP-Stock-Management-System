# STOCK_MANAGEMENT Project Setup

## Database Configuration Setup

Before running the project, you need to set up your configuration files. Follow these steps:

### 1. Create Configuration Files

After cloning the repository, create your configuration files from the templates:

```bash
# Navigate to the config directory
cd myproject-backend/config

# Create env.js from template
cp env.template.js env.js

# Create config.json from template
cp config.template.json config.json
```

### 2. Update Configuration Files

#### In `env.js`:

Update the following values with your PostgreSQL credentials:

```javascript
const username = "YOUR_DB_USERNAME"; // e.g., 'postgres'
const password = "YOUR_DB_PASSWORD"; // Your database password
const database_name = "YOUR_DATABASE_NAME"; // e.g., 'Stock_Management'
```

#### In `config.json`:

Update the development configuration with your database details:

```json
{
  "development": {
    "username": "YOUR_DB_USERNAME",
    "password": "YOUR_DB_PASSWORD",
    "database": "YOUR_DATABASE_NAME",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

### 3. Important Notes

- Never commit your actual configuration files (`env.js`, `config.json`)
- These files contain sensitive information and are ignored by git
- Each team member should maintain their own local copies with their credentials
- The template files show the required structure but contain no sensitive data

### 4. Git Ignore Configuration

The following files are ignored in git:

- `myproject-backend/config/env.js`
- `myproject-backend/config/config.json`

Template files are tracked in git:

- `myproject-backend/config/*.template.js`
- `myproject-backend/config/*.template.json`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Ensure your PostgreSQL server is running

3. Start the application:

```bash
cd frontend
npm start
```

## Need Help?

If you encounter any issues with the setup, please contact the team lead or refer to the project documentation.
