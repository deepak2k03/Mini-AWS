import Docker from 'dockerode';
import { config } from '../config.js';

// For a remote worker, replace socketPath with TLS client options.
export const docker = new Docker({ socketPath: config.DOCKER_SOCKET_PATH });

