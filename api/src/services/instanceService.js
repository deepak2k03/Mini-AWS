import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { Instance } from '../models/Instance.js';
import { assertAvailableInstanceName, ensurePrivateNetwork, internalSshCredentials } from './networkingService.js';
import { resolveOsConfig } from '../lib/osRegistry.js';
import { DockerProvider } from './providers/DockerProvider.js';

const providers = {
  docker: new DockerProvider()
};

function getProvider(providerName) {
  const provider = providers[providerName];
  if (!provider) throw new Error(`Provider '${providerName}' is not implemented.`);
  return provider;
}

async function writeKeyFile(publicKey) {
  const directory = path.resolve(config.INSTANCE_KEY_DIR);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, `${crypto.randomUUID()}.pub`);
  await fs.writeFile(file, `${publicKey.trim()}\n`, { encoding: 'utf8', mode: 0o600 });
  return file;
}

export async function createInstance({ ownerId, name, publicKey, sshKeyId, os }) {
  await assertAvailableInstanceName(ownerId, name);
  await ensurePrivateNetwork();
  
  // Resolve OS config. Fallback to default alpine image if not provided for legacy compatibility
  let osConfig = resolveOsConfig(os);
  if (!osConfig) {
    if (!os) {
      // Legacy creation fallback
      osConfig = { image: config.INSTANCE_IMAGE, provider: 'docker' };
    } else {
      throw Object.assign(new Error('Invalid or unsupported Operating System configuration'), { statusCode: 400 });
    }
  }

  const internalSsh = await internalSshCredentials();
  
  const instanceData = {
    ownerId, 
    name, 
    hostname: name, 
    networkName: config.INSTANCE_NETWORK_NAME, 
    image: osConfig.image, 
    os,
    provider: osConfig.provider,
    sshKeyId,
    state: 'creating', 
    ssh: { host: config.SSH_PUBLIC_HOST, username: 'instance' }
  };
  
  const row = await Instance.create(instanceData);
  let keyFile;

  try {
    keyFile = await writeKeyFile(publicKey);
    await row.updateOne({ keyFile });
    
    const provider = getProvider(osConfig.provider);
    const updateFields = await provider.create(row, osConfig, keyFile, internalSsh);
    
    // Some fields like dockerId need to be saved immediately before other fields, in case of partial error
    if (updateFields.dockerId) {
      await row.updateOne({ dockerId: updateFields.dockerId });
    }

    return await Instance.findByIdAndUpdate(row._id, updateFields, { new: true });
  } catch (error) {
    if (row.provider) {
      try {
        const provider = getProvider(row.provider);
        await provider.delete(row);
      } catch (cleanupError) {
        console.error('Failed to cleanup instance after creation failure:', cleanupError);
      }
    }
    await Instance.findByIdAndUpdate(row._id, { state: 'error', lastError: error.message });
    throw error;
  }
}

export async function performAction(row, action) {
  try {
    const providerName = row.provider || 'docker'; // Fallback to docker for legacy
    const provider = getProvider(providerName);
    const updateFields = await provider.performAction(row, action);
    return await Instance.findByIdAndUpdate(row._id, updateFields, { new: true });
  } catch (error) {
    throw error;
  }
}

export async function deleteInstance(row) {
  await row.updateOne({ state: 'deleting' });
  try {
    const providerName = row.provider || 'docker';
    const provider = getProvider(providerName);
    
    await provider.delete(row);
    
    if (row.keyFile) await fs.rm(row.keyFile, { force: true });
    return Instance.findByIdAndUpdate(row._id, { state: 'deleted', deletedAt: new Date(), lastError: null }, { new: true });
  } catch (error) {
    await row.updateOne({ state: 'error', lastError: error.message });
    throw error;
  }
}
