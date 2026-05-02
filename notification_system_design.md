# Stage 1

## Core Actions & REST API Design
To build a robust campus notification platform (handling Placements, Events, and Results), the system must support the following core actions for pre-authorized students:
1. **Fetch Notifications**: Retrieve a paginated list of notifications for the logged-in student.
2. **Mark as Read**: Update the status of a specific notification to prevent it from displaying as "unread".

### 1. Fetch Notifications
**Endpoint:** `GET /api/v1/notifications`
**Description:** Fetches all notifications for the authenticated student.

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Accept": "application/json"
}
```

**Request Query Parameters:**
*   `status` (optional): "read" | "unread"
*   `page` (optional): Integer (default 1)
*   `limit` (optional): Integer (default 20)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-string",
      "type": "Placement",
      "message": "CSX Corporation hiring",
      "isRead": false,
      "timestamp": "2026-04-22 17:51:18"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUnread": 12
  }
}
```

### 2. Mark Notification as Read
**Endpoint:** `PATCH /api/v1/notifications/:id/read`
**Description:** Marks a specific notification as read.

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:** *(Empty)*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read successfully."
}
```

## Real-Time Notification Mechanism
To deliver real-time updates without overwhelming the server with constant HTTP polling, I recommend using **WebSockets** (e.g., via `Socket.io`). 
*   **Workflow:** When a student logs into the platform, their client establishes a persistent WebSocket connection with the backend. 
*   When a new notification (like a Placement update) is triggered by the admin, the backend publishes the event to a message broker (like Redis Pub/Sub), which pushes the payload directly down the active WebSocket connection to the specific student's browser instantly.

---

# Stage 2

## Persistent Storage Suggestion
I recommend using a Relational Database Management System (RDBMS) like **PostgreSQL**.
**Why?**
*   **Structured Data:** Notifications have a strict schema (`type`, `message`, `timestamp`).
*   **Relationships:** There is a strict many-to-many relationship between Students and Notifications (e.g., an HR clicking "Notify All" sends ONE notification to 50,000 students). 
*   **Data Integrity:** We need strict ACID compliance so we don't accidentally mark a notification as read for the wrong student.

## Database Schema
To prevent data duplication when notifying thousands of students simultaneously, we normalize the database:

1. **`students` table**
   * `id` (Primary Key, UUID)
   * `name` (VARCHAR)
   * `email` (VARCHAR)

2. **`notifications` table** (Stores the actual message payload)
   * `id` (Primary Key, UUID)
   * `type` (ENUM: 'Event', 'Result', 'Placement')
   * `message` (TEXT)
   * `created_at` (TIMESTAMP)

3. **`student_notifications` table** (Junction table tracking read status)
   * `id` (Primary Key, UUID)
   * `student_id` (Foreign Key -> students.id)
   * `notification_id` (Foreign Key -> notifications.id)
   * `is_read` (BOOLEAN, default FALSE)

## Scalability Problems & Solutions
**Problem:** As data volume increases to millions of rows, the `student_notifications` table will become a massive bottleneck, causing slow read queries and locking issues during bulk inserts.
**Solutions:**
1. **Indexing:** Create a composite index on `(student_id, is_read)` to speed up fetch queries.
2. **Read Replicas:** Route all `GET /api/v1/notifications` requests to read-only database replicas to free up the primary database for heavy inserts.
3. **Partitioning:** Partition the `student_notifications` table by date. Old notifications (e.g., > 6 months) can be archived or dropped.

## DB Queries Matching Stage 1
**Fetch Notifications:**
```sql
SELECT n.id, n.type, n.message, sn.is_read, n.created_at 
FROM notifications n
JOIN student_notifications sn ON n.id = sn.notification_id
WHERE sn.student_id = 'student-uuid'
ORDER BY n.created_at DESC
LIMIT 20 OFFSET 0;
```

**Mark as Read:**
```sql
UPDATE student_notifications 
SET is_read = TRUE 
WHERE notification_id = 'notification-uuid' AND student_id = 'student-uuid';
```

---

# Stage 3

## Query Analysis
**The Developer's Query:**
```sql
SELECT * FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt DESC;
```
**Is it accurate?** Yes, it logically retrieves the correct data.
**Why is it slow?** It is slow because with 5,000,000 rows, the database likely has to perform a full table scan (if no indexes exist) to find rows matching the `studentID` and `isRead` conditions, and then perform a costly "file sort" operation in memory to order them by `createdAt`.

**What would you change?** 
I would create a composite index: `CREATE INDEX idx_student_unread ON notifications (studentID, isRead, createdAt DESC);`. 
**Computation Cost:** With the composite index, the database uses a B-Tree to instantly jump to the subset of rows for `studentID = 1042` that are `isRead = false`, and since the index is already sorted by `createdAt`, the sorting step (`ORDER BY`) is entirely bypassed ($O(\log N)$ lookup instead of $O(N \log N)$ sorting).

## Indexing Every Column?
**Is this effective?** **NO.** 
**Why not?** Adding indexes to every column severely degrades write performance (`INSERT`, `UPDATE`, `DELETE`). Every time a new notification is added or marked as read, the database must update *every single index*, slowing down the system and drastically inflating storage costs. Indexes should only be placed on columns frequently used in `WHERE`, `JOIN`, and `ORDER BY` clauses.

## Placement Notification Query
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt >= NOW() - INTERVAL '7 days';
```

