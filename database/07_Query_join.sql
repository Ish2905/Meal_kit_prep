-- This query joins multiple tables to get a detailed list of all active orders.
-- This logic is used by the vw_ActiveOrders view and the admin dashboard.

SELECT
    o.Order_ID,
    c.Name AS Customer_Name,
    c.Address,
    p.Plan_Name,
    o.Order_Date,
    d.Delivery_Status
FROM
    Orders o
JOIN
    Customers c ON o.Customer_ID = c.Customer_ID
JOIN
    Plans p ON o.Plan_ID = p.Plan_ID
JOIN
    Deliveries d ON o.Order_ID = d.Order_ID
WHERE
    d.Delivery_Status IN ('Pending', 'Shipped');