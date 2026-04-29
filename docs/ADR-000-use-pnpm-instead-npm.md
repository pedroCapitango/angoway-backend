# ADR-000: Use pnpm instead of npm

**Status:** Proposed
**Date:**: 2026-04-29  
**Deciders:** @fevunge
**Consulted:** none 
**Informed:** @pedroCapitango, @DevDario

---

## Context

Update the package manager to pnpm, which is faster and more efficient than npm, especially for monorepos.

## Decision

- **We will install pnpm globally** to manage our JavaScript dependencies.
- **We will replace npm commands with pnpm** in our package.json scripts and documentation.
- **We will reinstall all dependencies** using pnpm to take advantage of its performance benefits.

## Rationale

- Pnpm is significantly faster than npm due to its efficient handling of node_modules and caching.
- Pnpm stores dependencies in a global content-addressable store, which saves disk space and speeds up installations.
- Pnpm evites issues with hoisting and allows for better monorepo management, which is beneficial for our project structure.

## Options Considered

### Option A: [Name] 🟢  (chosen)

**Description:** Change the package manager to pnpm.

**Pros:**
- Way faster installations, especially for large projects.
- More efficient disk space usage due to content-addressable storage.
- Better handling of monorepos and complex dependency trees.

**Cons:**
- Requires developers to install pnpm globally.
- May require updates to documentation and scripts to reflect the change from npm to pnpm.

---

### Option B: [Name] 🛑 (not chosen)

**Description:** Continue using npm as the package manager.

**Pros:**
- No changes needed to developer environment or documentation.
- Familiarity for all developers, as npm is widely used.

**Cons:**
- Slower installation times, especially as the project grows.
- Less efficient disk space usage compared to pnpm.
- Potential issues with hoisting and monorepo management as the project structure evolves.

---

## Consequences

### Positive
- Benefit 1: Faster installation times, improving developer productivity.
- Benefit 2: Reduced disk space usage, especially for large projects with many dependencies.

### Negative / Trade-offs
- Developer onboarding may require an additional step to install pnpm globally.
- Documentation and scripts will need to be updated to reflect the change from npm to pnpm.

### Neutral
- Change in process: developers will need to use pnpm commands instead of npm, but this is a minor adjustment.

## Implementation Notes

> Technical details and considerations for implementing the decision.
1. Update the README and any relevant documentation to instruct developers to install pnpm globally.
2. Replace all npm commands in package.json scripts with their pnpm equivalents.

## References

> [!NOTE]
> none

---

