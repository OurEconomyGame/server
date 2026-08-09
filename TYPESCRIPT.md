# TypeScript Development Guidelines

Strict type checking is fully enforced across this entire project. All code contributors (humans and AI agents) must adhere to these policies.

## Typing Policies
- **Strict Typing Enforced**: Implicit `any` types are strictly prohibited. Every function parameter, return type, and variable must have a fully specified type.
- **JSDoc Requirements**: All exported functions and methods must include standard JSDoc comments describing parameters, return values, and general behavior.
- **Compiler Validation**: Before proposing or committing any changes, run the TypeScript compiler `bun x tsc --noEmit` to ensure there are no compilation or type validation errors.
