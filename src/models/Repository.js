import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Incremented atomically when a new issue is opened in this repository.
  nextIssueNumber: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

repositorySchema.index({ owner: 1, name: 1 }, { unique: true });
repositorySchema.index({ members: 1 });

export const Repository = mongoose.model('Repository', repositorySchema);
