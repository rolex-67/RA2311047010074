const axios = require('axios');

const EVAL_URL = 'http://20.207.122.201/evaluation-service';

// Basic validation lists based on the provided tables
const validStacks = ["backend", "frontend"];
const validLevels = ["debug", "info", "warn", "error", "fatal"];

/**
 * Reusable Log function for the Evaluation Evaluation Server
 * stack: "backend" | "frontend"
 * level: "debug" | "info" | "warn" | "error" | "fatal"
 * packageName: Specific package name based on stack
 * message: Descriptive message
 */
async function Log(stack, level, packageName, message) {
    // IT IS MANDATORY TO INTEGRATE THE LOGGING MIDDLEWARE FROM THE FIRST FUNCTION WRITTEN IN THE TEST.
    const s = stack.toLowerCase();
    const l = level.toLowerCase();
    const p = packageName.toLowerCase();

    if (!validStacks.includes(s)) {
        console.warn(`[Log Warning] Invalid stack: ${s}`);
    }
    if (!validLevels.includes(l)) {
        console.warn(`[Log Warning] Invalid level: ${l}`);
    }

    const token = process.env.ACCESS_TOKEN;
    if (!token) {
        console.log(`[LOCAL LOG] ${s} | ${l} | ${p} | ${message}`);
        return;
    }

    try {
        const response = await axios.post(
            `${EVAL_URL}/logs`,
            {
                stack: s,
                level: l,
                package: p,
                message: message
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        // Successfully logged to test server
    } catch (error) {
        console.error('[LOG ERROR] Failed to send log to evaluation server:', error?.response?.data || error.message);
    }
}

// Express Middleware for generic request logging (optional but highly recommended)
const requestLogger = (req, res, next) => {
    Log('backend', 'info', 'middleware', `Incoming ${req.method} request to ${req.originalUrl}`);
    
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);
        
        let level = 'info';
        if (res.statusCode >= 400 && res.statusCode < 500) level = 'warn';
        if (res.statusCode >= 500) level = 'error';
        
        Log('backend', level, 'middleware', `Response for ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    };

    next();
};

module.exports = {
    Log,
    requestLogger
};
