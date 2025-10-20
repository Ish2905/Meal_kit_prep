// A simple Express.js server to connect to the MySQL database
// and expose API endpoints for the frontend.

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION CONFIGURATION ---
// IMPORTANT: Replace these values with your actual MySQL credentials.
const dbConfig = {
    host: 'localhost',
    user: 'your_mysql_user',     // e.g., 'root'
    password: 'your_mysql_password', // e.g., 'password'
    database: 'meal_kit'
};

// --- API ENDPOINTS ---

// GET all customers (READ)
app.get('/api/customers', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT Customer_ID as id, Name as name, Email as email, Phone as phone FROM Customers');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all meal kits (READ)
app.get('/api/mealkits', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT MealKit_ID as id, Name as name, Cuisine as cuisine, Calories as calories, Price as price FROM Meal_Kits');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// POST a new customer (CREATE)
app.post('/api/customers', async (req, res) => {
    const { name, email, phone } = req.body;
    const sql = 'INSERT INTO Customers (Name, Email, Phone) VALUES (?, ?, ?)';
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(sql, [name, email, phone]);
        await connection.end();
        res.status(201).json({ id: result.insertId, name, email, phone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE a customer
app.delete('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Customers WHERE Customer_ID = ?';
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(sql, [id]);
        await connection.end();
        res.status(204).send(); // No content to send back
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- COMPLEX QUERY ENDPOINTS ---

// GET customer order history (Stored Procedure)
app.get('/api/reports/customer-history/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'CALL GetCustomerOrderHistory(?)';
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute(sql, [id]);
        await connection.end();
        res.json(results[0]); // The result of a stored procedure is nested in an array
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT to update a customer and test the trigger
app.put('/api/customers/test-trigger/:id', async (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;
    const sql = 'UPDATE Customers SET Phone = ? WHERE Customer_ID = ?';
     try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(sql, [phone, id]);
        // Also, fetch the latest audit log to show the trigger worked
        const [auditLog] = await connection.execute('SELECT * FROM Customer_Audit ORDER BY Audit_ID DESC LIMIT 1');
        await connection.end();
        res.json({ message: 'Customer updated, trigger fired.', auditLog: auditLog[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET revenue by plan (Aggregate Query)
app.get('/api/reports/revenue-by-plan', async (req, res) => {
    const sql = `
        SELECT p.Plan_Name as planName, COUNT(o.Order_ID) AS orderCount, SUM(o.Total_Price) AS totalRevenue
        FROM Plans p
        LEFT JOIN Orders o ON p.Plan_ID = o.Plan_ID
        GROUP BY p.Plan_Name
        ORDER BY totalRevenue DESC
    `;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(sql);
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

