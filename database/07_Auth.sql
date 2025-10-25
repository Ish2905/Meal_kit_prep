-- 07_Auth.sql
-- Adds username/password columns for simple credentials on Customers

ALTER TABLE Customers
  ADD COLUMN Username VARCHAR(50) UNIQUE,
  ADD COLUMN Password_Hash VARCHAR(255);

-- Optional: seed some common dietary preferences (if not already present)
INSERT IGNORE INTO Dietary_Preferences (Preference_Name)
VALUES ('Non-Vegetarian'), ('Keto'), ('Mediterranean'), ('South Indian'), ('Mexican');
