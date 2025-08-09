import express from 'express';
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
import cors from 'cors';
import buildRoutes from './routes/buildRoutes.js';
import notFound from './middleware/notFound.js';
import sessionRoutes from './routes/sessionRoutes.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // allows us to accept JSON data in the req.body

const PORT = process.env.PORT || 5000;

app.use('/api/build', buildRoutes);
app.use('/api/session', sessionRoutes)

app.use(notFound);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
  });
});
