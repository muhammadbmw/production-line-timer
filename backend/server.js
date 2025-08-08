import express from 'express';
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.listen(5000, ()  => {
    connectDB();
    console.log(`Server started on port: ${PORT}`);
})
