# UI Library Guide for ZapDev

## Migration from Radix UI to Modern Alternatives

**IMPORTANT**: Do not use deprecated Radix UI components. Use shadcn/ui, DaisyUI, or Headless UI instead.

## Primary UI Libraries

### 1. shadcn/ui (Recommended)
- **Installation**: `npx shadcn@latest init` then `npx shadcn@latest add [component]`
- **Use for**: High-quality, accessible components with Radix UI primitives
- **Documentation**: https://ui.shadcn.com/
- **Benefits**: TypeScript-first, customizable, copy-paste components

### 2. DaisyUI (Styled Components)
- **Installation**: Already integrated with Tailwind CSS
- **Use for**: Basic UI components with built-in styling
- **Documentation**: https://daisyui.com/components/

### 3. Headless UI (Behavior Components) 
- **Installation**: `npm install @headlessui/react`
- **Use for**: Complex interactive components needing custom styling
- **Documentation**: https://headlessui.com/

## Component Migration Map

### ❌ DEPRECATED - Do Not Use These Radix Components:
```tsx
// DON'T USE THESE
import * from "@radix-ui/react-dialog"
import * from "@radix-ui/react-dropdown-menu"
import * from "@radix-ui/react-popover"
// ... any @radix-ui imports
```

### ✅ USE THESE INSTEAD:

#### Buttons

**shadcn/ui Button:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

**DaisyUI Button:**
```tsx
// DaisyUI Button
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-outline">Outline Button</button>
<button className="btn btn-ghost">Ghost Button</button>
<button className="btn btn-link">Link Button</button>

// Sizes
<button className="btn btn-xs">Extra Small</button>
<button className="btn btn-sm">Small</button>
<button className="btn btn-md">Medium (default)</button>
<button className="btn btn-lg">Large</button>

// States
<button className="btn btn-primary loading">Loading</button>
<button className="btn btn-disabled">Disabled</button>
```

#### Modal/Dialog

**shadcn/ui Dialog:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Dialog content */}
    </div>
  </DialogContent>
</Dialog>
```

**DaisyUI Modal:**
```tsx
// DaisyUI Modal
import { useState } from 'react'

function Modal() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button className="btn" onClick={() => setIsOpen(true)}>
        Open Modal
      </button>
      
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Modal Title</h3>
            <p className="py-4">Modal content goes here</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}
```

#### Dropdown Menu
```tsx
// DaisyUI Dropdown
<div className="dropdown">
  <div tabIndex={0} role="button" className="btn m-1">
    Click
  </div>
  <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>

// Or Headless UI for complex dropdowns
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

<Menu>
  <MenuButton className="btn">Options</MenuButton>
  <MenuItems className="menu bg-base-100 rounded-box w-52 p-2 shadow">
    <MenuItem>
      {({ focus }) => (
        <a className={`${focus ? 'bg-base-200' : ''}`} href="/account-settings">
          Account settings
        </a>
      )}
    </MenuItem>
    <MenuItem>
      {({ focus }) => (
        <a className={`${focus ? 'bg-base-200' : ''}`} href="/support">
          Support
        </a>
      )}
    </MenuItem>
  </MenuItems>
</Menu>
```

#### Form Controls

**shadcn/ui Form Components:**
```tsx
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// Input
<div className="grid w-full max-w-sm items-center gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="Email" />
</div>

// Checkbox
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>

// Radio Group
<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <Label htmlFor="option-one">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <Label htmlFor="option-two">Option Two</Label>
  </div>
</RadioGroup>

// Select
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>

// Switch
<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

**DaisyUI Form Controls:**
```tsx
// Checkbox
<input type="checkbox" className="checkbox" />
<input type="checkbox" className="checkbox checkbox-primary" />
<input type="checkbox" className="checkbox checkbox-secondary" />

// Radio
<input type="radio" name="radio-1" className="radio" />
<input type="radio" name="radio-1" className="radio radio-primary" />

// Toggle/Switch
<input type="checkbox" className="toggle" />
<input type="checkbox" className="toggle toggle-primary" />

// Select
<select className="select select-bordered w-full max-w-xs">
  <option disabled selected>Pick your favorite Simpson</option>
  <option>Homer</option>
  <option>Marge</option>
  <option>Bart</option>
  <option>Lisa</option>
  <option>Maggie</option>
</select>

// Range Slider
<input type="range" min={0} max="100" value="40" className="range" />
```

#### Tabs
```tsx
// DaisyUI Tabs
<div className="tabs">
  <a className="tab tab-active">Tab 1</a>
  <a className="tab">Tab 2</a>
  <a className="tab">Tab 3</a>
</div>

// Or Headless UI for complex tab behavior
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'

<TabGroup>
  <TabList className="tabs">
    <Tab className="tab">Tab 1</Tab>
    <Tab className="tab">Tab 2</Tab>
    <Tab className="tab">Tab 3</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Content 1</TabPanel>
    <TabPanel>Content 2</TabPanel>
    <TabPanel>Content 3</TabPanel>
  </TabPanels>
</TabGroup>
```

