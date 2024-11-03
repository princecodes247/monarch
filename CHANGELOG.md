# monarch-orm

## 0.3.0

### Minor Changes

- b27f314: Infer populate output types
- a75bde6: Add objectId type
- a75bde6: Add biomejs for formatting and linting
- 8de74a1: Accept mongodb db as first argument to createDatabase instead of mongodb client
- b27f314: Changed virtuals API
- a75bde6: Add support for schema relations and populate queries

### Patch Changes

- a75bde6: Fix bug where omit happens before original values is passed to virtuals
- a75bde6: Refactor types to embed parser implementation in the class
- a75bde6: Hide schema methods like toData and fromData from call site
- bc13f77: Skip undefined fields during write operations in the toData method

## 0.2.1

### Patch Changes

- a75821a: fix incorrect options for collection methods

## 0.2.0

### Minor Changes

- 8a1f87b: Add schema onUpdate method
- 8a1f87b: Add createdAtDate and updatedAtDate types

## 0.1.4

### Patch Changes

- 6dd7a2c: support basic operators and improve filter types
- e2686df: fix collection types

## 0.1.3

### Patch Changes

- 7a61cc1: improve update functions

## 0.1.2

### Patch Changes

- 35be0c1: Fix minor bugs

## 0.1.1

### Patch Changes

- 53a3fed: Implement sort, fix type inferring issue and refactor structure
