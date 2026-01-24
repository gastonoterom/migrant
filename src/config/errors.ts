export const seedRequiredError = () => new Error('PASSWORD_SEED environment variable is required');
export const timestampRequiredError = () =>
  new Error('PASSWORD_TIMESTAMP environment variable is required');
