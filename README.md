# Ticket Website Capstone Project

A full-stack ticket aggregation website designed to help users find the best ticket prices across multiple ticketing platforms. The application separates data collection (scraping), backend API services, and a React frontend for a clean, maintainable architecture.

---

## Project Overview

Finding the best ticket prices often requires checking multiple ticket websites individually. This project addresses that problem by aggregating ticket data into a single platform, allowing users to browse games by date, filter tickets by price and source, and view detailed ticket listings for each game.

---

## Tech Stack

**Frontend**
- React
- React Router
- CSS

**Backend**
- Node.js
- Express
- SQLite (local database)

**Other**
- REST API architecture
- Client–server separation

---

## Repository Structure

ticketwebsite/
├── ticket-website/
│ ├── backend/
│ │ ├── server.js # Express server (API)
│ │ └── tickets.db # SQLite database
│ └── frontend/
│ ├── src/ # React source code
│ └── package.json
├── README.md
└── package.json


---

## How the Application Works

1. The **backend server** exposes API endpoints (e.g. `/ticketsfb`, `/ticketsbsb`) that read ticket data from a SQLite database.
2. The **frontend React app** fetches ticket data from the backend and renders:
   - A list of games by date
   - Detailed ticket listings per game
   - Filters for price, ticket source, and seating section


---

## Running the Application (Required)

**The frontend and backend must be run in separate terminals.**  
If the backend is not running, tickets will not load.

---

## 1st Start the Backend Server

Open a terminal and run:

(```bash)
cd ticket-website/backend
node server.js

You should see output similar to:
http://localhost:5000

## 2️nd Start the Frontend React App

Open a second terminal and run:

cd ticket-website/frontend
npm start

The React app will open at:

http://localhost:3000

## 3️rd View the Website

Once both servers are running, open your browser and navigate to:

http://localhost:3000

You should now be able to:

View games by date

Click into individual games

Browse and filter ticket listings

## API Endpoints (Backend)

Examples of endpoints used by the frontend:
- GET /ticketsfb — football tickets
- GET /ticketsbsb — baseball tickets
These endpoints return JSON data consumed by the React frontend.

## Key Features
- Group games by date
- Hide or show past games
- Filter tickets by:
    - Price range
    - Ticket source
    - Seating section
- Sort tickets by price, section, or row
- Responsive UI with team logos and stadium images

## Notes for Reviewers
- This project is designed to run locally
- The SQLite database is included for ease of testing
- API calls assume the backend is running on port 5000
- The frontend assumes the backend is available at localhost

## Future Improvements
- Deploy backend and frontend to a cloud provider
- Add user authentication
- Improve scraper automation and data freshness
- Add testing for API routes
- Normalize date handling across time zones

## Author

Created as a capstone project to demonstrate full-stack development, API design, and frontend state management using real-world data.

