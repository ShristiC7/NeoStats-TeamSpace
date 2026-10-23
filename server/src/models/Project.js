import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['manager', 'member', 'viewer'], default: 'member' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  // Project Links (Feature 2)
  liveDemoUrl: { type: String, default: null, maxlength: 2048 },
  githubUrl: { type: String, default: null, maxlength: 2048 }
}, { timestamps: true });

projectSchema.index({ 'members.user': 1, status: 1 });

export default mongoose.model('Project', projectSchema);
