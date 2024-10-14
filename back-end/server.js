const express = require('express');
const dbconnect = require( './DATABASE/INDEX');
const {PORT} = require('./config/index');
const router= require('./routs/rot');
const errorHandler = require('./middlewares/errorhandler.js');
const cookieParser = require('cookie-parser');




const port = PORT;

const app = express();


app.use (cookieParser());

app.use(express.json());

app.use(router);

dbconnect();
app.use('/storage',express.static('storage'));

app.use(errorHandler);



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
}) 