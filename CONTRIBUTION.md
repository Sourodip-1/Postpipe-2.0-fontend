# Contributing to Postpipe 2.0

Thank you for contributing to Postpipe 2.0. To keep development organized and stable, please follow the workflow below.

## Branching Rules

* Do **not** push directly to the `main` branch.
* All contributions must go through the `local development` branch first.
* Create your own feature branch from `local development`.

Example:

```bash
# Switch to local development
git checkout local development

# Pull latest changes
git pull origin local development

# Create a feature branch
git checkout -b feature/your-feature-name
```

## Development Process

1. Fork the repository (if you are an external contributor).
2. Clone your fork locally.
3. Create a new branch from `local development`.
4. Make your changes.
5. Test your changes locally.
6. Commit with clear messages.
7. Push your branch.
8. Open a Pull Request to the `local development` branch.

## Pull Request Guidelines

Before opening a PR, make sure:

* Your code follows the project structure.
* You tested your changes.
* You did not break existing features.
* Your PR targets `local development` (not `main`).
* You clearly describe what was changed.

## Commit Message Format

Use clear commit messages:

* `feat: add drag and drop section`
* `fix: resolve template save bug`
* `docs: update setup guide`

## Code Style

* Keep code clean and modular.
* Follow existing coding patterns.
* Add comments only where necessary.
* Avoid unnecessary dependencies.

## Reporting Issues

When reporting bugs, include:

* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots (if relevant)
* Browser / device details

## Need Help?

If you have questions, open an issue or start a discussion before making large changes.

We appreciate your contribution to Postpipe 2.0.
