-- This query uses a nested query (a subquery with NOT IN) to find all
-- meal kits that are "safe" for a specific customer (e.g., ID 101)
-- by filtering out any meal kits containing their known allergens.
-- This logic is used in the sp_RecommendMealKits procedure.

SELECT
    mk.Name,
    mk.Cuisine,
    mk.Price
FROM
    Meal_Kits mk
WHERE
    mk.MealKit_ID NOT IN (
        -- Nested Subquery starts here
        SELECT DISTINCT mki.MealKit_Entry
        FROM MealKit_Ingredients mki
        JOIN Ingredients i ON mki.Ingredient_ID = i.Ingredient_ID
        JOIN Customer_Allergies ca ON ca.Customer_ID = 101 -- Using 101 as an example customer
        JOIN Allergies a ON a.Allergy_ID = ca.Allergy_ID
        WHERE i.Name LIKE CONCAT('%', a.Allergy_Name, '%')
        -- Nested Subquery ends here
    );