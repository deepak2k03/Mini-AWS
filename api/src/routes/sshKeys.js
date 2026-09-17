import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { SSHKey } from '../models/SSHKey.js';

export const sshKeysRouter = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(64),
  publicKey: z.string().trim().min(40).max(16384).regex(/^(ssh-ed25519|ecdsa-sha2-nistp(256|384|521)|ssh-rsa)\s+\S+/, 'Enter a valid SSH public key')
});

function calculateFingerprint(publicKey) {
  try {
    const parts = publicKey.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const keyType = parts[0];
    const keyBody = parts[1];
    
    const buffer = Buffer.from(keyBody, 'base64');
    const hash = crypto.createHash('sha256').update(buffer).digest('base64').replace(/=/g, '');
    return { keyType, fingerprint: `SHA256:${hash}` };
  } catch (err) {
    return null;
  }
}

sshKeysRouter.get('/', async (req, res, next) => {
  try {
    const keys = await SSHKey.find({ ownerId: req.auth.userId }).sort({ createdAt: -1 });
    res.json(keys.map(k => ({
      id: k._id,
      name: k.name,
      keyType: k.keyType,
      fingerprint: k.fingerprint,
      isDefault: k.isDefault,
      createdAt: k.createdAt
    })));
  } catch (error) { next(error); }
});

sshKeysRouter.post('/', async (req, res, next) => {
  try {
    const { name, publicKey } = createSchema.parse(req.body);
    
    // Check if key already exists
    const existing = await SSHKey.findOne({ ownerId: req.auth.userId, name });
    if (existing) {
      return res.status(400).json({ message: 'An SSH key with this name already exists' });
    }

    const keyInfo = calculateFingerprint(publicKey);
    if (!keyInfo) {
      return res.status(400).json({ message: 'Invalid SSH public key format' });
    }

    const count = await SSHKey.countDocuments({ ownerId: req.auth.userId });
    const isDefault = count === 0; // Make default if it's the first key

    const newKey = await SSHKey.create({
      ownerId: req.auth.userId,
      name,
      publicKey,
      keyType: keyInfo.keyType,
      fingerprint: keyInfo.fingerprint,
      isDefault
    });

    res.status(201).json({
      id: newKey._id,
      name: newKey.name,
      keyType: newKey.keyType,
      fingerprint: newKey.fingerprint,
      isDefault: newKey.isDefault,
      createdAt: newKey.createdAt
    });
  } catch (error) { next(error); }
});

sshKeysRouter.delete('/:id', async (req, res, next) => {
  try {
    const key = await SSHKey.findOneAndDelete({ _id: req.params.id, ownerId: req.auth.userId });
    if (key && key.isDefault) {
      const nextKey = await SSHKey.findOne({ ownerId: req.auth.userId }).sort({ createdAt: 1 });
      if (nextKey) {
        await nextKey.updateOne({ isDefault: true });
      }
    }
    res.sendStatus(204);
  } catch (error) { next(error); }
});

sshKeysRouter.patch('/:id/default', async (req, res, next) => {
  try {
    const key = await SSHKey.findOne({ _id: req.params.id, ownerId: req.auth.userId });
    if (!key) return res.status(404).json({ message: 'SSH key not found' });
    
    await SSHKey.updateMany({ ownerId: req.auth.userId }, { isDefault: false });
    await key.updateOne({ isDefault: true });
    
    res.json({ success: true });
  } catch (error) { next(error); }
});
