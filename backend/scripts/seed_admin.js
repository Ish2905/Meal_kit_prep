// backend/scripts/seed_admin.js
// One-time script to create/update the admin user with email admin@example.com and password 123

const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const db = require('../src/db');

dotenv.config();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const name = 'System Admin';
  const username = 'admin';
  const plain = '123';
  const hash = await bcrypt.hash(plain, 10);
  const address = 'Admin HQ';
  const city = 'City';
  const state = 'State';
  const pincode = '000000';

  try {
    // Check if exists
    const [rows] = await db.query('SELECT Customer_ID FROM Customers WHERE Email = ?', [email]);
    if (rows.length) {
      const id = rows[0].Customer_ID;
      await db.query('UPDATE Customers SET Username = ?, Password_Hash = ? WHERE Customer_ID = ?', [username, hash, id]);
      console.log(`Updated admin credentials for ${email} (Customer_ID=${id}).`);
    } else {
      // Create minimal record; procedures may enforce more, so insert directly here.
      const [result] = await db.query(
        'INSERT INTO Customers (Name, Email, Username, Password_Hash, Address, City, State, Pincode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, username, hash, address, city, state, pincode]
      );
      console.log(`Created admin user ${email} (Customer_ID=${result.insertId}).`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  }
}

main();
