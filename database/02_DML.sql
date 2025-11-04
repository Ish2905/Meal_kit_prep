-- Use the correct database
USE meal_kit;

-- Insert data into Plans
INSERT INTO Plans (Plan_ID, Plan_Name, Price) VALUES
(1, 'Weekly Solo', 59.99),
(2, 'Weekly Couple', 99.99),
(3, 'Family Feast (4 people)', 179.99);

-- Insert data into Allergies
INSERT INTO Allergies (Allergy_ID, Allergy_Name) VALUES
(1, 'Peanuts'),
(2, 'Dairy'),
(3, 'Gluten'),
(4, 'Shellfish'),
(5,'Shellfish'),
(6,'Soy'),
(7,'Sesame'),
(8,'Mustard'),
(9,'Sulfites'),
(10,'Celery'),
(11,'Lupin');

-- Insert data into Dietary_Preferences
INSERT INTO Dietary_Preferences (Preference_ID, Preference_Name) VALUES
(1, 'Vegetarian'),
(2, 'Vegan'),
(3, 'Low-Carb'),
(4, 'Pescatarian'),
(5,'Non-Vegetarian'),
(6,'Keto'), 
(7,'Mediterranean'), 
(8,'South Indian'), 
(9,'Mexican');


-- Insert data into Ingredients
INSERT INTO Ingredients (Ingredient_ID, Name, Unit) VALUES
(1, 'Chicken Breast', 'grams'),
(2, 'Brown Rice', 'grams'),
(3, 'Broccoli', 'grams'),
(4, 'Teriyaki Sauce', 'ml'),
(5, 'Lentils', 'grams'),
(6, 'Vegetable Broth', 'ml'),
(7, 'Onion', 'pcs'),
(8, 'Carrot', 'pcs'),
(9, 'Quinoa', 'grams'),
(10, 'Cucumber', 'pcs'),
(11, 'Cherry Tomatoes', 'grams'),
(12, 'Lemon Vinaigrette', 'ml');

-- Insert data into Customers
INSERT INTO Customers (Customer_ID, Name, Email, Phone, Address, City, State, Pincode) VALUES
(101, 'Alice Johnson', 'alice.j@email.com', '9876543210', '123 Oak Avenue', 'Bengaluru', 'Karnataka', '560001'),
(102, 'Bob Williams', 'bob.w@email.com', '8765432109', '456 Pine Street', 'Bengaluru', 'Karnataka', '560002'),
(103, 'Charlie Brown', 'charlie.b@email.com', '7654321098', '789 Maple Drive', 'Mysuru', 'Karnataka', '570001');

-- Insert data into Meal_Kits
INSERT INTO Meal_Kits (MealKit_ID, Name, Cuisine, Calories, Price) VALUES
(1, 'Classic Teriyaki Chicken Bowl', 'Japanese', 550, 15.00),
(2, 'Hearty Vegan Lentil Soup', 'International', 400, 12.50),
(3, 'Fresh Quinoa Salad', 'Mediterranean', 350, 11.00),
(4,'Grilled Chicken Bowl', 'Non-Vegetarian', 620, 13.50),
(5,'Paneer Tikka Bowl', 'Vegetarian', 520, 12.00),
(6,'Keto Zoodles Alfredo', 'Keto', 450, 14.00),
(7,'Mediterranean Couscous', 'Mediterranean', 480, 12.50),
(8,'South Indian Lemon Rice', 'South Indian', 510, 11.50),
(9,'Mexican Burrito Bowl', 'Mexican', 610, 13.00),
(10,'Italian Pesto Quinoa', 'Italian', 530, 12.50);

-- Insert data into MealKit_Ingredients
INSERT INTO MealKit_Ingredients (MealKit_ID, Ingredient_ID) VALUES
-- Teriyaki Chicken Bowl Ingredients
(1, 1), (1, 2), (1, 3), (1, 4),
-- Lentil Soup Ingredients
(2, 5), (2, 6), (2, 7), (2, 8),
-- Quinoa Salad Ingredients
(3, 9), (3, 10), (3, 11), (3, 12);

-- Assign customer allergies and preferences
INSERT INTO Customer_Allergies (Customer_ID, Allergy_ID) VALUES (101, 1); -- Alice has a peanut allergy
INSERT INTO Customer_Allergies (Customer_ID, Allergy_ID) VALUES (102, 2); -- Bob has a dairy allergy
INSERT INTO Customer_Preferences (Customer_ID, Preference_ID) VALUES (102, 1); -- Bob is vegetarian

-- Insert data into Orders
INSERT INTO Orders (Order_ID, Customer_ID, Plan_ID, Order_Date, Delivery_Date, Total_Price) VALUES
(1001, 101, 1, '2025-10-20', '2025-10-22', 26.00),
(1002, 102, 2, '2025-10-21', '2025-10-23', 23.50);

-- Insert data into Order_Items
INSERT INTO Order_Items (Order_ID, MealKit_ID, Quantity) VALUES
(1001, 1, 1),
(1001, 3, 1),
(1002, 2, 1),
(1002, 3, 1);

-- Insert data into Payments
INSERT INTO Payments (Order_ID, Payment_Method, Payment_Date, Amount) VALUES
(1001, 'Credit Card', '2025-10-20 10:00:00', 26.00),
(1002, 'UPI', '2025-10-21 11:30:00', 23.50);

-- Insert data into Deliveries
INSERT INTO Deliveries (Order_ID, Delivery_Status, Delivery_Partner) VALUES
(1001, 'Shipped', 'Express Delivery Co.'),
(1002, 'Pending', 'Local Logistics');

INSERT IGNORE INTO MealKit_Ingredients (MealKit_ID, Ingredient_ID)
SELECT mk.MealKit_ID, i.Ingredient_ID
FROM Meal_Kits mk CROSS JOIN Ingredients i
WHERE mk.Name IN ('Grilled Chicken Bowl') AND i.Name='Chicken Breast';

-- Vegetarian meals use quinoa/tomatoes/cucumber when available
INSERT IGNORE INTO MealKit_Ingredients (MealKit_ID, Ingredient_ID)
SELECT mk.MealKit_ID, i.Ingredient_ID
FROM Meal_Kits mk CROSS JOIN Ingredients i
WHERE mk.Name IN ('Paneer Tikka Bowl','Mediterranean Couscous','Italian Pesto Quinoa') AND i.Name IN ('Quinoa','Cherry Tomatoes','Cucumber');
