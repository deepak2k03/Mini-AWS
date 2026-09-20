import { InstanceProvider } from './InstanceProvider.js';
import { config } from '../../config.js';
import { docker } from '../../lib/docker.js';
import { connectContainer, privateNetworkDetails } from '../networkingService.js';

const PORT_ALLOCATION_TIMEOUT_MS = 5_000;
const PORT_ALLOCATION_POLL_MS = 100;
const label = 'com.miniaws.managed';

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

function hostConfig(keyFile, internalSsh) {
  return {
    ReadonlyRootfs: true,
    SecurityOpt: [],
    CapDrop: ['ALL'],
    CapAdd: ['NET_BIND_SERVICE', 'SETUID', 'SETGID', 'CHOWN', 'FOWNER', 'SYS_CHROOT', 'AUDIT_WRITE'],
    PidsLimit: 128,
    Memory: 512 * 1024 * 1024,
    NanoCpus: 500_000_000,
    NetworkMode: config.INSTANCE_NETWORK_NAME,
    Binds: [
      `${keyFile}:/run/secrets/authorized_keys:ro`,
      `${internalSsh.publicKey}:/run/secrets/internal_network_authorized_key:ro`,
      `${internalSsh.privateKey}:/run/secrets/internal_ssh_key:ro`
    ],
    Tmpfs: {
      '/run': 'rw,nosuid,nodev,noexec,size=1m',
      '/etc/ssh': 'rw,nosuid,nodev,noexec,size=1m',
      '/home/instance': 'rw,nosuid,nodev,noexec,size=256m,mode=700'
    },
    PortBindings: { '22/tcp': [{ HostIp: '0.0.0.0', HostPort: '' }] }
  };
}

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execAsync = promisify(exec);

export class DockerProvider extends InstanceProvider {
  async create(row, osConfig, keyFile, internalSsh) {
    const image = osConfig.image;
    
    // Lazy build the image if it doesn't exist
    try {
      await docker.getImage(image).inspect();
    } catch (err) {
      if (err.statusCode === 404 && row.os && row.os.distribution) {
        console.log(`Image ${image} not found. Building it on the fly...`);
        const cwd = path.resolve(process.cwd(), '../instance-image');
        await execAsync(`docker build -t ${image} -f ${row.os.distribution}/Dockerfile .`, { cwd });
        console.log(`Successfully built ${image}`);
      } else if (err.statusCode === 404) {
        throw new Error(`Docker image ${image} not found and cannot be built automatically.`);
      } else {
        throw err;
      }
    }

    const container = await docker.createContainer({
      Image: image,
      name: `mini-aws-${row._id}`,
      Labels: { [label]: 'true', 'com.miniaws.instance-id': String(row._id) },
      ExposedPorts: { '22/tcp': {} },
      Hostname: row.hostname || row.name,
      NetworkingConfig: { EndpointsConfig: { [config.INSTANCE_NETWORK_NAME]: { Aliases: [row.name] } } },
      HostConfig: hostConfig(keyFile, internalSsh)
    });
    
    await container.start();
    const hostPort = await readPublishedSshPort(container);
    const details = privateNetworkDetails(await container.inspect());
    
    return {
      dockerId: container.id,
      state: 'running',
      'ssh.hostPort': hostPort,
      ...details,
      lastError: null
    };
  }

  async performAction(row, action) {
    if (!row.dockerId) throw Object.assign(new Error('Container is unavailable'), { statusCode: 409 });
    const container = docker.getContainer(row.dockerId);
    
    try {
      await connectContainer(container, row.hostname || row.name);
      if (action === 'start') await container.start();
      else if (action === 'stop') await container.stop({ t: 15 });
      else await container.restart({ t: 15 });
      
      const info = await container.inspect();
      const details = privateNetworkDetails(info);
      
      return {
        state: info.State.Running ? 'running' : 'stopped',
        ...details,
        hostname: row.hostname || row.name,
        networkName: config.INSTANCE_NETWORK_NAME,
        lastError: null
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return { state: 'error', lastError: 'Container no longer exists in Docker.' };
      }
      if (action === 'stop' && error.statusCode === 304) {
        return { state: 'stopped', lastError: null };
      }
      throw error;
    }
  }

  async delete(row) {
    if (!row.dockerId) return;
    try {
      await docker.getContainer(row.dockerId).remove({ force: true, v: true });
    } catch (error) {
      if (error.statusCode !== 404) throw error;
    }
  }
}
