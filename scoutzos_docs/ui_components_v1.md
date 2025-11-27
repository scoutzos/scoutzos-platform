# ScoutzOS UI Components Specification v1
## Reusable Component Library

**Last Updated:** November 27, 2025  
**Framework:** React (Next.js)  
**Styling:** Tailwind CSS

---

## Design System Foundation

### Colors

```css
/* Primary */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;
--primary-600: #0284c7;
--primary-700: #0369a1;

/* Success */
--success-500: #22c55e;

/* Warning */
--warning-500: #f59e0b;

/* Error */
--error-500: #ef4444;

/* Neutral */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;
```

### Typography

```css
/* Headings */
h1: text-3xl font-bold (30px)
h2: text-2xl font-semibold (24px)
h3: text-xl font-semibold (20px)
h4: text-lg font-medium (18px)

/* Body */
body: text-base (16px)
small: text-sm (14px)
tiny: text-xs (12px)
```

### Spacing Scale

```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px
```

---

## Layout Components

### AppShell

Main application layout with sidebar and header.

```tsx
<AppShell>
  <Sidebar />
  <Header />
  <main>{children}</main>
</AppShell>
```

### Sidebar

Navigation sidebar with collapsible sections.

Props:
- `collapsed`: boolean
- `onToggle`: () => void

### Header

Top header with search, notifications, user menu.

Props:
- `title`: string
- `breadcrumbs`: Breadcrumb[]

### PageHeader

Standard page header with title and actions.

```tsx
<PageHeader
  title="Properties"
  subtitle="Manage your rental properties"
  actions={<Button>Add Property</Button>}
/>
```

### Container

Content container with max-width.

Props:
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'

---

## Data Display Components

### DataTable

Sortable, filterable data table with pagination.

```tsx
<DataTable
  columns={columns}
  data={data}
  pagination
  sortable
  selectable
  onRowClick={(row) => {}}
/>
```

Props:
- `columns`: Column[]
- `data`: any[]
- `pagination`: boolean
- `pageSize`: number
- `sortable`: boolean
- `selectable`: boolean
- `loading`: boolean
- `emptyState`: ReactNode
- `onRowClick`: (row) => void
- `onSelectionChange`: (rows) => void

### Card

Content card container.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>{content}</CardContent>
  <CardFooter>{actions}</CardFooter>
</Card>
```

### StatCard

Metric display card.

```tsx
<StatCard
  title="Total Revenue"
  value="$12,450"
  change="+12%"
  changeType="positive"
  icon={DollarIcon}
/>
```

### Badge

Status badge.

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Overdue</Badge>
```

Variants: `default`, `success`, `warning`, `error`, `info`

### Avatar

User/entity avatar.

```tsx
<Avatar
  src="/path/to/image.jpg"
  fallback="JD"
  size="md"
/>
```

Sizes: `xs`, `sm`, `md`, `lg`, `xl`

### EmptyState

Empty state placeholder.

```tsx
<EmptyState
  icon={BuildingIcon}
  title="No properties yet"
  description="Add your first property to get started."
  action={<Button>Add Property</Button>}
/>
```

### Skeleton

Loading skeleton.

```tsx
<Skeleton className="h-4 w-full" />
<Skeleton className="h-12 w-12 rounded-full" />
```

---

## Form Components

### Input

Text input field.

```tsx
<Input
  label="Property Name"
  placeholder="Enter name"
  error="Name is required"
  required
/>
```

### Textarea

Multi-line text input.

```tsx
<Textarea
  label="Description"
  rows={4}
/>
```

### Select

Dropdown select.

```tsx
<Select
  label="Property Type"
  options={[
    { value: 'sfr', label: 'Single Family' },
    { value: 'duplex', label: 'Duplex' },
  ]}
/>
```

### Checkbox

Checkbox input.

```tsx
<Checkbox
  label="I agree to terms"
  checked={checked}
  onChange={setChecked}
/>
```

### RadioGroup

Radio button group.

```tsx
<RadioGroup
  label="Payment Method"
  options={[
    { value: 'ach', label: 'Bank Transfer' },
    { value: 'card', label: 'Credit Card' },
  ]}
/>
```

### Switch

Toggle switch.

```tsx
<Switch
  label="Enable notifications"
  checked={enabled}
  onChange={setEnabled}
/>
```

### DatePicker

