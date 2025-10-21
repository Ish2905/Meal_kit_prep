-- Drop procedures if they exist to allow for clean re-creation.
DROP PROCEDURE IF EXISTS sp_PlaceOrder;
DROP PROCEDURE IF EXISTS sp_RecommendMealKits;
DROP PROCEDURE IF EXISTS sp_RegisterCustomer;

DELIMITER $$

-- =================================================================================
-- PROCEDURE: sp_RegisterCustomer
-- DESCRIPTION: Registers a new customer and associates their preferences within a
--              single, safe transaction.
-- =================================================================================
CREATE PROCEDURE sp_RegisterCustomer(
    IN p_Name VARCHAR(255),
    IN p_Email VARCHAR(255),
    IN p_Phone VARCHAR(20),
    IN p_Address VARCHAR(255),
    IN p_City VARCHAR(100),
    IN p_State VARCHAR(100),
    IN p_Pincode VARCHAR(10),
    IN p_Allergy_IDs VARCHAR(255),
    IN p_Preference_IDs VARCHAR(255)
)
BEGIN
    DECLARE v_New_Customer_ID INT;
    DECLARE v_substring VARCHAR(255);
    DECLARE v_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO Customers (Name, Email, Phone, Address, City, State, Pincode)
    VALUES (p_Name, p_Email, p_Phone, p_Address, p_City, p_State, p_Pincode);
    SET v_New_Customer_ID = LAST_INSERT_ID();

    IF p_Allergy_IDs IS NOT NULL AND p_Allergy_IDs != '' THEN
        SET v_substring = p_Allergy_IDs;
        WHILE LENGTH(v_substring) > 0 DO
            SET v_id = SUBSTRING_INDEX(v_substring, ',', 1);
            INSERT INTO Customer_Allergies (Customer_ID, Allergy_ID) VALUES (v_New_Customer_ID, v_id);
            IF LOCATE(',', v_substring) > 0 THEN
                SET v_substring = SUBSTRING(v_substring, LOCATE(',', v_substring) + 1);
            ELSE
                SET v_substring = '';
            END IF;
        END WHILE;
    END IF;

    IF p_Preference_IDs IS NOT NULL AND p_Preference_IDs != '' THEN
        SET v_substring = p_Preference_IDs;
        WHILE LENGTH(v_substring) > 0 DO
            SET v_id = SUBSTRING_INDEX(v_substring, ',', 1);
            INSERT INTO Customer_Preferences (Customer_ID, Preference_ID) VALUES (v_New_Customer_ID, v_id);
            IF LOCATE(',', v_substring) > 0 THEN
                SET v_substring = SUBSTRING(v_substring, LOCATE(',', v_substring) + 1);
            ELSE
                SET v_substring = '';
            END IF;
        END WHILE;
    END IF;

    COMMIT;
    SELECT v_New_Customer_ID AS CustomerID;
END$$

-- =================================================================================
-- PROCEDURE: sp_RecommendMealKits
-- DESCRIPTION: Recommends meal kits based on a customer's allergies.
-- =================================================================================
CREATE PROCEDURE sp_RecommendMealKits(IN p_Customer_ID INT)
BEGIN
    SELECT
        mk.MealKit_ID,
        mk.Name,
        mk.Cuisine,
        mk.Calories,
        mk.Price
    FROM Meal_Kits mk
    WHERE mk.MealKit_ID NOT IN (
        SELECT DISTINCT mki.MealKit_ID
        FROM MealKit_Ingredients mki
        JOIN Ingredients i ON mki.Ingredient_ID = i.Ingredient_ID
        JOIN Customer_Allergies ca ON ca.Customer_ID = p_Customer_ID
        JOIN Allergies a ON a.Allergy_ID = ca.Allergy_ID
        WHERE i.Name LIKE CONCAT('%', a.Allergy_Name, '%')
    );
END$$

-- =================================================================================
-- PROCEDURE: sp_PlaceOrder (FINAL VERSION)
-- DESCRIPTION: Handles the entire order process within a single, safe transaction,
--              calculating the price *before* creating the payment.
-- =================================================================================
CREATE PROCEDURE sp_PlaceOrder(
    IN p_Customer_ID INT,
    IN p_Plan_ID INT,
    IN p_MealKit_IDs VARCHAR(255),
    IN p_Payment_Method VARCHAR(50)
)
BEGIN
    DECLARE v_New_Order_ID INT;
    DECLARE v_Total_Price DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_substring VARCHAR(255);
    DECLARE v_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO Orders (Customer_ID, Plan_ID, Order_Date, Delivery_Date, Total_Price)
    VALUES (p_Customer_ID, p_Plan_ID, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 0.00);
    SET v_New_Order_ID = LAST_INSERT_ID();

    SET v_substring = p_MealKit_IDs;
    WHILE LENGTH(v_substring) > 0 DO
        SET v_id = SUBSTRING_INDEX(v_substring, ',', 1);
        INSERT INTO Order_Items (Order_ID, MealKit_ID, Quantity) VALUES (v_New_Order_ID, v_id, 1);
        IF LOCATE(',', v_substring) > 0 THEN
            SET v_substring = SUBSTRING(v_substring, LOCATE(',', v_substring) + 1);
        ELSE
            SET v_substring = '';
        END IF;
    END WHILE;

    SET v_Total_Price = fn_CalculateOrderTotal(v_New_Order_ID);
    UPDATE Orders SET Total_Price = v_Total_Price WHERE Order_ID = v_New_Order_ID;

    INSERT INTO Payments (Order_ID, Payment_Method, Payment_Date, Amount)
    VALUES (v_New_Order_ID, p_Payment_Method, NOW(), v_Total_Price);

    COMMIT;
    SELECT v_New_Order_ID AS NewOrderID;
END$$

DELIMITER ;

