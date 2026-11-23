import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID reference is required'],
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID reference is required'],
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent duplicate registrations by the same student for the same event
registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
