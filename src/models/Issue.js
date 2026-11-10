import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
    index: true
  },
  issueNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 4,
    maxlength: 120
  },
  body: {
    type: String,
    trim: true,
    maxlength: 10000,
    default: ''
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  labels: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 30
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

issueSchema.index({ repository: 1, issueNumber: 1 }, { unique: true });
issueSchema.index({ repository: 1, status: 1, updatedAt: -1 });
issueSchema.index({ repository: 1, priority: 1, createdAt: -1 });
issueSchema.index({ assignee: 1, status: 1 });

export const Issue = mongoose.model('Issue', issueSchema);
