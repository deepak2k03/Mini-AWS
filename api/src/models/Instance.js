import mongoose from 'mongoose';

const osSchema = new mongoose.Schema({
  type: { type: String, enum: ['linux'], required: true },
  distribution: { type: String, required: true },
  version: { type: String, required: true }
}, { _id: false });

const instanceSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 64 },
  dockerId: { type: String, unique: true, sparse: true, index: true },
  os: { type: osSchema },
  provider: { type: String, enum: ['docker', 'vm'], default: 'docker' },
  image: { type: String }, // Made optional as legacy uses it but new abstraction might hide it
  hostname: { type: String, trim: true, maxlength: 64 },
  privateIP: { type: String },
  networkName: { type: String },
  sshKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SSHKey', required: false },
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
