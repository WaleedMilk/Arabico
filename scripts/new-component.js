#!/usr/bin/env node
/**
 * Generate a new Svelte component with boilerplate
 *
 * Usage:
 *   node scripts/new-component.js <domain> <ComponentName>
 *   npm run new:component <domain> <ComponentName>
 *
 * Examples:
 *   node scripts/new-component.js reader WordPopup
 *   node scripts/new-component.js review QuizCard
 *   node scripts/new-component.js ui Button
 *
 * Domains:
 *   - reader: Quran reading components (WordToken, AyahDisplay, etc.)
 *   - review: Spaced repetition review components
 *   - navigation: Navigation bars, menus
 *   - audio: Audio players, controls
 *   - ui: Reusable UI elements (buttons, toggles, etc.)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const [, , domain, name] = process.argv;

// Validate arguments
if (!domain || !name) {
	console.log(`
Usage: node scripts/new-component.js <domain> <ComponentName>

Domains:
  - reader      Quran reading components
  - review      Review/flashcard components
  - navigation  Navigation components
  - audio       Audio player components
  - ui          Reusable UI elements

Examples:
  node scripts/new-component.js reader WordPopup
  node scripts/new-component.js review QuizCard
  node scripts/new-component.js ui IconButton
`);
	process.exit(1);
}

// Validate domain
const validDomains = ['reader', 'review', 'navigation', 'audio', 'ui'];
if (!validDomains.includes(domain)) {
	console.error(`Error: Invalid domain "${domain}"`);
	console.error(`Valid domains: ${validDomains.join(', ')}`);
	process.exit(1);
}

// Validate component name (PascalCase)
if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
	console.error(`Error: Component name must be PascalCase (e.g., MyComponent)`);
	console.error(`Got: "${name}"`);
	process.exit(1);
}

// Generate kebab-case class name
const kebabName = name
	.replace(/([a-z])([A-Z])/g, '$1-$2')
	.toLowerCase();

// Component template
const template = `<script lang="ts">
	/**
	 * ${name} Component
	 *
	 * TODO: Add component description
	 */

	// =============================================
	// Props Interface
	// =============================================
	interface Props {
		/** TODO: Document this prop */
		// data: SomeType;
		/** Optional callback when action occurs */
		// onAction?: (result: ActionResult) => void;
	}

	// =============================================
	// Props Destructuring
	// =============================================
	let {}: Props = $props();

	// =============================================
	// Local State
	// =============================================
	// let isLoading = $state(false);

	// =============================================
	// Derived Values
	// =============================================
	// let displayValue = $derived(data.value);

	// =============================================
	// Event Handlers
	// =============================================
	// function handleClick() {
	//   onAction?.({ success: true });
	// }
</script>

<div class="${kebabName}">
	<!-- TODO: Add component content -->
	<p>${name} component</p>
</div>

<style>
	.${kebabName} {
		/* Use CSS custom properties from app.css */
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.${kebabName} {
			/* Smaller padding/font on mobile */
		}
	}
</style>
`;

// Create directory and file
const componentsDir = path.join(process.cwd(), 'src', 'lib', 'components', domain);
const filePath = path.join(componentsDir, `${name}.svelte`);

// Check if file already exists
if (fs.existsSync(filePath)) {
	console.error(`Error: Component already exists at ${filePath}`);
	process.exit(1);
}

// Create directory if it doesn't exist
if (!fs.existsSync(componentsDir)) {
	fs.mkdirSync(componentsDir, { recursive: true });
	console.log(`Created directory: ${componentsDir}`);
}

// Write the file
fs.writeFileSync(filePath, template);

console.log(`
✓ Created component: ${filePath}

Next steps:
1. Add your props to the interface
2. Implement the component logic
3. Add styles using CSS custom properties
4. Test on mobile (375px viewport)

See docs/COMPONENT_GUIDE.md for patterns and best practices.
`);
