import { Router } from 'express';
import { z } from 'zod';
import { Instance } from '../models/Instance.js';
import { createInstance, deleteInstance, performAction } from '../services/instanceService.js';
import { interpretOperation } from '../services/geminiService.js';

const publicKey = z.string().trim().min(40).max(16384).regex(/^(ssh-ed25519|ecdsa-sha2-nistp(256|384|521)|ssh-rsa)\s+\S+/, 'Enter a valid SSH public key');
const interpretSchema = z.object({ message: z.string().trim().min(1).max(2000) });
const executeSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('create'), name: z.string().trim().min(1).max(64), publicKey }),
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
    if (command.operation === 'create') return res.status(201).json(await createInstance({ ownerId: req.auth.userId, name: command.name, publicKey: command.publicKey }));
    const row = await Instance.findOne({ _id: command.instanceId, ownerId: req.auth.userId }).select('+keyFile');
    if (!row || row.state === 'deleted') return res.status(404).json({ message: 'Instance not found' });
    if (command.operation === 'delete') { await deleteInstance(row); return res.sendStatus(204); }
    res.json(await performAction(row, command.operation));
  } catch (error) { next(error); }
});
