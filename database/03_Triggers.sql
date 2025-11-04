-- Drop ALL triggers if they already exist to prevent errors and conflicts.
DROP TRIGGER IF EXISTS trg_UpdateOrderTotal;
DROP TRIGGER IF EXISTS trg_CheckAllergies;
DROP TRIGGER IF EXISTS trg_ValidateDeliveryDate;
DROP TRIGGER IF EXISTS trg_AutoCreateDelivery;
DROP TRIGGER IF EXISTS trg_AutoCreatePayment; -- Explicitly dropping the old, conflicting trigger.

DELIMITER $$

-- =================================================================================
-- TRIGGER: trg_UpdateOrderTotal (IMPROVED)
-- DESCRIPTION: Automatically recalculates the Total_Price in the Orders table and
--              updates the corresponding payment amount whenever an item is added.
-- =================================================================================
CREATE TRIGGER trg_UpdateOrderTotal
AFTER INSERT ON Order_Items
FOR EACH ROW
BEGIN
    DECLARE v_order_id INT;
    SET v_order_id = IFNULL(NEW.Order_ID, OLD.Order_ID);
    
    UPDATE Orders
    SET Total_Price = fn_CalculateOrderTotal(v_order_id)
    WHERE Order_ID = v_order_id;
    
    UPDATE Payments
    SET Amount = fn_CalculateOrderTotal(v_order_id)
    WHERE Order_ID = v_order_id;
END$$

-- =================================================================================
-- TRIGGER: trg_CheckAllergies
-- DESCRIPTION: Prevents adding a meal kit that contains a customer's allergen.
-- =================================================================================
CREATE TRIGGER trg_CheckAllergies
BEFORE INSERT ON Order_Items
FOR EACH ROW
BEGIN
    DECLARE v_allergy_count INT;
    DECLARE v_customer_id INT;
    SELECT Customer_ID INTO v_customer_id FROM Orders WHERE Order_ID = NEW.Order_ID;

    SELECT COUNT(*)
    INTO v_allergy_count
    FROM Customer_Allergies ca
    JOIN Allergies a ON ca.Allergy_ID = a.Allergy_ID
    JOIN MealKit_Ingredients mki ON mki.MealKit_ID = NEW.MealKit_ID
    JOIN Ingredients i ON i.Ingredient_ID = mki.Ingredient_ID
    WHERE ca.Customer_ID = v_customer_id AND i.Name LIKE CONCAT('%', a.Allergy_Name, '%');

    IF v_allergy_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This meal kit contains an ingredient the customer is allergic to.';
    END IF;
END$$

-- =================================================================================
-- TRIGGER: trg_ValidateDeliveryDate
-- DESCRIPTION: Ensures the delivery date is after the order date.
-- =================================================================================
CREATE TRIGGER trg_ValidateDeliveryDate
BEFORE INSERT ON Orders
FOR EACH ROW
BEGIN
    IF NEW.Delivery_Date <= NEW.Order_Date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Delivery date must be after the order date.';
    END IF;
END$$

-- =================================================================================
-- TRIGGER: trg_AutoCreateDelivery
-- DESCRIPTION: Automatically creates a delivery record when a new order is placed.
-- =================================================================================
CREATE TRIGGER trg_AutoCreateDelivery
AFTER INSERT ON Orders
FOR EACH ROW
BEGIN
    INSERT INTO Deliveries (Order_ID, Delivery_Status, Delivery_Partner)
    VALUES (NEW.Order_ID, 'Pending', 'TBD');
END$$

DELIMITER ;

