# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to security@jargon.dev

## Authentication

Jargon supports JWT-based authentication for production deployments:

- Set `JWT_SECRET` environment variable
- Use `/auth/login` to get tokens
- Include `Authorization: Bearer <token>` header for protected endpoints

## Default Credentials

**Change immediately in production:**
- Username: `admin`
- Password: `admin`