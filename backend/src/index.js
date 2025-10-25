// src/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // set in .env to restrict admin actions

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

app.get('/', (req, res) => res.send('Meal Kit Backend Server is running!'));

// Health check (verifies DB connectivity)
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 AS ok');
        res.json({ ok: true, db: rows[0].ok === 1 });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Plans
app.get('/api/plans', async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT Plan_ID, Plan_Name, Price FROM Plans ORDER BY Plan_ID');
        res.json(rows);
    } catch (e) {
        console.error('Error fetching plans:', e);
        res.status(500).json({ error: 'Failed to fetch plans.' });
    }
});

app.post('/api/register', async (req, res) => {
  try {
        const { name, email, username, password, phone, address, city, state, pincode, allergy_ids, preference_ids } = req.body;
        if (!name || !email || !address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
        const [results] = await db.query('CALL sp_RegisterCustomer(?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, email, phone, address, city, state, pincode, allergy_ids || '', preference_ids || '']);
    const newCustomerId = results[0][0].CustomerID;

        // Optional credential setup (if provided)
        if (username && password) {
            const hash = await bcrypt.hash(password, 10);
            try {
                await db.query('UPDATE Customers SET Username = ?, Password_Hash = ? WHERE Customer_ID = ?', [username, hash, newCustomerId]);
            } catch (credErr) {
                // If username is duplicate or columns missing, report useful error
                if (credErr.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This username is already taken.' });
                if (credErr.code === 'ER_BAD_FIELD_ERROR') return res.status(500).json({ error: 'Credential columns missing. Run the latest SQL migration to add Username and Password_Hash.' });
                throw credErr;
            }
        }
    res.status(201).json({ message: 'Customer registered successfully!', customerId: newCustomerId });
  } catch (error) {
    console.error('Error registering customer:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This email address is already registered.' });
    if (error.code === 'ER_BAD_NULL_ERROR') return res.status(400).json({ error: `A required field was left empty: ${error.message}` });
    res.status(500).json({ error: 'An unexpected database error occurred.' });
  }
});

app.post('/api/login', async (req, res) => {
    try {
                const { email, identifier, password } = req.body;

                // If password is provided, perform credential check using either username or email
                if (password) {
                        const id = identifier || email;
                        if (!id) return res.status(400).json({ error: 'Username or Email is required.' });
                        const [users] = await db.query('SELECT Customer_ID, Name, Password_Hash FROM Customers WHERE Email = ? OR Username = ?', [id, id]);
                        if (users.length === 0) return res.status(404).json({ error: 'No account found for provided identifier.' });
                        const user = users[0];
                        if (!user.Password_Hash) return res.status(400).json({ error: 'This account does not have a password set.' });
                        const ok = await bcrypt.compare(password, user.Password_Hash);
                        if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });
                        return res.status(200).json({ message: 'Login successful!', customerId: user.Customer_ID, name: user.Name });
                }

                // Backward compatible: email-only login
                if (!email) return res.status(400).json({ error: 'Email is required.' });
                const [users] = await db.query('SELECT Customer_ID, Name FROM Customers WHERE Email = ?', [email]);
                if (users.length === 0) return res.status(404).json({ error: 'No account found with that email address.' });
                const user = users[0];
                return res.status(200).json({ message: 'Login successful!', customerId: user.Customer_ID, name: user.Name });
        
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'An unexpected database error occurred during login.' });
    }
});

app.get('/api/master-data', async (req, res) => {
    try {
        const [allergies] = await db.query('SELECT * FROM Allergies ORDER BY Allergy_Name');
        const [preferences] = await db.query('SELECT * FROM Dietary_Preferences ORDER BY Preference_Name');
        res.status(200).json({ allergies, preferences });
    } catch (error) {
        console.error('Error fetching master data:', error);
        res.status(500).json({ error: 'Failed to fetch master data.' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { customer_id, plan_id, mealkit_ids, payment_method } = req.body;
        if (!customer_id || !plan_id || !mealkit_ids || !payment_method) {
            return res.status(400).json({ error: 'Missing required fields for placing an order.' });
        }
        const [results] = await db.query('CALL sp_PlaceOrder(?, ?, ?, ?)', [customer_id, plan_id, mealkit_ids, payment_method]);
        const newOrderId = results[0][0].NewOrderID;
        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Database error occurred while placing order.', details: error.message });
    }
});

// Order History
app.get('/api/orders/history/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM vw_OrderHistory WHERE Customer_ID = ? ORDER BY Order_Date DESC', [customerId]);
            return res.status(200).json(rows);
        } catch (viewErr) {
            // Fallback if view not available: join Deliveries to get status
            const [rows] = await db.query(
                'SELECT o.Order_ID, o.Customer_ID, o.Order_Date, d.Delivery_Status AS Status ' +
                'FROM Orders o LEFT JOIN Deliveries d ON d.Order_ID = o.Order_ID ' +
                'WHERE o.Customer_ID = ? ORDER BY o.Order_Date DESC',
                [customerId]
            );
            return res.status(200).json(rows);
        }
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ error: 'Failed to fetch order history.' });
    }
});