Date picker input.

```tsx
<DatePicker
  label="Move-in Date"
  value={date}
  onChange={setDate}
/>
```

### FileUpload

File upload component.

```tsx
<FileUpload
  label="Upload Documents"
  accept=".pdf,.jpg,.png"
  multiple
  onUpload={handleUpload}
/>
```

### FormSection

Form section with title.

```tsx
<FormSection
  title="Property Details"
  description="Basic information about the property"
>
  {fields}
</FormSection>
```

---

## Feedback Components

### Button

Action button.

```tsx
<Button variant="primary" size="md" loading={isLoading}>
  Save
</Button>
```

Variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`
Sizes: `xs`, `sm`, `md`, `lg`

### Toast

Toast notifications.

```tsx
toast.success('Property saved successfully');
toast.error('Failed to save property');
toast.info('Processing...');
```

### Alert

Alert banner.

```tsx
<Alert variant="warning">
  <AlertTitle>Lease Expiring Soon</AlertTitle>
  <AlertDescription>This lease expires in 30 days.</AlertDescription>
</Alert>
```

### Modal

Modal dialog.

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Confirm Delete"
>
  {content}
  <ModalFooter>
    <Button variant="outline" onClick={handleClose}>Cancel</Button>
    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
  </ModalFooter>
</Modal>
```

### ConfirmDialog

Confirmation dialog.

```tsx
<ConfirmDialog
  open={isOpen}
  title="Delete Property?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  onConfirm={handleDelete}
  onCancel={handleClose}
/>
```

### Progress

Progress bar.

```tsx
<Progress value={75} max={100} />
```

### Spinner

Loading spinner.

```tsx
<Spinner size="md" />
```

---

## Navigation Components

### Tabs

Tab navigation.

```tsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="financials">Financials</TabsTrigger>
  </TabsList>
  <TabsContent value="details">{detailsContent}</TabsContent>
  <TabsContent value="financials">{financialsContent}</TabsContent>
</Tabs>
```

### Breadcrumb

Breadcrumb navigation.

```tsx
<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/properties">Properties</BreadcrumbItem>
  <BreadcrumbItem>123 Main St</BreadcrumbItem>
</Breadcrumb>
```

### Stepper

Step progress indicator.

```tsx
<Stepper
  steps={['Details', 'Tenant', 'Terms', 'Review']}
  currentStep={2}
/>
```

### Dropdown

Dropdown menu.

```tsx
<Dropdown>
  <DropdownTrigger>
    <Button variant="ghost">Actions</Button>
  </DropdownTrigger>
  <DropdownContent>
    <DropdownItem onClick={handleEdit}>Edit</DropdownItem>
    <DropdownItem onClick={handleDelete}>Delete</DropdownItem>
  </DropdownContent>
</Dropdown>
```

---

## Domain-Specific Components

### PropertyCard

Property summary card.

```tsx
<PropertyCard
  property={property}
  onClick={() => navigate(`/properties/${property.id}`)}
/>
```

### DealCard

Deal summary card for swipe interface.

```tsx
<DealCard
  deal={deal}
  matchScore={85}
  onSwipeLeft={() => {}}
  onSwipeRight={() => {}}
/>
```

### TenantCard

Tenant summary card.

```tsx
<TenantCard
  tenant={tenant}
  showBalance
/>
```

### LeaseTimeline

Lease timeline visualization.

```tsx
<LeaseTimeline
  startDate={lease.startDate}
  endDate={lease.endDate}
  currentDate={new Date()}
/>
```

### RentLedger

Rent ledger table with running balance.

```tsx
<RentLedger
  transactions={transactions}
  showBalance
/>
```

### WorkOrderStatus

Work order status stepper.

```tsx
<WorkOrderStatus
  status="in_progress"
  steps={['New', 'Assigned', 'In Progress', 'Complete']}
/>
```

### MatchScore

Match score badge.

```tsx
<MatchScore score={85} size="lg" />
```

### MetricCard

Financial metric card.

```tsx
<MetricCard
  label="Cap Rate"
  value="7.2%"
  benchmark="6.5%"
  status="above"
/>
```

---

## Notes

- All components use Tailwind CSS for styling
- Components should be accessible (WCAG 2.1 AA)
- Support dark mode where applicable
- Mobile-responsive by default
- Use shadcn/ui as base where possible
