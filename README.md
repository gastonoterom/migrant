# Migrant

A deterministic credential migration tool for managing database users and secrets across environments.

## Prerequisites

- [Bun](https://bun.sh/) runtime

## Installation

```bash
bun install
```

## Usage

```bash
PASSWORD_SEED="your-secret-seed" PASSWORD_TIMESTAMP="1769224697734" bun run start
```

## Determinism

Every operation in migrant is designed to be **idempotent** and **deterministic**:

### Postgres Users

```sql
IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'username') THEN
  CREATE USER "username" WITH PASSWORD 'password';
ELSE
  ALTER USER "username" WITH PASSWORD 'password';
END IF;
```

### Password Generation

Passwords are derived deterministically using PBKDF2.

```typescript
const derivePassword = ({ seed, timestamp, identifier }): string => {
  const salt = `${timestamp}:${identifier}`;
  const key = pbkdf2Sync(seed, salt, 100000, 32, 'sha256');
  return key.toString('hex');
};
```

### AWS Secrets

Secrets are updated non-destructively. The tool reads the current secret JSON, merges in new values, and writes back preserving any existing keys.

## Features

### Current

- **Postgres User Management**: Creates users with secure auto-generated passwords and grants database permissions
- **AWS Secrets Manager**: Updates secrets with new credentials

### Planned

- **ArgoCD Integration**: Restart services after credential updates
- **Postgres User Cleanup**: Schedule deletion of obsolete users

## Environment Variables

| Variable             | Required | Description                                                     |
| -------------------- | -------- | --------------------------------------------------------------- |
| `PASSWORD_SEED`      | Yes      | Secret seed for deterministic password derivation (PBKDF2)      |
| `PASSWORD_TIMESTAMP` | Yes      | Timestamp appended to usernames and used in password generation |
| `CONFIG_FILE`        | No       | Path to config file (defaults to `./migrant.yaml`)              |

## Configuration

Create a `migrant.yaml` file in the project root (or specify a custom path via `CONFIG_FILE`):

```yaml
host: 'localhost'
port: 5432

admin_user: 'postgres'
admin_password: 'postgres'

services:
  - name: my-service
    postgres_user: 'my_service_user'
    environment: production
    databases:
      - 'my_database'
    secrets:
      - container: 'dev/sandbox/my-service/config'
        key: 'DATABASE_URL'
```

### Configuration Fields

| Field            | Type   | Description                   |
| ---------------- | ------ | ----------------------------- |
| `host`           | string | Postgres host                 |
| `port`           | number | Postgres port                 |
| `admin_user`     | string | Admin username for Postgres   |
| `admin_password` | string | Admin password for Postgres   |
| `services`       | array  | List of services to configure |

### Service Fields

| Field           | Type   | Description                             |
| --------------- | ------ | --------------------------------------- |
| `name`          | string | Service name                            |
| `postgres_user` | string | Username to create in Postgres          |
| `environment`   | string | Environment (e.g., production, staging) |
| `databases`     | array  | List of databases to grant access to    |
| `secrets`       | array  | AWS secrets to update (container + key) |
