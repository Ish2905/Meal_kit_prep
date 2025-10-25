-- 08_AllergySeeds.sql
-- Adds more common allergies; safe to run multiple times using INSERT IGNORE

INSERT IGNORE INTO Allergies (Allergy_Name)
VALUES
  ('Shellfish'),
  ('Soy'),
  ('Sesame'),
  ('Mustard'),
  ('Sulfites'),
  ('Celery'),
  ('Lupin');
