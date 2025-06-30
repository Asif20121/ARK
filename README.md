# ARK
To run this code locally, follow these steps:

Prerequisites
Make sure you have Node.js installed on your computer (version 14 or higher).

Installation & Setup
Install dependencies:


npm install
Start the development server:


npm run dev
This single command will:

Start the backend API server on port 3001
Start the frontend development server on port 5173
Both servers will run concurrently
What happens when you run npm run dev:
Backend Server: Runs on http://localhost:3001

Creates a SQLite database (costing.db) automatically
Sets up all the required tables with default data
Provides API endpoints for authentication and data management
Frontend Server: Runs on http://localhost:5173

Serves the React application
Connects to the backend API automatically
Default Login Credentials:
Username: admin
Password: admin123
Project Structure:
api/server.js - Backend Express server with SQLite database
src/ - Frontend React application
package.json - Contains the dev script that runs both servers
Troubleshooting:
If you encounter any issues:

Make sure no other applications are using ports 3001 or 5173
Delete node_modules and package-lock.json, then run npm install again
Check that you have the latest version of Node.js installed
The application will automatically open in your browser once both servers are running successfully.
