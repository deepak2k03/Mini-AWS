import mongoose from 'mongoose';

const sshKeySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  publicKey: { type: String, required: true },
  fingerprint: { type: String, required: true },
  keyType: { type: String, required: true }, // e.g. ssh-ed25519, ssh-rsa
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

// A user should ideally not have multiple keys with the exact same name
sshKeySchema.index({ ownerId: 1, name: 1 }, { unique: true });

export const SSHKey = mongoose.model('SSHKey', sshKeySchema);
