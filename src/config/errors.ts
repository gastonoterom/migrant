export const seedRequiredError = () => new Error('PASSWORD_SEED environment variable is required');
export const clusterPasswordRequiredError = () =>
  new Error('CLUSTER_PASSWORD environment variable is required');
