const express = require('express');
const bodyParser = require('body-parser');
const config= require('config');
const cors= require("cors")
const routes= require('./router/uploadApi');

const app = express();  
const port = config.get("PORT")
// Middleware
app.use(cors("*"))
app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/',routes)

app.listen(`${port}`,function () {
  console.log("Server Started at PORT 3000");
})
