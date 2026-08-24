import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { docker } from '../lib/docker.js';
import { Instance } from '../models/Instance.js';
import { assertAvailableInstanceName, connectContainer, ensurePrivateNetwork, internalSshCredentials, privateNetworkDetails } from './networkingService.js';

const label = 'com.miniaws.managed';
const PORT_ALLOCATION_TIMEOUT_MS = 5_000;
const PORT_ALLOCATION_POLL_MS = 100;

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function readPublishedSshPort(container) {
  const deadline = Date.now() + PORT_ALLOCATION_TIMEOUT_MS;

  do {
    const details = await container.inspect();
    const binding = details.NetworkSettings.Ports['22/tcp']?.[0];
    if (binding?.HostPort) return Number(binding.HostPort);
    await wait(PORT_ALLOCATION_POLL_MS);
  } while (Date.now() < deadline);

  throw new Error('Docker did not allocate an SSH port before the timeout');
}

async function writeKeyFile(publicKey) {
  const directory = path.resolve(config.INSTANCE_KEY_DIR);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, `${crypto.randomUUID()}.pub`);
  await fs.writeFile(file, `${publicKey.trim()}\n`, { encoding: 'utf8', mode: 0o600 });
  return file;
}

function hostConfig(keyFile, internalSsh) {
  return {
    ReadonlyRootfs: true,
    // The image's tightly scoped setuid SSH launcher needs this capability to read
    // the root-owned internal key; it accepts only `ssh instance@<Docker-alias>`.
    SecurityOpt: [],
    CapDrop: ['ALL'],
    // sshd must bind port 22 and change from root to the login user. Nothing else is retained.
    // FOWNER is required by `install` after it chowns the authorized-keys file.
    // SYS_CHROOT is required by OpenSSH's pre-auth privilege-separation sandbox.
    CapAdd: ['NET_BIND_SERVICE', 'SETUID', 'SETGID', 'CHOWN', 'FOWNER', 'SYS_CHROOT'],
    PidsLimit: 128,
    Memory: 512 * 1024 * 1024,
    NanoCpus: 500_000_000,
    NetworkMode: config.INSTANCE_NETWORK_NAME,
    Binds: [
      `${keyFile}:/run/secrets/authorized_keys:ro`,
      `${internalSsh.publicKey}:/run/secrets/internal_network_authorized_key:ro`,
      `${internalSsh.privateKey}:/run/secrets/internal_ssh_key:ro`
    ],
    // Per-container SSH state and a disposable writable home are mounted over the read-only image.
    Tmpfs: {
      '/run': 'rw,nosuid,nodev,noexec,size=1m',
      '/etc/ssh': 'rw,nosuid,nodev,noexec,size=1m',
      '/home/instance': 'rw,nosuid,nodev,noexec,size=256m,uid=100,gid=101,mode=700'
    },
    // Empty HostPort asks Docker for an atomically allocated available port.
    PortBindings: { '22/tcp': [{ HostIp: '0.0.0.0', HostPort: '' }] }
  };
}

export async function createInstance({ ownerId, name, publicKey }) {
  await assertAvailableInstanceName(ownerId, name);
  await ensurePrivateNetwork();
  const internalSsh = await internalSshCredentials();
  const row = await Instance.create({ ownerId, name, hostname: name, networkName: config.INSTANCE_NETWORK_NAME, image: config.INSTANCE_IMAGE, state: 'creating', ssh: { host: config.SSH_PUBLIC_HOST, username: 'instance' } });
  let container;
  try {
    const keyFile = await writeKeyFile(publicKey);
    await row.updateOne({ keyFile });
    container = await docker.createContainer({
      Image: config.INSTANCE_IMAGE,
      name: `mini-aws-${row._id}`,
      Labels: { [label]: 'true', 'com.miniaws.instance-id': String(row._id) },
      ExposedPorts: { '22/tcp': {} },
      Hostname: name,
      NetworkingConfig: { EndpointsConfig: { [config.INSTANCE_NETWORK_NAME]: { Aliases: [name] } } },
      HostConfig: hostConfig(keyFile, internalSsh)
    });
    await row.updateOne({ dockerId: container.id });
    await container.start();
    const hostPort = await readPublishedSshPort(container);
    const details = privateNetworkDetails(await container.inspect());
    return await Instance.findByIdAndUpdate(row._id, { state: 'running', 'ssh.hostPort': hostPort, ...details, lastError: null }, { new: true });
  } catch (error) {
    if (container) await container.remove({ force: true }).catch(() => undefined);
    await Instance.findByIdAndUpdate(row._id, { state: 'error', lastError: error.message });
    throw error;
  }
}

export async function performAction(row, action) {
  if (!row.dockerId) throw Object.assign(new Error('Container is unavailable'), { statusCode: 409 });
  const container = docker.getContainer(row.dockerId);
  // This also makes pre-network instances join when they are next started/restarted.
  await connectContainer(container, row.hostname || row.name);
  if (action === 'start') await container.start();
  else if (action === 'stop') await container.stop({ t: 15 });
  else await container.restart({ t: 15 });
  const info = await container.inspect();
  const details = privateNetworkDetails(info);
  return Instance.findByIdAndUpdate(row._id, { state: info.State.Running ? 'running' : 'stopped', ...details, hostname: row.hostname || row.name, networkName: config.INSTANCE_NETWORK_NAME, lastError: null }, { new: true });
}

export async function deleteInstance(row) {
  await row.updateOne({ state: 'deleting' });
  try {
    if (row.dockerId) await docker.getContainer(row.dockerId).remove({ force: true, v: true }).catch(error => {
      if (error.statusCode !== 404) throw error;
    });
    if (row.keyFile) await fs.rm(row.keyFile, { force: true });
    return Instance.findByIdAndUpdate(row._id, { state: 'deleted', deletedAt: new Date(), lastError: null }, { new: true });
  } catch (error) {
    await row.updateOne({ state: 'error', lastError: error.message });
    throw error;
  }
}