// Admin: Dietary Preferences management
app.get('/api/preferences', async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Dietary_Preferences ORDER BY Preference_Name');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences.' });
    }
});

app.post('/api/admin/preferences', async (req, res) => {
    try {
        // Admin guard: only allow a single configured admin by email
        if (!ADMIN_EMAIL) return res.status(500).json({ error: 'Admin is not configured. Set ADMIN_EMAIL in .env.' });
        const requesterId = req.header('x-customer-id');
        if (!requesterId) return res.status(403).json({ error: 'Forbidden: missing user identity.' });
        const [users] = await db.query('SELECT Email FROM Customers WHERE Customer_ID = ?', [requesterId]);
        if (!users.length || users[0].Email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Forbidden: admin only.' });
        }

        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Preference name is required.' });
        const [result] = await db.query('INSERT INTO Dietary_Preferences (Preference_Name) VALUES (?)', [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error('Error adding preference:', error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Preference already exists.' });
        res.status(500).json({ error: 'Failed to add preference.' });
    }
});


app.get('/api/mealkits/recommendations/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const [results] = await db.query('CALL sp_RecommendMealKits(?)', [customerId]);
        res.status(200).json(results[0]);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Failed to get meal kit recommendations.' });
    }
});

app.get('/api/dashboard/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const [summaryResult, activeOrdersResult] = await Promise.all([
            db.query('SELECT * FROM vw_CustomerOrderSummary WHERE Customer_ID = ?', [customerId]),
            db.query('SELECT * FROM vw_ActiveOrders WHERE Customer_ID = ?', [customerId])
        ]);
        const summary = summaryResult[0];
        const activeOrders = activeOrdersResult[0];
        if (summary.length === 0) {
            return res.status(404).json({ error: 'Customer not found.' });
        }
        res.status(200).json({ summary: summary[0], activeOrders: activeOrders });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// Customer profile (address info for delivery link)
app.get('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT Customer_ID, Name, Email, Address, City, State, Pincode FROM Customers WHERE Customer_ID = ?', [id]);
        if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
        res.json(rows[0]);
    } catch (e) {
        console.error('Error fetching customer:', e);
        res.status(500).json({ error: 'Failed to fetch customer profile.' });
    }
});

