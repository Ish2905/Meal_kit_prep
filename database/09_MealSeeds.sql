-- 09_MealSeeds.sql
-- Adds more meal kits across cuisines; minimal ingredients wiring to support veg/non-veg filtering

-- New Meal Kits
INSERT INTO Meal_Kits (Name, Cuisine, Calories, Price) VALUES
 ('Grilled Chicken Bowl', 'Non-Vegetarian', 620, 13.50),
 ('Paneer Tikka Bowl', 'Vegetarian', 520, 12.00),
 ('Keto Zoodles Alfredo', 'Keto', 450, 14.00),
 ('Mediterranean Couscous', 'Mediterranean', 480, 12.50),
 ('South Indian Lemon Rice', 'South Indian', 510, 11.50),
 ('Mexican Burrito Bowl', 'Mexican', 610, 13.00),
 ('Italian Pesto Quinoa', 'Italian', 530, 12.50);

-- Basic ingredient wiring for veg/non-veg detection using existing ingredients
-- Find IDs for convenience (safe if names exist); otherwise these inserts will still succeed without mapping
-- Chicken for non-veg meals
INSERT INTO MealKit_Ingredients (MealKit_ID, Ingredient_ID)
SELECT mk.MealKit_ID, i.Ingredient_ID
FROM Meal_Kits mk CROSS JOIN Ingredients i
WHERE mk.Name IN ('Grilled Chicken Bowl') AND i.Name='Chicken Breast'
ON DUPLICATE KEY UPDATE Ingredient_ID=Ingredient_ID;

-- Vegetarian meals use quinoa/tomatoes/cucumber when available
INSERT INTO MealKit_Ingredients (MealKit_ID, Ingredient_ID)
SELECT mk.MealKit_ID, i.Ingredient_ID
FROM Meal_Kits mk CROSS JOIN Ingredients i
WHERE mk.Name IN ('Paneer Tikka Bowl','Mediterranean Couscous','Italian Pesto Quinoa') AND i.Name IN ('Quinoa','Cherry Tomatoes','Cucumber')
ON DUPLICATE KEY UPDATE Ingredient_ID=Ingredient_ID;
