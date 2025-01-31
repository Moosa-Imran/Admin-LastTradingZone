const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const PORT = 3001;
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;
const app = express();

app.enable('trust proxy');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    dbName: 'Sessions',
    collectionName: 'Admin',
    ttl: 4 * 24 * 60 * 60,
  }),
  cookie: { 
    secure: true,
    httpOnly: true,
    maxAge: 4 * 24 * 60 * 60 * 1000,
    sameSite: 'lax', 
  }
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (like HTML, CSS, JS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// MongoDB Connection
MongoClient.connect(mongoUri)
  .then(client => {
    console.log('Connected to MongoDB');

    const usersDb = client.db('Users');
    const dataDb = client.db('Data');

    // Store the database instances in app.locals for access in routes
    app.locals.usersDb = usersDb;
    app.locals.dataDb = dataDb;

    // Import and use the routes
    const routes = require('./routes');
    app.use('/', routes);
  })
  .catch(err => {
    console.error('Could not connect to MongoDB...', err);
    process.exit(1); 
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
