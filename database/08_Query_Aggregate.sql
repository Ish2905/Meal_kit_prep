-- This query uses an aggregate function (COUNT) and GROUP BY to find the
-- total number of orders placed by each customer.
-- This logic is part of the vw_CustomerOrderSummary view.

SELECT
    c.Name AS Customer_Name,
    c.Email,
    COUNT(o.Order_ID) AS TotalOrders
FROM
    Customers c
LEFT JOIN
    Orders o ON c.Customer_ID = o.Customer_ID
GROUP BY
    c.Customer_ID, c.Name, c.Email
ORDER BY
    TotalOrders DESC;