# Radix UI Migration Plan

## Current Usage Analysis

Your codebase uses 31 files with Radix UI components. Here's the migration strategy:

## Phase 1: High Priority (Most Used Components)

### 1. Slot Component (3 uses)
**Current**: `@radix-ui/react-slot`
**Replacement**: Use React's built-in `forwardRef` and `cloneElement`

```tsx
// Old Radix approach
import { Slot } from "@radix-ui/react-slot"

// New approach - Custom implementation
import { forwardRef, cloneElement, isValidElement } from 'react'

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const Slot = forwardRef<HTMLElement, SlotProps>(({ asChild, children, ...props }, ref) => {
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      ...children.props,
      ref,
    });
  }
  return <span ref={ref} {...props}>{children}</span>;
});
```

### 2. Label Component (2 uses)
**Current**: `@radix-ui/react-label`
**Replacement**: DaisyUI with semantic HTML

```tsx
// Old
import * as LabelPrimitive from "@radix-ui/react-label"

// New
<label className="label">
  <span className="label-text">Your Label</span>
</label>

// Or for form inputs
<div className="form-control">
  <label className="label">
    <span className="label-text">Email</span>
  </label>
  <input type="email" className="input input-bordered" />
</div>
```

## Phase 2: Dialog & Overlay Components

### Dialog/Modal
**Current**: `@radix-ui/react-dialog`
**Replacement**: DaisyUI Modal

```tsx
// Replace all dialog components with DaisyUI modal
<div className="modal modal-open">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Modal Title</h3>
    <p className="py-4">Content</p>
    <div className="modal-action">
      <button className="btn">Close</button>
    </div>
  </div>
</div>
```

### Alert Dialog
**Current**: `@radix-ui/react-alert-dialog`
**Replacement**: DaisyUI Modal with alert styling

```tsx
<div className="modal modal-open">
  <div className="modal-box">
    <div className="alert alert-warning">
      <span>Are you sure you want to delete this item?</span>
    </div>
    <div className="modal-action">
      <button className="btn btn-error">Delete</button>
      <button className="btn">Cancel</button>
    </div>
  </div>
</div>
```

### Popover
**Current**: `@radix-ui/react-popover`
**Replacement**: Headless UI Popover

```tsx
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'

<Popover>
  <PopoverButton className="btn">Options</PopoverButton>
  <PopoverPanel className="card bg-base-100 shadow-xl">
    <div className="card-body">Content</div>
  </PopoverPanel>
</Popover>
```

## Phase 3: Form Components

### Checkbox
**Current**: `@radix-ui/react-checkbox`
**Replacement**: DaisyUI Checkbox

```tsx
// Old complex Radix implementation
// New simple DaisyUI
<input type="checkbox" className="checkbox checkbox-primary" />
<label className="label">
  <span className="label-text">Remember me</span>
</label>
```

### Radio Group
**Current**: `@radix-ui/react-radio-group`
**Replacement**: DaisyUI Radio

```tsx
<div className="form-control">
  <label className="label cursor-pointer">
    <span className="label-text">Option 1</span>
    <input type="radio" name="radio-group" className="radio radio-primary" />
  </label>
</div>
```

### Switch
**Current**: `@radix-ui/react-switch`
**Replacement**: DaisyUI Toggle

```tsx
<input type="checkbox" className="toggle toggle-primary" />
```

### Select
**Current**: `@radix-ui/react-select`
**Replacement**: DaisyUI Select or Headless UI Listbox

```tsx
// Simple select
<select className="select select-bordered">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Complex select with search
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
```

### Slider
**Current**: `@radix-ui/react-slider`
**Replacement**: DaisyUI Range

```tsx
<input type="range" min="0" max="100" className="range range-primary" />
```

## Phase 4: Navigation Components

### Tabs
**Current**: `@radix-ui/react-tabs`
**Replacement**: DaisyUI Tabs or Headless UI Tab

```tsx
// Simple tabs
<div className="tabs tabs-bordered">
  <a className="tab tab-active">Tab 1</a>
  <a className="tab">Tab 2</a>
</div>

// Complex tabs with panels
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
```

### Dropdown Menu
**Current**: `@radix-ui/react-dropdown-menu`
**Replacement**: DaisyUI Dropdown

