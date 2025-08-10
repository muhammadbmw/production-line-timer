import mongoose from "mongoose";

const pauseSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, default: null }
}, { _id: false });

const popupResponseSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  response: { type: String, enum: ['yes', 'no', 'timeout'], required: true }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  loginId: { type: String, required: true },
  buildNumber: { type: String, required: true },
  numberOfParts: Number,
  timePerPart: Number, // minutes
  startTime: { type: Date, required: true },
  pausedDurations: [pauseSchema], // array of {start, end}
  defects: { type: Number, default: 0 },
  totalParts: { type: Number, default: null },
  popupResponses: [popupResponseSchema],
  submission: {
    submittedAt: Date,
    auto: { type: Boolean, default: false }
  },
  totalActiveTime: Number,   // seconds
  totalInactiveTime: Number  // seconds
}, { timestamps: true });

// instance method to compute total paused time in ms
sessionSchema.methods.computeTotalPausedMs = function () {
  return (this.pausedDurations || []).reduce((sum, p) => {
    if (p.start && p.end) return sum + (p.end - p.start);
    if (p.start && !p.end) return sum + (Date.now() - p.start);
    return sum;
  }, 0);
};

const Session = mongoose.model('Session', sessionSchema);
export default  Session;