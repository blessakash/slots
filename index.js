const express = require("express");
const app = express();
require("dotenv");
const routes = require("./controllers/Event");
const { default: mongoose } = require("mongoose");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use("/api", routes);

mongoose
  .connect(
    "mongodb+srv://test:test@cluster0.thrwoic.mongodb.net/slot-schedule?retryWrites=true&w=majority"
  )
  .then((data) => {
    app.listen(2001, () => {
      console.log("Listening at 2001", data.connection.host);
    });
  });
