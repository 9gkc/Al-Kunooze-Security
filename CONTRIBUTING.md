# Contributing

Thank you for helping improve Al-Kunooze Security.

## Before You Start

- Read the README and this document.
- Review existing issues and open pull requests.
- Keep changes focused and explain the user or security value.

## Development Standards

- Use clear, descriptive names.
- Prefer small, cohesive changes.
- Maintain accessible interfaces.
- Handle data and the DOM safely.
- Never commit secrets, `.env` files, `node_modules`, build output, or personal data.
- Update documentation whenever behavior changes.
- Keep all project content in English.

## Setup

```bash
git clone https://github.com/9gkc/Al-Kunooze-Security.git
cd Al-Kunooze-Security
pnpm install
cp .env.example .env
pnpm dev
```

## Validation

Before opening a pull request, run:

```bash
pnpm check
git diff --check
```

A good pull request describes:
- The problem being solved
- The solution
- Validation performed
- Any known limitations

Screenshots or a short recording are helpful for user-interface changes.

## Scope Boundaries

Do not add intrusive scanning, exploit payloads, credential handling, or any feature that would violate the passive and authorization-first design of this tool.
