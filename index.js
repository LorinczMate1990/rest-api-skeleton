const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Where we will keep books
let books = [];

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// For testing: curl -d '{"bookName":333}' -H "Content-Type: application/json" -X POST http://localhost:3000/book
app.post('/book', (req, res) => {
    const book = req.body;
    // Output the book to the console for debugging
    console.log(`Received body: `, book);
    books.push(book);
    console.log("Books: ", books)
    res.send('Book is added to the database');
});

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
