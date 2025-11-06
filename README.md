# 🚀 Node + Express + PostgreSQL Server

A backend server built using **Node.js**, **Express**, and **PostgreSQL** (v16).  
This project provides a simple REST API with database integration and seeding for development.

---

## 🧰 Requirements

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or above recommended)
- [PostgreSQL 16](https://www.postgresql.org/download/)

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>


### 2️⃣ Install Dependencies
npm install

### 🗄️ Database Setup
3️⃣ Start PostgreSQL Service

Make sure PostgreSQL is running locally.
You can start it manually or use:

macOS

brew services start postgresql@16



### 4️⃣ Configure Database


Create a .env file in the project root with your database credentials:

PORT=5000
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/myapp_db

### 5️⃣ Run Database Setup

Run the setup script to initialize your database schema:

npm run setup-db

### 6️⃣ Seed the Database

Populate your database with sample data:

npm run seed

### 🏃 Start the Server

Once everything is ready, start the server:

npm start


Server will run by default on http://localhost:5000
.

### 🧪 Scripts Summary
Command	Description
npm install	Install all dependencies
npm run setup-db	Initialize database tables
npm run seed	Insert sample data
npm start	Start the Express server



### 🧩 Tech Stack

Node.js – Server-side runtime

Express.js – Web framework for Node.js

PostgreSQL 16 – Relational database

pg / Sequelize / Knex (optional) – PostgreSQL ORM/Query builder

🧑‍💻 Author

Developed by Hadia Shafqat
