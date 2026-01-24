export const escapePassword = (password: string): string => {
  return password.replace(/'/g, "''");
};
