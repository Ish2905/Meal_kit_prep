Meal-Kit Delivery Database Application

This is a full-stack web application for managing a meal-kit delivery service, built for the DBMS Mini-Project. It features a complete three-tier architecture with a frontend, a backend API server, and a MySQL database.

Project Structure

/frontend/: Contains the user interface (HTML, CSS, JS).

/backend/: Contains the Node.js/Express API server that interacts with the database.

/database/: Contains all the SQL scripts for schema creation, data population, and advanced logic.

Prerequisites

Node.js and npm: Download here

MySQL Server and MySQL Workbench (or any SQL client): Download here

Step-by-Step Setup and Execution Guide

Step 1: Set Up the Database

Open your MySQL client (e.g., MySQL Workbench).

Create the database:

CREATE DATABASE meal_kit;


Select the database:

USE meal_kit;


Run the SQL scripts from the /database/ folder in the following order:

Execute the entire 01_schema.sql file to create all the tables.

Execute the entire 02_data.sql file to populate the tables with sample data.

Execute the entire 03_logic.sql file to create the stored procedures and triggers.

Step 2: Configure and Run the Backend Server

Navigate to the backend folder in your terminal:

cd backend


Install the necessary dependencies:

npm install


IMPORTANT: Configure the database connection. Open the backend/server.js file in a text editor. Find the dbConfig object (around line 18) and replace the placeholder credentials with your actual MySQL username and password.

const dbConfig = {
    host: 'localhost',
    user: 'your_mysql_user',     // <-- CHANGE THIS
    password: 'your_mysql_password', // <-- CHANGE THIS
    database: 'meal_kit'
};


Start the backend server:

npm start


If successful, you will see the message: Server running at http://localhost:3000. Keep this terminal window open.

Step 3: Launch the Frontend Application

Navigate to the /frontend/ folder in your file explorer.

Open the index.html file directly in your web browser (e.g., Google Chrome, Firefox).

You should now see the fully interactive web application, which communicates with your running backend server and manipulates the data in your MySQL database.