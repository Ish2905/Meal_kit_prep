-- This script creates all the necessary tables, views, and constraints.

-- Create the Customer table
CREATE TABLE Customers (
    Customer_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Address VARCHAR(255),
    City VARCHAR(100),
    State VARCHAR(100),
    Pincode VARCHAR(10)
);

-- Create the Allergy table
CREATE TABLE Allergies (
    Allergy_ID INT PRIMARY KEY AUTO_INCREMENT,
    Allergy_Name VARCHAR(100) NOT NULL UNIQUE
);

-- Create a junction table for Customer_Allergies
CREATE TABLE Customer_Allergies (
    Customer_ID INT,
    Allergy_ID INT,
    PRIMARY KEY (Customer_ID, Allergy_ID),
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE,
    FOREIGN KEY (Allergy_ID) REFERENCES Allergies(Allergy_ID) ON DELETE CASCADE
);

-- Create the Dietary_Preference table
CREATE TABLE Dietary_Preferences (
    Preference_ID INT PRIMARY KEY AUTO_INCREMENT,
    Preference_Name VARCHAR(100) NOT NULL UNIQUE
);

-- Create a junction table for Customer_Preferences
CREATE TABLE Customer_Preferences (
    Customer_ID INT,
    Preference_ID INT,
    PRIMARY KEY (Customer_ID, Preference_ID),
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE CASCADE,
    FOREIGN KEY (Preference_ID) REFERENCES Dietary_Preferences(Preference_ID) ON DELETE CASCADE
);

-- Create the Plan table
CREATE TABLE Plans (
    Plan_ID INT PRIMARY KEY AUTO_INCREMENT,
    Plan_Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL
);

-- Create the Ingredient table
CREATE TABLE Ingredients (
    Ingredient_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    Unit VARCHAR(50)
);

-- Create the Meal_Kit table
CREATE TABLE Meal_Kits (
    MealKit_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    Cuisine VARCHAR(100),
    Calories INT,
    Price DECIMAL(10, 2) NOT NULL
);

-- Create a junction table for MealKit_Ingredients
CREATE TABLE MealKit_Ingredients (
    MealKit_ID INT,
    Ingredient_ID INT,
    PRIMARY KEY (MealKit_ID, Ingredient_ID),
    FOREIGN KEY (MealKit_ID) REFERENCES Meal_Kits(MealKit_ID) ON DELETE CASCADE,
    FOREIGN KEY (Ingredient_ID) REFERENCES Ingredients(Ingredient_ID) ON DELETE CASCADE
);

-- Create the Orders table
CREATE TABLE Orders (
    Order_ID INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID INT,
    Plan_ID INT,
    Order_Date DATE NOT NULL,
    Delivery_Date DATE,
    Total_Price DECIMAL(10, 2),
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID) ON DELETE SET NULL,
    FOREIGN KEY (Plan_ID) REFERENCES Plans(Plan_ID) ON DELETE SET NULL
);

-- Create a junction table for Order_Items
CREATE TABLE Order_Items (
    Order_ID INT,
    MealKit_ID INT,
    Quantity INT DEFAULT 1,
    PRIMARY KEY (Order_ID, MealKit_ID),
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (MealKit_ID) REFERENCES Meal_Kits(MealKit_ID) ON DELETE RESTRICT
);

-- Create the Payment table
CREATE TABLE Payments (
    Payment_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT NOT NULL UNIQUE,
    Payment_Method VARCHAR(50),
    Payment_Date DATETIME NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE
);

-- Create the Delivery table
CREATE TABLE Deliveries (
    Delivery_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT NOT NULL UNIQUE,
    Delivery_Status VARCHAR(50),
    Delivery_Partner VARCHAR(100),
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE
);

-- Create the Audit table for the trigger
CREATE TABLE Customer_Audit (
    Audit_ID INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID INT,
    Old_Phone VARCHAR(20),
    New_Phone VARCHAR(20),
    Old_Address VARCHAR(255),
    New_Address VARCHAR(255),
    Change_Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    Action_User VARCHAR(100)
);
