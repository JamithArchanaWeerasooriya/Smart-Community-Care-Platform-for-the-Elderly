var express = require("express");
var dotenv = require("dotenv");
var cors = require('cors');
var mongoose = require("mongoose");
var routes = require("./routes");

var app = express();
dotenv.config();
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

var DB_URI = process.env.ATLAS_URI;
var option = { dbName:"main"};
mongoose.connect(DB_URI, option).then(()=>{
    console.log("Database connected!!!");
}).catch((error)=>{
    console.log("Db connect failed - "+error);
});

app.use("/api", routes);

app.get("/",(req,res)=>{
    res.send("Hello world!!!");
});

const port = process.env.PORT || 3001;
app.listen(port,()=>{
    console.log(`Server is running on post: ${port}`);
});