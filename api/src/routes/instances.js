import { Router } from 'express';
import { z } from 'zod';
import { Instance } from '../models/Instance.js';
import { createInstance, deleteInstance, performAction } from '../services/instanceService.js';

const launchSchema = z.object({
  name: z.string().trim().min(1).max(64),
  publicKey: z.string().trim().min(40).max(16384).regex(/^(ssh-ed25519|ecdsa-sha2-nistp(256|384|521)|ssh-rsa)\s+\S+/, 'Enter a valid SSH public key')
});
const actionSchema = z.object({ action: z.enum(['start', 'stop', 'restart']) });

export const instancesRouter = Router();
instancesRouter.get('/', async (req, res, next) => {
  try { res.json(await Instance.find({ ownerId: req.auth.userId, state: { $ne: 'deleted' } }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
instancesRouter.post('/', async (req, res, next) => {
  try { res.status(201).json(await createInstance({ ownerId: req.auth.userId, ...launchSchema.parse(req.body) })); } catch (error) { next(error); }
});
instancesRouter.post('/:id/actions', async (req, res, next) => {
  try {
    const row = await Instance.findOne({ _id: req.params.id, ownerId: req.auth.userId }).select('+keyFile');
    if (!row) return res.status(404).json({ message: 'Instance not found' });
    res.json(await performAction(row, actionSchema.parse(req.body).action));
  } catch (error) { next(error); }
});
instancesRouter.delete('/:id', async (req, res, next) => {
  try {
    const row = await Instance.findOne({ _id: req.params.id, ownerId: req.auth.userId }).select('+keyFile');
    if (!row) return res.status(404).json({ message: 'Instance not found' });
    await deleteInstance(row); res.sendStatus(204);
  } catch (error) { next(error); }
});