#### Toast/Alert
```tsx
// DaisyUI Alert
<div className="alert">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  <span>New software update available.</span>
</div>

<div className="alert alert-success">
  <span>Your purchase has been confirmed!</span>
</div>

<div className="alert alert-warning">
  <span>Warning: Invalid email address!</span>
</div>

<div className="alert alert-error">
  <span>Error! Task failed successfully.</span>
</div>
```

#### Tooltip
```tsx
// DaisyUI Tooltip
<div className="tooltip" data-tip="hello">
  <button className="btn">Hover me</button>
</div>

<div className="tooltip tooltip-right" data-tip="hello">
  <button className="btn">Hover me</button>
</div>
```

#### Progress Bar
```tsx
// DaisyUI Progress
<progress className="progress w-56" value={0} max="100"></progress>
<progress className="progress progress-primary w-56" value="10" max="100"></progress>
<progress className="progress progress-secondary w-56" value="20" max="100"></progress>
```

#### Loading States
```tsx
// DaisyUI Loading
<span className="loading loading-spinner"></span>
<span className="loading loading-dots"></span>
<span className="loading loading-ring"></span>
<span className="loading loading-ball"></span>
<span className="loading loading-bars"></span>
<span className="loading loading-infinity"></span>

// Different sizes
<span className="loading loading-spinner loading-xs"></span>
<span className="loading loading-spinner loading-sm"></span>
<span className="loading loading-spinner loading-md"></span>
<span className="loading loading-spinner loading-lg"></span>
```

## Complex Components (Use Headless UI)

### Popover
```tsx
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'

<Popover>
  <PopoverButton className="btn">Open popover</PopoverButton>
  <PopoverPanel className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <h2 className="card-title">Popover content</h2>
      <p>Your popover content goes here</p>
    </div>
  </PopoverPanel>
</Popover>
```

### Combobox (Autocomplete)
```tsx
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useState } from 'react'

function AutoComplete() {
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [query, setQuery] = useState('')

  const people = [
    { id: 1, name: 'Durward Reynolds' },
    { id: 2, name: 'Kenton Towne' },
    { id: 3, name: 'Therese Wunsch' },
  ]

  const filteredPeople = query === ''
    ? people
    : people.filter((person) =>
        person.name.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <Combobox value={selectedPerson} onChange={setSelectedPerson}>
      <ComboboxInput
        className="input input-bordered w-full"
        displayValue={(person) => person?.name}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ComboboxOptions className="menu bg-base-100 rounded-box shadow">
        {filteredPeople.map((person) => (
          <ComboboxOption key={person.id} value={person}>
            {({ focus, selected }) => (
              <li className={`${focus ? 'bg-base-200' : ''} ${selected ? 'bg-primary text-primary-content' : ''}`}>
                <a>{person.name}</a>
              </li>
            )}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  )
}
```

## Theme Integration

DaisyUI works with your existing Tailwind setup and offers multiple themes:

```tsx
// Set theme on html element
<html data-theme="light">
<html data-theme="dark">
<html data-theme="cupcake">
<html data-theme="bumblebee">
// ... many more themes available
```

## Installation Commands

Add to your project:

```bash
# shadcn/ui (recommended) - Initialize first, then add components
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
# ... add components as needed

# DaisyUI (already in your tailwind.config)
npm install -D daisyui@latest

# Headless UI for complex components
npm install @headlessui/react

# Optional: Heroicons for consistent icons
npm install @heroicons/react
```

## Best Practices

1. **Use shadcn/ui for**: High-quality, accessible components with full TypeScript support (recommended)
2. **Use DaisyUI for**: Simple styled components when you need quick styling without customization
3. **Use Headless UI for**: Complex interactions when you need full control over styling
4. **Combine libraries**: Mix shadcn/ui with DaisyUI classes or use Headless UI for behavior
5. **Always prefer**: These modern alternatives over deprecated Radix UI
6. **Component priority**: shadcn/ui > DaisyUI > Headless UI > custom implementation
7. **Testing**: All libraries offer excellent accessibility and React 19 compatibility

## Migration Priority

1. **High Priority**: Dialog, Dropdown, Popover, Tabs (most commonly used)
2. **Medium Priority**: Form controls, Progress, Tooltip
3. **Low Priority**: Advanced components like Accordion, Navigation Menu

Remember: shadcn/ui, DaisyUI, and Headless UI provide better performance, smaller bundle size, and active maintenance compared to Radix UI. shadcn/ui is recommended for most use cases due to its excellent TypeScript support and component quality.