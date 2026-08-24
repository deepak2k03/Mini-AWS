import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';
import { docker } from '../lib/docker.js';
import { Instance } from '../models/Instance.js';

const execFileAsync = promisify(execFile);
const networkLabels = { 'com.miniaws.managed': 'true', 'com.miniaws.network': 'private' };

function networkError(message, cause) {
  return Object.assign(new Error(message), { statusCode: 502, cause });
}

export async function ensurePrivateNetwork() {
  const network = docker.getNetwork(config.INSTANCE_NETWORK_NAME);
  try { await network.inspect(); return network; } catch (error) {
    if (error.statusCode !== 404) throw networkError('Unable to inspect the private instance network', error);
  }
  try {
    const created = await docker.createNetwork({ Name: config.INSTANCE_NETWORK_NAME, Driver: 'bridge', CheckDuplicate: true, Labels: networkLabels });
    return docker.getNetwork(created.id);
  } catch (error) {
    // Another concurrent request may have created the network after our inspect.
    if (error.statusCode === 409) return docker.getNetwork(config.INSTANCE_NETWORK_NAME);
    throw networkError('Unable to create the private instance network', error);
  }
}

export async function assertAvailableInstanceName(_ownerId, name) {
  // Docker DNS aliases are network-wide, so names must be unique in this VPC.
  const existing = await Instance.exists({ name, state: { $ne: 'deleted' } });
  if (existing) throw Object.assign(new Error('An active instance with this name already exists'), { statusCode: 409 });
}

export async function connectContainer(container, hostname) {
  const network = await ensurePrivateNetwork();
  try {
    const info = await container.inspect();
    if (info.NetworkSettings.Networks?.[config.INSTANCE_NETWORK_NAME]) return info;
    await network.connect({ Container: info.Id, EndpointConfig: { Aliases: [hostname] } });
    return await container.inspect();
  } catch (error) {
    if (error.statusCode === 404) throw Object.assign(new Error('Instance container is unavailable'), { statusCode: 404 });
    throw networkError('Unable to connect instance to the private network', error);
  }
}

export function privateNetworkDetails(info) {
  const endpoint = info.NetworkSettings.Networks?.[config.INSTANCE_NETWORK_NAME];
  if (!endpoint?.IPAddress) throw networkError('Instance did not receive a private network address');
  return { privateIP: endpoint.IPAddress, networkName: config.INSTANCE_NETWORK_NAME };
}

export async function internalSshCredentials() {
  const directory = path.resolve(config.INSTANCE_KEY_DIR, 'internal-network');
  const privateKey = path.join(directory, 'id_ed25519');
  const publicKey = `${privateKey}.pub`;
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  try { await fs.access(privateKey); await fs.access(publicKey); } catch {
    const temporary = path.join(directory, `id_ed25519-${crypto.randomUUID()}`);
    try {
      await execFileAsync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', temporary]);
      await fs.rename(temporary, privateKey).catch(async error => { if (error.code !== 'EEXIST') throw error; await fs.rm(temporary, { force: true }); });
      await fs.rename(`${temporary}.pub`, publicKey).catch(async error => { if (error.code !== 'EEXIST') throw error; await fs.rm(`${temporary}.pub`, { force: true }); });
    } catch (error) { throw networkError('Unable to generate internal SSH credentials', error); }
  }
  return { privateKey, publicKey };
}
