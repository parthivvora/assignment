// server.js
const express = require('express');
const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 5555;

// Middleware
app.use(express.json());


app.use(
    cors({
        // credentials: true,
        origin: ["*",
            "http://localhost:5173",
        ],
    })
);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1); // Stop the app if the connection fails
    }
};

// Connect to DB
connectDB();


// Routes
app.use('/api', userRoutes);

app.get("/", async (req, res) => {
    res.send("got data");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});