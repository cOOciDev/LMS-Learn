# Object-Oriented SCSS Architecture

This project uses Object-Oriented CSS (OOCSS) principles with SCSS for maintainable, scalable, and responsive styling.

## Directory Structure

```
styles/
├── main.scss                 # Main entry point
├── abstracts/                # Variables, mixins, functions
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── _functions.scss
├── base/                     # Reset, typography, base styles
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _base.scss
├── layout/                   # Layout components
│   ├── _header.scss
│   ├── _footer.scss
│   ├── _container.scss
│   └── _grid.scss
├── components/               # Reusable UI components
│   ├── _theme-switcher.scss
│   ├── _language-switcher.scss
│   ├── _button.scss
│   ├── _card.scss
│   └── _form.scss
├── pages/                    # Page-specific styles
│   ├── _auth.scss
│   └── _dashboard.scss
└── utilities/                # Helper classes
    ├── _spacing.scss
    ├── _display.scss
    └── _responsive.scss
```

## OOCSS Principles

### 1. Separation of Structure and Skin
- **Structure**: Layout, positioning, dimensions
- **Skin**: Colors, fonts, shadows, borders

### 2. Separation of Container and Content
- Components are independent of their containers
- Use modifiers instead of nesting

### 3. Naming Convention (BEM-like)
```scss
.block { }                    // Main component
.block__element { }           // Element within block
.block--modifier { }          // Modifier variant
```

## Responsive Design

### Breakpoints
- `xs`: 0px (mobile)
- `sm`: 640px (tablet)
- `md`: 768px (small desktop)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large)

### Usage
```scss
// In SCSS files
@include respond-to(md) {
  // Styles for medium screens and up
}

@include respond-below(lg) {
  // Styles for screens below large
}
```

## Component Examples

### Theme Switcher
Simple toggle button that switches between light and dark themes.

```jsx
<ThemeSwitcher />
```

### Buttons
Use OOCSS button classes:

```scss
.btn { }                      // Base button
.btn--primary { }             // Primary variant
.btn--sm { }                  // Small size
```

## Utilities

### Spacing
```html
<div class="m-md">Margin medium</div>
<div class="p-lg">Padding large</div>
<div class="gap-sm">Gap small</div>
```

### Display
```html
<div class="flex-center">Centered flex</div>
<div class="flex-between">Space between</div>
<div class="hide-mobile">Hidden on mobile</div>
```

## Best Practices

1. **Use variables** for colors, spacing, typography
2. **Use mixins** for repeated patterns
3. **Keep components independent** - no container dependencies
4. **Mobile-first** approach for responsive design
5. **Use utilities** for one-off styles
6. **Maintain consistency** with naming conventions

## Integration with Tailwind

This project uses both SCSS and Tailwind CSS:
- **SCSS**: Custom components, layouts, complex styles
- **Tailwind**: Utility classes, rapid prototyping

Both work together seamlessly.

