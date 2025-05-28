// server/index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 5000;
const BATCH_SIZE = 10;
const BUFFER_FILE = "buffer.json";

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/data_pipeline", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const dataSchema = new mongoose.Schema({
  content: String,
  server: String,
  timestamp: { type: Date, default: Date.now },
});

const DataModel = mongoose.model("Data", dataSchema);

let buffer = [];

// Load buffer from disk if exists
if (fs.existsSync(BUFFER_FILE)) {
  try {
    const fileData = fs.readFileSync(BUFFER_FILE);
    buffer = JSON.parse(fileData);
    console.log("Buffer restored from disk.");
  } catch (err) {
    console.error("Failed to read buffer from disk:", err);
  }
}

app.post("/ingest", (req, res) => {
  const { content, server } = req.body;
  const logEntry = { content, server, timestamp: new Date() };
  buffer.push(logEntry);

  if (buffer.length >= BATCH_SIZE) {
    DataModel.insertMany(buffer)
      .then(() => {
        console.log(`Batch written: ${buffer.length}`);
        buffer = [];
        fs.writeFileSync(BUFFER_FILE, JSON.stringify(buffer));
      })
      .catch((err) => {
        console.error("Batch insert failed:", err);
      });
  } else {
    // Persist buffer to disk for crash recovery
    fs.writeFileSync(BUFFER_FILE, JSON.stringify(buffer));
  }

  res.status(200).json({ message: "Log received." });
});

app.get("/data", async (req, res) => {
  try {
    const logs = await DataModel.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
