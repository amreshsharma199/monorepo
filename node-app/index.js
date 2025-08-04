const express = require('express');
const app = express();
const port = 3000;

app.get('/hello', (req, res) => {
  res.send('Hello from Node App!');
});

app.listen(port, () => {
  console.log(`Node app listening at http://localhost:${port}`);
});

module.exports = app; // for testing
