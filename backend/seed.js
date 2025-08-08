import mongoose from "mongoose";
import Build from "./models/Build.js"
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Build.deleteMany({});
  await Build.insertMany([
    { buildNumber: '123456', numberOfParts: 25, timePerPart: 2 },
    { buildNumber: '654321', numberOfParts: 40, timePerPart: 1.5 }
  ]);
  console.log('Dummy builds seeded!');
  process.exit();
});


