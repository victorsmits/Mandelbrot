let express = require('express');
let path = require('path');
const cors = require('cors')

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');

let app = express();

app.use(express.json())
app.use(cors())

app.use('/', indexRouter);


// port
let port = process.env.PORT || 4000
app.listen(port)

module.exports = app;