```tsx
<div className="dropdown">
  <div tabIndex={0} role="button" className="btn">Click</div>
  <ul className="dropdown-content menu bg-base-100 rounded-box shadow">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>
```

### Navigation Menu
**Current**: `@radix-ui/react-navigation-menu`
**Replacement**: DaisyUI Navbar

```tsx
<div className="navbar bg-base-100">
  <div className="navbar-start">
    <a className="btn btn-ghost text-xl">Brand</a>
  </div>
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      <li><a>Item 1</a></li>
      <li><a>Item 2</a></li>
    </ul>
  </div>
</div>
```

## Phase 5: Utility Components

### Tooltip
**Current**: `@radix-ui/react-tooltip`
**Replacement**: DaisyUI Tooltip

```tsx
<div className="tooltip" data-tip="Tooltip text">
  <button className="btn">Hover me</button>
</div>
```

### Progress
**Current**: `@radix-ui/react-progress`
**Replacement**: DaisyUI Progress

```tsx
<progress className="progress progress-primary" value="70" max="100"></progress>
```

### Avatar
**Current**: `@radix-ui/react-avatar`
**Replacement**: DaisyUI Avatar

```tsx
<div className="avatar">
  <div className="w-24 rounded-full">
    <img src="avatar.jpg" alt="Avatar" />
  </div>
</div>

// With placeholder
<div className="avatar placeholder">
  <div className="bg-neutral text-neutral-content rounded-full w-24">
    <span className="text-3xl">K</span>
  </div>
</div>
```

### Separator
**Current**: `@radix-ui/react-separator`
**Replacement**: DaisyUI Divider

```tsx
<div className="divider">OR</div>
<div className="divider divider-horizontal">OR</div>
```

### Scroll Area
**Current**: `@radix-ui/react-scroll-area`
**Replacement**: CSS or custom scrollbar styling

```tsx
// Use regular div with custom scrollbar
<div className="h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
  {/* Content */}
</div>
```

### Collapsible
**Current**: `@radix-ui/react-collapsible`
**Replacement**: DaisyUI Collapse

```tsx
<div className="collapse bg-base-200">
  <input type="checkbox" />
  <div className="collapse-title text-xl font-medium">
    Click to expand
  </div>
  <div className="collapse-content">
    <p>Content goes here</p>
  </div>
</div>
```

### Accordion
**Current**: `@radix-ui/react-accordion`
**Replacement**: DaisyUI Collapse (multiple)

```tsx
<div className="space-y-2">
  <div className="collapse collapse-arrow bg-base-200">
    <input type="radio" name="accordion" />
    <div className="collapse-title">Section 1</div>
    <div className="collapse-content">Content 1</div>
  </div>
  <div className="collapse collapse-arrow bg-base-200">
    <input type="radio" name="accordion" />
    <div className="collapse-title">Section 2</div>
    <div className="collapse-content">Content 2</div>
  </div>
</div>
```

## Migration Steps

1. **Install dependencies**:
   ```bash
   npm install @headlessui/react
   npm install -D daisyui@latest
   ```

2. **Update Tailwind config** to include DaisyUI:
   ```js
   module.exports = {
     plugins: [require("daisyui")],
   }
   ```

3. **Create wrapper components** for complex Radix replacements

4. **Update imports** file by file, starting with most used components

5. **Test thoroughly** - DaisyUI/Headless UI have better accessibility but different APIs

6. **Remove Radix dependencies** once migration is complete

## Benefits After Migration

- **Smaller bundle size**: DaisyUI + Headless UI are more lightweight
- **Better performance**: Less JavaScript overhead
- **Active maintenance**: Both libraries are actively developed
- **Better React 19 compatibility**: Built for modern React
- **Easier theming**: DaisyUI's theme system is more flexible
- **Consistent design**: DaisyUI provides design consistency out of the box

## Timeline Estimate

- **Phase 1**: 1-2 days (Slot, Label)
- **Phase 2**: 3-4 days (Dialogs, Popovers)
- **Phase 3**: 2-3 days (Form components)
- **Phase 4**: 2-3 days (Navigation)
- **Phase 5**: 1-2 days (Utilities)
- **Testing & cleanup**: 2-3 days

**Total**: ~2 weeks for complete migration