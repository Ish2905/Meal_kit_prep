// src/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

app.get('/', (req, res) => res.send('Meal Kit Backend Server is running!'));

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode, allergy_ids, preference_ids } = req.body;
    if (!name || !email || !address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const [results] = await db.query('CALL sp_RegisterCustomer(?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, email, phone, address, city, state, pincode, allergy_ids || '', preference_ids || '']);
    const newCustomerId = results[0][0].CustomerID;
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
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }
        
        // Find the customer by their email
        const [users] = await db.query('SELECT Customer_ID, Name FROM Customers WHERE Email = ?', [email]);
        
        if (users.length === 0) {
            // No user found with that email
            return res.status(404).json({ error: 'No account found with that email address.' });
        }
        
        // User found. Return their details to log them in.
        const user = users[0];
        res.status(200).json({
            message: 'Login successful!',
            customerId: user.Customer_ID,
            name: user.Name
        });
        
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

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

