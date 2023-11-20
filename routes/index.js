const bodyParser = require('body-parser');
const express=require('express');
const dbConnect = require('../config/dbConnect');
const app=express();
const dotenv=require("dotenv").config({ path: 'routes/.env' });
const PORT=process.env.PORT || 4000;
const authRouter=require('../routes/authRoute');
const productRouter=require('../routes/productRoute');
const cookieParser=require('cookie-parser')
const { notFound, errorHandler } = require('../middlewares/errorHandler');
dbConnect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use("/api/user", authRouter);
app.use("/api/product", productRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, ()=>{
  console.log(`Server is running at PORT ${PORT}`);
});