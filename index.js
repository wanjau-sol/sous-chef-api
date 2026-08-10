import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});