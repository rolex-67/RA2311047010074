# Evaluation Backend Engineering Track 🚀

Welcome to my submission for the Evaluation Backend Engineering Assessment! I chose the **Backend Track** to showcase my skills in algorithmic problem-solving, architectural system design, and strict constraint management.

## 📂 What's Inside?

This repository contains all the required deliverables separated into modular microservices:

1. **`logging_middleware`**: A custom, reusable Node.js module that strictly formats logs (`stack`, `level`, `package`, `message`) and POSTs them securely to the Evaluation Server using my unique Access Token. It is deeply integrated into every other service here.
2. **`notification_system_design.md`**: A comprehensive, 6-stage architectural Markdown document designing a highly scalable Campus Notification System (covering REST APIs, DB Schemas, Caching, and Message Queues).
3. **`notification_app_be`**: The Stage 6 functional deliverable. It's an Express API that fetches raw notifications and uses a custom weight-based algorithm (Placement > Result > Event) to calculate and return the Top 10 Priority Inbox.
4. **`vehicle_maintence_scheduler`**: An Express API that fetches Depot and Vehicle data, and runs a **0/1 Knapsack Dynamic Programming Algorithm** to figure out the absolute optimal combination of vehicle tasks to maximize impact without exceeding mechanic hours.

---

## 🛠️ How to Run & Test

First, make sure you have Node.js installed, then run `npm install` in the respective folders if needed. 
*(Note: A valid `.env` file with an `ACCESS_TOKEN` is required in the root directory for the logging middleware to authenticate with the test server).*

### 1. Test the Priority Inbox (Campus Notifications)
```bash
cd notification_app_be
node src/priority_inbox.js
```

### 2. Test the Vehicle Maintenance Scheduler (DP Algorithm)
```bash
cd vehicle_maintence_scheduler
node src/scheduler.js
```

---

## 📮 Postman API Testing

I have built both deliverables as Express APIs so they can be easily tested via Postman! 

**How to test:**
1. Start both servers using the terminal commands above.
2. Open Postman.
3. To test the Priority Inbox, make a **GET** request to:
   👉 `http://localhost:3002/priority-inbox`
4. To test the Vehicle Scheduler, make a **GET** request to:
   👉 `http://localhost:3001/optimize`

*(You can easily create your own Postman Collection by saving these two local endpoints!)*

---
*Built with ❤️ for the Evaluation Engineering Challenge.*
