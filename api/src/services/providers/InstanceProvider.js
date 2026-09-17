export class InstanceProvider {
  /**
   * Provision the actual environment for the given instance.
   * @param {Object} row - The instance document from MongoDB.
   * @param {Object} osConfig - The resolved OS configuration from osRegistry.
   * @param {string} keyFile - Path to the SSH public key file.
   * @param {Object} internalSsh - Internal SSH credentials for the provider network.
   * @returns {Promise<Object>} The updated fields for the instance (e.g. dockerId, ssh hostPort, etc.)
   */
  async create(row, osConfig, keyFile, internalSsh) {
    throw new Error('Not implemented');
  }

  /**
   * Perform a lifecycle action (start, stop, restart) on the instance.
   * @param {Object} row - The instance document from MongoDB.
   * @param {string} action - 'start', 'stop', or 'restart'
   * @returns {Promise<Object>} The updated fields for the instance.
   */
  async performAction(row, action) {
    throw new Error('Not implemented');
  }

  /**
   * Delete the environment for the given instance.
   * @param {Object} row - The instance document from MongoDB.
   * @returns {Promise<void>}
   */
  async delete(row) {
    throw new Error('Not implemented');
  }
}
