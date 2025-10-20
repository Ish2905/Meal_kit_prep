-- This script creates stored procedures and triggers.

-- Stored Procedure to get a customer's full order history
DELIMITER $$
CREATE PROCEDURE GetCustomerOrderHistory(IN input_customer_id INT)
BEGIN
    SELECT
        o.Order_ID,
        o.Order_Date,
        mk.Name AS Meal_Kit_Item,
        oi.Quantity,
        p.Amount,
        p.Payment_Method
    FROM Orders AS o
    JOIN Customers AS c ON o.Customer_ID = c.Customer_ID
    JOIN Order_Items AS oi ON o.Order_ID = oi.Order_ID
    JOIN Meal_Kits AS mk ON oi.MealKit_ID = mk.MealKit_ID
    JOIN Payments AS p ON o.Order_ID = p.Order_ID
    WHERE o.Customer_ID = input_customer_id
    ORDER BY o.Order_Date DESC;
END$$
DELIMITER ;


-- Trigger to audit changes to a customer's contact info
DELIMITER $$
CREATE TRIGGER before_customer_update
BEFORE UPDATE ON Customers
FOR EACH ROW
BEGIN
    IF OLD.Phone <> NEW.Phone OR OLD.Address <> NEW.Address THEN
        INSERT INTO Customer_Audit (Customer_ID, Old_Phone, New_Phone, Old_Address, New_Address, Action_User)
        VALUES (OLD.Customer_ID, OLD.Phone, NEW.Phone, OLD.Address, NEW.Address, USER());
    END IF;
END$$
DELIMITER ;
