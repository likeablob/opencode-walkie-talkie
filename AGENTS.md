- For component development, use storybook and playwright-cli skill. you can also capture screenshot of the component page then use subagent for visual analysis.
  - You can also use `npm run test` to run storybook tests (play functions in \*.stories.tsx) in headless mode
- Do not edit app/components/ui/\* as they are shadcn/ui components. Only update/add via `npx shadcn` cli
- After implementation changes, run `npm run typecheck && npm run lint && npm run format && npm test` to verify code quality.
- Do not use emojis in tsx and documentations. For icons use lucide.

## Zustand State Management

- **Selector pattern**: Use in React components for optimized re-render
  - `const lang = useAppStore((s) => s.ui.language)` - only re-renders when `language` changes
  - `const state = useAppStore((s) => s)` - re-renders on ANY change (avoid)
- **Direct access**: Use outside React (class instances, useEffect initialization, event handlers)
  - `useAppStore.getState().session.id` - non-reactive, immediate access
  - `useAppStore.setState({ ... })` - direct state update
- **Persist middleware**: Auto-syncs `session.id`, etc. to localStorage
- **DevTools**: Redux DevTools Extension shows state history and action log (store name: "AppStore")