// Browse meal kits by preference (fallback to static list if query fails)
app.get('/api/mealkits/by-preference/:preferenceId', async (req, res) => {
    const { preferenceId } = req.params;
    try {
        const [prefRows] = await db.query('SELECT Preference_Name FROM Dietary_Preferences WHERE Preference_ID = ?', [preferenceId]);
        if (!prefRows.length) return res.json([]);
        const pref = (prefRows[0].Preference_Name || '').toLowerCase();

        // Cuisine-based preferences
        const cuisineMap = ['mediterranean','italian','mexican','japanese','thai','chinese','south indian','north indian'];
        if (cuisineMap.includes(pref)) {
            const [rows] = await db.query('SELECT MealKit_ID, Name, Cuisine, Calories FROM Meal_Kits WHERE LOWER(Cuisine) LIKE ?', [`%${pref}%`]);
            return res.json(rows);
        }

        // Nutritional preferences
        if (pref.includes('keto') || pref.includes('low-carb') || pref.includes('low carb')) {
            const [rows] = await db.query('SELECT MealKit_ID, Name, Cuisine, Calories FROM Meal_Kits WHERE Calories <= 500 ORDER BY Calories');
            return res.json(rows);
        }

        // Vegetarian / Vegan preferences via ingredient exclusion
        if (pref.includes('vegan') || pref.includes('vegetarian') || pref.includes('pescatarian') || pref.includes('non-vegetarian')) {
            // Determine inclusion/exclusion terms
            const nonVegTerms = ['chicken','prawn','shrimp','fish','beef','pork','mutton','egg'];
            const dairyTerms = ['milk','cheese','butter','paneer','yogurt'];

            let where = '';
            if (pref.includes('non-vegetarian')) {
                // Include meals having any non-veg term
                where = nonVegTerms.map(t => `EXISTS(SELECT 1 FROM MealKit_Ingredients mki JOIN Ingredients i ON i.Ingredient_ID=mki.Ingredient_ID WHERE mki.MealKit_ID=mk.MealKit_ID AND LOWER(i.Name) LIKE '%${t}%')`).join(' OR ');
                const [rows] = await db.query(`SELECT mk.MealKit_ID, mk.Name, mk.Cuisine, mk.Calories FROM Meal_Kits mk WHERE ${where}`);
                return res.json(rows);
            }

            // Exclude any meals that contain non-veg ingredients; vegan also excludes dairy
            const excludes = [...nonVegTerms, ...(pref.includes('vegan') ? dairyTerms : [])];
            const conditions = excludes.map(t => `NOT EXISTS(SELECT 1 FROM MealKit_Ingredients mki JOIN Ingredients i ON i.Ingredient_ID=mki.Ingredient_ID WHERE mki.MealKit_ID=mk.MealKit_ID AND LOWER(i.Name) LIKE '%${t}%')`).join(' AND ');
            const [rows] = await db.query(`SELECT mk.MealKit_ID, mk.Name, mk.Cuisine, mk.Calories FROM Meal_Kits mk WHERE ${conditions}`);
            return res.json(rows);
        }

        // Default: return all
        const [allRows] = await db.query('SELECT MealKit_ID, Name, Cuisine, Calories FROM Meal_Kits ORDER BY Name');
        return res.json(allRows);
    } catch (e) {
        console.error('by-preference error:', e);
        res.status(500).json({ error: 'Failed to fetch meals by preference.' });
    }
});

// Admin: list recent orders (admin only)
app.get('/api/admin/orders', async (req, res) => {
    try {
        if (!ADMIN_EMAIL) return res.status(500).json({ error: 'Admin is not configured. Set ADMIN_EMAIL in .env.' });
        const requesterId = req.header('x-customer-id');
        if (!requesterId) return res.status(403).json({ error: 'Forbidden: missing user identity.' });
        const [users] = await db.query('SELECT Email FROM Customers WHERE Customer_ID = ?', [requesterId]);
        if (!users.length || users[0].Email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden: admin only.' });

        try {
            // Try a detailed view if it exists
            const [rows] = await db.query('SELECT * FROM vw_ActiveOrders ORDER BY Order_Date DESC LIMIT 50');
            return res.json(rows);
        } catch (eView) {
            // Fallback basic join
            const [rows2] = await db.query(
                'SELECT o.Order_ID, o.Customer_ID, o.Order_Date, d.Delivery_Status AS Status, c.Name, c.Address, c.City ' +
                'FROM Orders o LEFT JOIN Deliveries d ON d.Order_ID = o.Order_ID ' +
                'JOIN Customers c ON c.Customer_ID = o.Customer_ID ' +
                'ORDER BY o.Order_Date DESC LIMIT 50'
            );
            return res.json(rows2);
        }
    } catch (e) {
        console.error('Admin orders error:', e);
        res.status(500).json({ error: 'Failed to fetch admin orders.' });
    }
});

// --- Auto-create admin user if missing ---
(async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    if (!adminEmail) return console.warn('⚠️ ADMIN_EMAIL not set — skipping admin seed.');

    const [rows] = await db.query('SELECT * FROM Customers WHERE Email = ?', [adminEmail]);
    if (rows.length === 0) {
      console.log('🛠 Creating default admin user...');
      const hash = await bcrypt.hash(adminPassword, 10);
      await db.query(
        `INSERT INTO Customers (Name, Email, Username, Password_Hash, Address, City, State, Pincode) 
         VALUES (?, ?, ?, ?, 'Admin HQ', 'Chennai', 'TN', '600001')`,
        ['Administrator', adminEmail, 'admin', hash]
      );
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log(`✅ Admin user already exists (${adminEmail})`);
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
})();

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

