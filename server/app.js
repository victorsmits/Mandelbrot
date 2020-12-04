let express = require('express');
const cors = require('cors')

let indexRouter = require('./routes/index');
let app = express();

app.use(express.json())
app.use(cors())

app.use('/', indexRouter);


// port
let port = 4000
app.listen(port)

module.exports = app;
