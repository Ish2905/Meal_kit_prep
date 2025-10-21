-- Drop views if they exist to allow for re-creation
DROP VIEW IF EXISTS vw_CustomerOrderSummary;
DROP VIEW IF EXISTS vw_ActiveOrders;


-- =================================================================================
-- VIEW: vw_CustomerOrderSummary
-- DESCRIPTION: Provides a summarized view of each customer, including their contact
--              details, total number of orders, and their calculated lifetime value.
-- =================================================================================
CREATE OR REPLACE VIEW vw_CustomerOrderSummary AS
SELECT
    c.Customer_ID,
    c.Name AS Customer_Name,
    c.Email,
    c.Phone,
    COUNT(o.Order_ID) AS TotalOrders,
    fn_GetCustomerLifetimeValue(c.Customer_ID) AS LifetimeValue
FROM
    Customers c
LEFT JOIN
    Orders o ON c.Customer_ID = o.Customer_ID
GROUP BY
    c.Customer_ID, c.Name, c.Email, c.Phone;


-- =================================================================================
-- VIEW: vw_ActiveOrders (Corrected Version)
-- DESCRIPTION: A view to show all orders that are not yet delivered ('Pending' or
--              'Shipped'). This version now correctly includes the Customer_ID.
-- =================================================================================
CREATE OR REPLACE VIEW vw_ActiveOrders AS
SELECT
    o.Order_ID,
    o.Customer_ID, -- <-- THE FIX IS HERE
    c.Name AS Customer_Name,
    c.Address,
    c.City,
    p.Plan_Name,
    o.Order_Date,
    o.Delivery_Date,
    o.Total_Price,
    pm.Payment_Method,
    d.Delivery_Status,
    d.Delivery_Partner
FROM
    Orders o
JOIN
    Customers c ON o.Customer_ID = c.Customer_ID
JOIN
    Plans p ON o.Plan_ID = p.Plan_ID
JOIN
    Deliveries d ON o.Order_ID = d.Order_ID
JOIN
    Payments pm ON o.Order_ID = pm.Order_ID
WHERE
    d.Delivery_Status IN ('Pending', 'Shipped');
