-- Drop the function if it already exists to avoid errors on script re-run
DROP FUNCTION IF EXISTS fn_CalculateOrderTotal;
DROP FUNCTION IF EXISTS fn_GetCustomerLifetimeValue;

DELIMITER $$

-- =================================================================================
-- FUNCTION: fn_CalculateOrderTotal
-- DESCRIPTION: Calculates the total price of a given order by summing the prices
--              of all meal kits multiplied by their quantities.
-- PARAMETERS: p_Order_ID (INT) - The ID of the order to calculate.
-- RETURNS: DECIMAL(10, 2) - The calculated total price for the order.
-- =================================================================================
CREATE FUNCTION fn_CalculateOrderTotal(p_Order_ID INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE v_total DECIMAL(10, 2);

    SELECT SUM(mk.Price * oi.Quantity)
    INTO v_total
    FROM Order_Items oi
    JOIN Meal_Kits mk ON oi.MealKit_ID = mk.MealKit_ID
    WHERE oi.Order_ID = p_Order_ID;

    RETURN IFNULL(v_total, 0.00);
END$$

-- =================================================================================
-- FUNCTION: fn_GetCustomerLifetimeValue
-- DESCRIPTION: Calculates the total amount of money a customer has spent on all
--              their completed (paid) orders.
-- PARAMETERS: p_Customer_ID (INT) - The ID of the customer.
-- RETURNS: DECIMAL(10, 2) - The total amount spent by the customer.
-- =================================================================================
CREATE FUNCTION fn_GetCustomerLifetimeValue(p_Customer_ID INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE v_lifetime_value DECIMAL(10, 2);

    SELECT SUM(p.Amount)
    INTO v_lifetime_value
    FROM Payments p
    JOIN Orders o ON p.Order_ID = o.Order_ID
    WHERE o.Customer_ID = p_Customer_ID;

    RETURN IFNULL(v_lifetime_value, 0.00);
END$$

DELIMITER ;
