# Path Resolution in Vite Projects

## Importing Files

Use Vite's `@` alias to import files from the `src` directory:

```javascript
// Instead of relative imports
import SomeComponent from '../../components/SomeComponent';

// Use the '@' alias
import SomeComponent from '@/components/SomeComponent';
```

## Module-Specific Path Resolution

When you need to resolve paths relative to the current module, use `import.meta.url`:

```javascript
// Resolve a path relative to the current module
const modulePath = new URL('./someFile', import.meta.url).pathname;
```

## Best Practices

1. Prefer the `@` alias for imports from the `src` directory
2. Use `import.meta.url` for module-specific path needs
3. Avoid creating custom path resolution utilities
4. Let Vite handle path resolution through its configuration

## Vite Configuration

Check `vite.config.js` for the current path alias configuration:

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
