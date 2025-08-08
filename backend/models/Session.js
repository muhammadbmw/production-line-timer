import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  loginId: String,
  buildNumber: String,
  numberOfParts: Number,
  timePerPart: Number,
  startTime: Date,
  pausedDurations: [
    {
      start: Date,
      end: Date
    }
  ],
  defects: { type: Number, default: 0 },
  totalParts: Number,
  popupTimestamps: [Date],
  submission: {
    submittedAt: Date,
    auto: Boolean
  }
}, { timestamps: true });

sessionSchema.virtual('totalPausedTime').get(function () {
  return this.pausedDurations.reduce((sum, pause) => {
    if (pause.end && pause.start) {
      return sum + (pause.end - pause.start);
    }
    return sum;
  }, 0);
});

const Session = mongoose.model('Session', sessionSchema);
export default  Session;