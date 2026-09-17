import { Router } from 'express';
import { z } from 'zod';
import { Instance } from '../models/Instance.js';
import { createInstance, deleteInstance, performAction } from '../services/instanceService.js';
import { interpretOperation } from '../services/geminiService.js';
import { resolveOsConfig } from '../lib/osRegistry.js';
import { SSHKey } from '../models/SSHKey.js';
const interpretSchema = z.object({ message: z.string().trim().min(1).max(2000) });
const executeSchema = z.discriminatedUnion('operation', [
  z.object({ 
    operation: z.literal('create'), 
    name: z.string().trim().min(1).max(64), 
    sshKeyName: z.string().max(64).optional(),
    os: z.object({
      type: z.literal('linux'),
      distribution: z.string(),
      version: z.string()
    }).optional().refine((data) => {
      if (!data) return true;
      return resolveOsConfig(data) !== null;
    }, { message: 'Unsupported or invalid Operating System selection' })
  }),
  z.object({ operation: z.literal('start'), instanceId: z.string().min(1) }),
  z.object({ operation: z.literal('stop'), instanceId: z.string().min(1) }),
  z.object({ operation: z.literal('delete'), instanceId: z.string().min(1) })
]);

export const aiOperationsRouter = Router();
aiOperationsRouter.post('/interpret', async (req, res, next) => {
  try {
    const { message } = interpretSchema.parse(req.body);
    const instances = await Instance.find({ ownerId: req.auth.userId, state: { $ne: 'deleted' } }).select('name state').sort({ createdAt: -1 });
    const proposal = await interpretOperation(message, instances);
    const match = proposal.operation === 'create' || proposal.operation === 'none' ? null : instances.find(instance => instance.name.toLowerCase() === String(proposal.instanceName || '').toLowerCase());
    if (proposal.operation !== 'create' && proposal.operation !== 'none' && !match) {
      proposal.operation = 'none';
      proposal.message = 'I could not find one exact matching instance. Please use its name from the list.';
    }
    res.json({ ...proposal, instance: match ? { id: String(match._id), name: match.name, state: match.state } : null });
  } catch (error) { next(error); }
});

aiOperationsRouter.post('/execute', async (req, res, next) => {
  try {
    const command = executeSchema.parse(req.body);
    if (command.operation === 'create') {
      let key;
      if (command.sshKeyName) {
        key = await SSHKey.findOne({ ownerId: req.auth.userId, name: command.sshKeyName });
      } else {
        key = await SSHKey.findOne({ ownerId: req.auth.userId, isDefault: true });
        if (!key) {
          key = await SSHKey.findOne({ ownerId: req.auth.userId }).sort({ createdAt: 1 });
        }
      }

      if (!key) {
        return res.status(400).json({ code: 'SSH_KEY_REQUIRED', message: 'No SSH key configured. Please add an SSH public key to create an instance.' });
      }

      return res.status(201).json(await createInstance({ ownerId: req.auth.userId, name: command.name, publicKey: key.publicKey, sshKeyId: key._id, os: command.os }));
    }
    const row = await Instance.findOne({ _id: command.instanceId, ownerId: req.auth.userId }).select('+keyFile');
    if (!row || row.state === 'deleted') return res.status(404).json({ message: 'Instance not found' });
    if (command.operation === 'delete') { await deleteInstance(row); return res.sendStatus(204); }
    res.json(await performAction(row, command.operation));
  } catch (error) { next(error); }
});
