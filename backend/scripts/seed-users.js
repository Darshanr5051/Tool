const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

const getUsers = () => {
  const data = fs.readFileSync(usersFile, 'utf8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

async function seedUsers() {
  const users = getUsers();

  const newUsersData = [
    { username: 'Manish@siqol.com', fullName: 'Manish', email: 'Manish@siqol.com' },
    { username: 'Bharati@siqol.com', fullName: 'Bharati', email: 'Bharati@siqol.com' },
    { username: 'Dishank@siqol.com', fullName: 'Dishank', email: 'Dishank@siqol.com' },
    { username: 'Arjun@siqol.com', fullName: 'Arjun', email: 'Arjun@siqol.com' },
    { username: 'Pratha@siqol.com', fullName: 'Pratha', email: 'Pratha@siqol.com' },
  ];

  // Default password for all new users
  const defaultPassword = 'Welcome123!';

  let addedCount = 0;
  const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

  for (let i = 0; i < newUsersData.length; i++) {
    const userData = newUsersData[i];
    const existingUser = users.find(u => u.username === userData.username);

    if (existingUser) {
      console.log(`User ${userData.username} already exists, skipping...`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const newUser = {
      id: nextId + addedCount,
      username: userData.username,
      password: hashedPassword,
      fullName: userData.fullName,
      email: userData.email,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    addedCount++;
    console.log(`Created user: ${userData.username}`);
  }

  saveUsers(users);
  console.log(`\nSuccessfully created ${addedCount} new users.`);
  console.log(`Default password for all users: Welcome123!`);
}

seedUsers().catch(console.error);
