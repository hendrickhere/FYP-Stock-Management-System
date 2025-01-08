const bcrypt = require('bcryptjs');

const mockUsers = {
  valid: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'Staff',
    organization_id: 1
  },
  manager: {
    username: 'manager',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'Manager',
    organization_id: 1
  }
};

const createHashedUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return {
    ...userData,
    password_hash: hashedPassword
  };
};

module.exports = {
  mockUsers,
  createHashedUser
};