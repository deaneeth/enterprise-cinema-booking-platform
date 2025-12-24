# Contributing to Cinema Booking System

## Welcome

Thank you for contributing to the Cinema Booking System project! This document provides guidelines for team collaboration.

## Team Structure

The project is divided among 8 team members, each responsible for specific features:

### Member Responsibilities

- **Member 1**: User authentication, JWT, profile management, CI/CD setup
- **Member 2**: Cinema entities, cinema management, location features
- **Member 3**: Movie catalog, movie components, search and filtering
- **Member 4**: Showtime scheduling, time management
- **Member 5**: Booking system, QR codes, WebSocket (with Member 6)
- **Member 6**: Seat management, WebSocket (with Member 5)
- **Member 7**: Payment processing, email notifications
- **Member 8**: Reviews and ratings system

## Development Workflow

### 1. Branching Strategy

- `main` - Production-ready code
- `dev` - Development branch
- `feature/<member-name>/<feature-name>` - Individual feature branches

### 2. Commit Messages

Follow this format:

```
<type>: <subject>

<body>
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example: `feat: Add user authentication endpoint`

### 3. Pull Request Process

1. Create a feature branch from `dev`
2. Implement your changes
3. Write/update tests for your changes
4. Ensure all tests pass
5. Create a pull request to `dev`
6. Request review from at least one team member
7. Address review comments
8. Merge after approval

### 4. Code Standards

- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write unit tests for new features

### 5. Testing Requirements

Each member must test their respective entity:

- **Unit tests**: Test individual functions and methods
- **Integration tests**: Test API endpoints and database interactions
- **E2E tests**: Test complete user workflows

### 6. Communication

- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for questions and ideas
- Tag relevant team members in comments
- Update issue status regularly

### 7. Before Submitting Code

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Code follows project style guidelines
- [ ] Documentation is updated
- [ ] Environment variables are added to `.env.example`
- [ ] No sensitive data is committed

## API Development Guidelines

- Use RESTful conventions
- Return appropriate HTTP status codes
- Include error messages in responses
- Validate all inputs
- Use middleware for authentication

## Database Guidelines

- Define clear model relationships
- Use migrations for schema changes
- Add indexes for frequently queried fields
- Write seeders for test data

## Need Help?

- Check existing documentation
- Ask in GitHub Discussions
- Contact Member 1 for setup issues
- Contact feature owner for specific questions

## Code of Conduct

- Be respectful and professional
- Provide constructive feedback
- Help teammates when needed
- Communicate openly about blockers
- Meet agreed deadlines

Thank you for your contributions!
