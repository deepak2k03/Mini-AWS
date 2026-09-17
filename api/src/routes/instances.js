import { Router } from 'express';
import { z } from 'zod';
import { Instance } from '../models/Instance.js';
import { createInstance, deleteInstance, performAction } from '../services/instanceService.js';
import { resolveOsConfig } from '../lib/osRegistry.js';

const osSchema = z.object({
  type: z.literal('linux'),
  distribution: z.string().min(1),
  version: z.string().min(1)
}).optional(); // optional for backwards compatibility, though frontend will always send it now

const launchSchema = z.object({
  name: z.string().trim().min(1).max(64),
  sshKeyId: z.string().trim().min(1),
  os: osSchema
}).superRefine((data, ctx) => {
  if (data.os) {
    const resolved = resolveOsConfig(data.os);
    if (!resolved) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported or invalid Operating System selection'
      });
    }
  }
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