---

# Stage 4

## Performance Improvement Strategy
Fetching notifications directly from the DB on every page load for every student is unsustainable. 

### Suggested Solution: Caching Layer (Redis)
We should implement an in-memory caching layer using **Redis**.

**How it works:**
1. When a student logs in, we query the DB for their top 20 unread notifications and cache the JSON result in Redis with a key like `notifs:unread:studentID`.
2. On subsequent page loads, the API fetches directly from Redis ($O(1)$ time complexity, sub-millisecond response).
3. When a new notification is created, we invalidate or append to the Redis cache. When a notification is marked as read, we update the cache.

### Tradeoffs
*   **Pros:** Massive reduction in DB load; lightning-fast user experience; highly scalable.
*   **Cons:** Cache Invalidation Complexity (keeping the cache perfectly synced with the DB is notoriously difficult); introduces a new point of failure and infrastructure cost (Redis servers).

*Alternative Strategy:* **Debouncing & Local Storage.** Have the frontend cache the notifications in browser `localStorage` and only poll the backend every 5 minutes (or rely strictly on the WebSocket connection). *Tradeoff:* Users might see stale data if they use multiple devices simultaneously.

---

# Stage 5

## Analysis of the Flawed Pseudocode
**Shortcomings:**
The `notify_all` function uses a **synchronous, blocking loop**. It iterates over 50,000 students one-by-one. 
1. If `send_email` relies on an external API (like SendGrid/SMTP) and takes 1 second per email, the function will take ~14 hours to complete.
2. If `send_email` throws a network timeout error (as it did for the 200 students), the loop crashes, leaving the remaining students without emails, DB inserts, or app notifications.

## Redesign for Reliability and Speed
**Should saving to DB and sending email happen together?** **NO.** 
Database inserts are generally fast and reliable. Email APIs are slow, third-party dependencies prone to rate-limiting and network failures. They must be completely decoupled.

We should redesign this using an **Asynchronous Message Queue** (e.g., RabbitMQ, Kafka, or AWS SQS).

### Revised Pseudocode
```python
# 1. Main function executed by the HR's request
function notify_all(student_ids: array, message: string):
    # Create the core notification ONCE in the DB
    notification_id = db.insert("notifications", { message: message })
    
    # Bulk insert junction table rows instantly
    db.bulk_insert("student_notifications", student_ids, notification_id)
    
    # Push lightweight jobs to an asynchronous Message Queue
    for student_id in student_ids:
        message_queue.publish("email_jobs", { student_id, message })
        message_queue.publish("push_jobs", { student_id, message })

# 2. Independent Worker Service (runs in the background, horizontally scaled)
function process_email_queue(job):
    try:
        send_email(job.student_id, job.message)
    except EmailServiceError:
        # If the email fails, we put it back in the queue to retry later
        # It DOES NOT crash the rest of the system
        message_queue.retry(job, delay=5_minutes)

function process_push_queue(job):
    push_to_app(job.student_id, job.message) # WebSocket emission
```

---

# Stage 6

## Priority Inbox Approach
To maintain a "Priority Inbox" that always displays the top 'n' most important unread notifications efficiently, we must utilize a **Priority Queue (implemented via a Max-Heap)** or a highly optimized sorting mechanism in memory.

### The Algorithm
1. **Weight Assignment:** 
   We assign integer weights to the Notification Enums:
   *   `Placement` = 3 (Highest)
   *   `Result` = 2
   *   `Event` = 1 (Lowest)
2. **Tie-Breaker:** 
   If two notifications have the exact same weight (e.g., two Placement notifications), we compare their `Timestamp` strings. The more recent timestamp wins.
3. **Efficiency as New Notifications Arrive:** 
   Instead of re-sorting the entire array of notifications every time a new one arrives ($O(N \log N)$ time), we maintain a Heap. When a new notification arrives via our WebSocket, we insert it into the Heap. Inserting into a heap takes $O(\log N)$ time, making it incredibly fast and efficient for real-time applications.
4. **Implementation:** 
   In our Node.js coding solution, we will fetch the data from the provided Evaluation API, parse the JSON, assign the weights, sort the list using a custom comparator function, and slice the top 10 results.
