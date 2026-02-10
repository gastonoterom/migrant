const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/;

export const validateUsername = (username: string): void => {
  if (!SAFE_IDENTIFIER_REGEX.test(username)) {
    throw new Error(`Invalid username: "${username}" - only a-z, A-Z, 0-9, _ allowed`);
  }
};

export const validatePassword = (password: string): void => {
  if (!SAFE_IDENTIFIER_REGEX.test(password)) {
    throw new Error(
      `Invalid password: contains disallowed characters - only a-z, A-Z, 0-9, _ allowed`
    );
  }
};

export const validateCredentials = (username: string, password: string): void => {
  validateUsername(username);
  validatePassword(password);
};
