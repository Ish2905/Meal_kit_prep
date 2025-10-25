-- 10_OrderDateTime.sql
-- Make Orders use real timestamps and update the place-order procedure accordingly

USE meal_kit;

-- 1) Change Orders dates to DATETIME for accurate time display
ALTER TABLE Orders
  MODIFY Order_Date DATETIME NOT NULL,
  MODIFY Delivery_Date DATETIME NULL;

-- 2) Recreate sp_PlaceOrder to use NOW() (DATETIME)
DROP PROCEDURE IF EXISTS sp_PlaceOrder;
DELIMITER $$
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
    VALUES (p_Customer_ID, p_Plan_ID, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 0.00);
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
