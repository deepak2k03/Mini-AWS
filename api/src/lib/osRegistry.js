export const osRegistry = {
  linux: {
    name: 'Linux',
    supported: true,
    distributions: {
      ubuntu: {
        name: 'Ubuntu',
        versions: {
          '24.04': {
            displayName: 'Ubuntu 24.04 LTS',
            image: 'mini-aws/ubuntu-ssh:24.04',
            provider: 'docker'
          }
        }
      },
      debian: {
        name: 'Debian',
        versions: {
          '13': {
            displayName: 'Debian 13',
            image: 'mini-aws/debian-ssh:13',
            provider: 'docker'
          }
        }
      },
      alpine: {
        name: 'Alpine Linux',
        versions: {
          '3.21': {
            displayName: 'Alpine Linux 3.21',
            image: 'mini-aws/alpine-ssh:3.21',
            provider: 'docker'
          }
        }
      },
      fedora: {
        name: 'Fedora',
        versions: {
          '41': {
            displayName: 'Fedora 41',
            image: 'mini-aws/fedora-ssh:41',
            provider: 'docker'
          }
        }
      },
      rocky: {
        name: 'Rocky Linux',
        versions: {
          '9': {
            displayName: 'Rocky Linux 9',
            image: 'mini-aws/rocky-ssh:9',
            provider: 'docker'
          }
        }
      }
    }
  }
};

/**
 * Validates the OS selection and returns the internal configuration.
 * @param {Object} os - The OS object { type, distribution, version }
 * @returns {Object|null} The resolved OS configuration including the image and provider, or null if invalid.
 */
export function resolveOsConfig(os) {
  if (!os || typeof os !== 'object') return null;
  const { type, distribution, version } = os;
  
  if (!type || !osRegistry[type] || !osRegistry[type].supported) return null;
  if (!distribution || !osRegistry[type].distributions[distribution]) return null;
  
  const dist = osRegistry[type].distributions[distribution];
  if (!version || !dist.versions[version]) return null;
  
  return dist.versions[version];
}
