const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Database interface
let tickets = [];
let people = [];

app.use(cors());

// Configuring body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// For testing: curl -d '{"bookName":333}' -H "Content-Type: application/json" -X POST http://localhost:3000/book
app.post('/ticket', (req, res) => {
    const ticket = req.body;
    // Output the book to the console for debugging
    console.log(`Received body: `, ticket);
    tickets.push(ticket);
    console.log("Tickets: ", tickets)
    res.send({"status": "OK"});
});

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
