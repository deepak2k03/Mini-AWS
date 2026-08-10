import mongoose from 'mongoose';

const instanceSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 64 },
  dockerId: { type: String, unique: true, sparse: true, index: true },
  image: { type: String, required: true },
  state: { type: String, enum: ['creating', 'running', 'stopped', 'deleting', 'deleted', 'error'], default: 'creating', index: true },
  ssh: {
    host: { type: String, required: true },
    hostPort: { type: Number, min: 1, max: 65535 },
    username: { type: String, default: 'instance' }
  },
  keyFile: { type: String, select: false },
  lastError: { type: String, maxlength: 2000 },
  deletedAt: Date
}, { timestamps: true, versionKey: false });

instanceSchema.index({ ownerId: 1, createdAt: -1 });
export const Instance = mongoose.model('Instance', instanceSchema);

