# Portfolio Page - Charts and Holdings Table Documentation

## Overview
This document explains how the portfolio page charts are plotted and how the holdings table layout works in the Travesting Money Admin application.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Chart Implementation](#chart-implementation)
3. [Holdings Table Layout](#holdings-table-layout)
4. [Data Flow](#data-flow)
5. [Styling and Responsive Design](#styling-and-responsive-design)
6. [Key Components](#key-components)

---

## Architecture Overview

The portfolio page uses **Chart.js** for data visualization and **Ionic Framework** components for the UI. The page displays three pie charts and a comprehensive holdings table with pagination and search functionality.

### Technology Stack
- **Chart.js**: For rendering pie charts
- **Ionic Framework**: For UI components (cards, buttons, chips, badges)
- **Angular**: For component logic and data binding
- **TypeScript**: For type-safe code

---

## Chart Implementation

### Chart Initialization

All charts are initialized using `@ViewChild` decorators to get references to canvas elements:

```typescript
@ViewChild('sectorChart', { static: false }) sectorChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('marketCapChart', { static: false }) marketCapChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('assetChart', { static: false }) assetChartRef!: ElementRef<HTMLCanvasElement>;
```

### Chart Generation Flow

1. **Data Loading**: Holdings are loaded from Firestore via `UserService.getHoldings()`
2. **Filtering**: Holdings are filtered based on search criteria
3. **Chart Generation**: `generateCharts()` is called which triggers all three chart generators
4. **Chart Updates**: Charts are regenerated whenever filters change

### 1. Sector-wise Allocation Chart

**Purpose**: Shows portfolio allocation by sector (Financial, Technology, Energy, etc.)

**Data Processing**:
```typescript
generateSectorChart() {
  // Step 1: Aggregate percentages by sector
  const sectorMap = new Map<string, number>();
  this.filteredHoldings.forEach((holding) => {
    const current = sectorMap.get(holding.sector) || 0;
    sectorMap.set(holding.sector, current + holding.percentageOfHoldings);
  });

  // Step 2: Extract labels and data
  const labels = Array.from(sectorMap.keys());
  const data = Array.from(sectorMap.values());
  const colors = this.generateColors(labels.length);
}
```

**Chart Configuration**:
- **Type**: Pie Chart
- **Data Source**: `holding.sector` field aggregated by `percentageOfHoldings`
- **Colors**: Dynamically generated from a color palette
- **Tooltip**: Shows sector name and percentage (e.g., "Financial: 15.5%")
- **Legend**: Positioned at bottom with point style

**Example Output**:
- Financial: 25%
- Technology: 15%
- Energy: 12%
- Healthcare: 10%
- ... (other sectors)

---

### 2. Market Capitalization Chart

**Purpose**: Shows portfolio allocation by market cap categories (Large Cap, Mid Cap, Small Cap)

**Data Processing Logic**:
```typescript
generateMarketCapChart() {
  const capMap = new Map<string, number>();
  
  this.filteredHoldings.forEach((holding) => {
    // Priority 1: Use actual marketCapitalization field if available
    let capCategory = holding.marketCapitalization || 'Small Cap';
    
    // Priority 2: Fallback to percentage-based calculation
    if (!holding.marketCapitalization) {
      if (holding.percentageOfHoldings >= 5) {
        capCategory = 'Large Cap';
      } else if (holding.percentageOfHoldings >= 2) {
        capCategory = 'Mid Cap';
      } else {
        capCategory = 'Small Cap';
      }
    }
    
    const current = capMap.get(capCategory) || 0;
    capMap.set(capCategory, current + holding.percentageOfHoldings);
  });
}
```

**Market Cap Classification**:
- **Large Cap**: `marketCapitalization === 'Large Cap'` OR `percentageOfHoldings >= 5%`
- **Mid Cap**: `marketCapitalization === 'Mid Cap'` OR `2% <= percentageOfHoldings < 5%`
- **Small Cap**: `marketCapitalization === 'Small Cap'` OR `percentageOfHoldings < 2%`

**Chart Configuration**:
- **Type**: Pie Chart
- **Fixed Colors**: 
  - Large Cap: `#FF6384` (Red)
  - Mid Cap: `#36A2EB` (Blue)
  - Small Cap: `#FFCE56` (Yellow)
- **Tooltip**: Shows market cap category and percentage

**Data Priority**:
1. **Primary**: Uses `holding.marketCapitalization` field if set
2. **Fallback**: Calculates based on `percentageOfHoldings` for backward compatibility

---

### 3. Asset Allocation Chart

**Purpose**: Shows portfolio allocation by instrument type (Equity, ETF, Debt, etc.)

**Data Processing**:
```typescript
generateAssetChart() {
  const assetMap = new Map<string, number>();
  
  this.filteredHoldings.forEach((holding) => {
    const current = assetMap.get(holding.instrument) || 0;
    assetMap.set(holding.instrument, current + holding.percentageOfHoldings);
  });
}
```

**Chart Configuration**:
- **Type**: Pie Chart
- **Data Source**: `holding.instrument` field aggregated by `percentageOfHoldings`
- **Colors**: Dynamically generated from color palette
- **Tooltip**: Shows instrument type and percentage

**Example Output**:
- Equity: 60%
- ETF: 30%
- Debt: 10%

---

### Color Generation

The `generateColors()` method creates a color palette for charts:

```typescript
generateColors(count: number): string[] {
  const baseColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];
  
  // Cycles through colors if more categories than colors
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}
```

---

### Chart Lifecycle

1. **Initialization**: Charts are created in `ngAfterViewInit()` after data loads
2. **Update Trigger**: Charts regenerate when:
   - Holdings are loaded (`loadHoldings()`)
   - Filters are applied (`applyFilters()`)
   - Holdings are added/updated/deleted
3. **Cleanup**: Previous chart instances are destroyed before creating new ones to prevent memory leaks

```typescript
if (this.sectorChart) {
  this.sectorChart.destroy(); // Clean up previous instance
}
this.sectorChart = new Chart(...); // Create new instance
```

---

## Holdings Table Layout

### Table Structure

The holdings table is built using HTML `<table>` element with Ionic styling:

```html
<table class="holdings-table">
  <thead>
    <tr>
      <th>Sr. No</th>
      <th>Name</th>
      <th>Sector</th>
      <th>Instrument</th>
      <th>Market Cap</th>
      <th>% of Holdings</th>
      <th>Created At</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- Rows generated via *ngFor -->
  </tbody>
</table>
```

### Column Details

#### 1. **Sr. No** (Serial Number)
- **Type**: Sequential number
- **Calculation**: `(currentPage - 1) * itemsPerPage + i + 1`
- **Purpose**: Provides row numbering across paginated pages

#### 2. **Name**
- **Type**: Text
- **Source**: `holding.name`
- **Styling**: 
  - Font weight: 500
  - Max width: 200px (desktop), 120px (mobile)
  - Text overflow: ellipsis for long names
- **Example**: "HDFC Bank Ltd"

#### 3. **Sector**
- **Type**: Ionic Chip (Primary color)
- **Source**: `holding.sector`
- **Display**: `<ion-chip size="small" color="primary">`
- **Example**: "Financial", "Technology", "Energy"

#### 4. **Instrument**
- **Type**: Ionic Chip (Secondary color)
- **Source**: `holding.instrument`
- **Display**: `<ion-chip size="small" color="secondary">`
- **Example**: "Equity", "ETF", "Debt"

#### 5. **Market Cap**
- **Type**: Ionic Chip (Tertiary color) or dash
- **Source**: `holding.marketCapitalization`
- **Display Logic**:
  ```html
  <ion-chip *ngIf="holding.marketCapitalization" color="tertiary">
    {{holding.marketCapitalization}}
  </ion-chip>
  <span *ngIf="!holding.marketCapitalization" class="no-data">-</span>
  ```
- **Example**: "Large Cap", "Mid Cap", "Small Cap", or "-"

#### 6. **% of Holdings**
- **Type**: Ionic Badge
- **Source**: `holding.percentageOfHoldings`
- **Color Logic**:
  - **Success (Green)**: `percentageOfHoldings > 10%`
  - **Warning (Yellow)**: `percentageOfHoldings <= 10%`
- **Format**: Number with 1 decimal place (e.g., "15.5%")
- **Display**: `<ion-badge [color]="...">`

#### 7. **Created At**
- **Type**: Formatted Date
- **Source**: `holding.createdAt`
- **Format**: `formatDate()` method converts ISO string to locale date
- **Example**: "12/25/2023"

#### 8. **Actions**
- **Type**: Action Buttons
- **Buttons**:
  - **Edit**: `<ion-button color="primary">` with edit icon
  - **Delete**: `<ion-button color="danger">` with trash icon
- **Functionality**: Opens edit/delete modals

---

### Pagination

**Configuration**:
- **Items per page**: 10
- **Current page**: Tracked in `currentPage` variable
- **Total pages**: Calculated as `Math.ceil(filteredHoldings.length / itemsPerPage)`

**Pagination Methods**:
```typescript
getPaginatedHoldings(): Holding[] {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  return this.filteredHoldings.slice(startIndex, endIndex);
}

goToPage(page: number): void {
  if (page >= 1 && page <= this.getTotalPages()) {
    this.currentPage = page;
  }
}
```

**UI Controls**:
- Previous button (disabled on page 1)
- Page info display: "Page X of Y"
- Next button (disabled on last page)

---

### Search and Filtering

**Search Functionality**:
- **Input**: `<ion-searchbar>` with two-way binding to `searchTerm`
- **Trigger**: `(ionInput)="onSearchChange()"` event
- **Search Fields**: 
  - Name
  - Sector
  - Instrument
  - Market Capitalization

**Filter Logic**:
```typescript
applyFilters() {
  let filtered = [...this.holdings];
  
  if (this.searchTerm) {
    const term = this.searchTerm.toLowerCase();
    filtered = filtered.filter((holding) =>
      holding.name.toLowerCase().includes(term) ||
      holding.sector.toLowerCase().includes(term) ||
      holding.instrument.toLowerCase().includes(term) ||
      (holding.marketCapitalization && 
       holding.marketCapitalization.toLowerCase().includes(term))
    );
  }
  
  this.filteredHoldings = filtered;
  this.currentPage = 1; // Reset to first page
  this.generateCharts(); // Update charts
}
```

**Clear Filters**:
- Resets `searchTerm` to empty string
- Reapplies filters (shows all holdings)

---

### Empty State

When no holdings match the search criteria:

```html
<div class="empty-state" *ngIf="filteredHoldings.length === 0">
  <ion-icon name="pie-chart-outline"></ion-icon>
  <h3>No Holdings Found</h3>
  <p>Try adjusting your search criteria or add your first holding</p>
  <ion-button fill="outline" (click)="addHolding()">
    Add First Holding
  </ion-button>
</div>
```

---

## Data Flow

### 1. Data Loading
```
UserService.getHoldings() 
  → Firestore API 
  → convertFirestoreToHolding() 
  → Holding[] array
  → this.holdings
```

### 2. Filtering
```
this.holdings 
  → applyFilters() 
  → this.filteredHoldings
  → generateCharts() (updates all charts)
```

### 3. Table Display
```
this.filteredHoldings 
  → getPaginatedHoldings() 
  → *ngFor loop 
  → Table rows
```

### 4. Chart Display
```
this.filteredHoldings 
  → generateSectorChart() / generateMarketCapChart() / generateAssetChart()
  → Chart.js instance
  → Canvas rendering
```

---

## Styling and Responsive Design

### Table Styling

**Base Styles**:
- White background with rounded corners
- Box shadow for depth
- Primary color header with white text
- Hover effect on rows (light background tint)

**Column Styling**:
- Header: Uppercase, bold, letter-spaced
- Cells: 12px padding, 0.9rem font size
- First column: Left padding 16px
- Last column: Right padding 16px, center-aligned

### Responsive Breakpoints

**Desktop (≥768px)**:
- Charts: 3 columns (size-md="4")
- Table: Full width with all columns visible
- Stat cards: 2 columns (size-md="6")

**Mobile (<768px)**:
- Charts: Stacked vertically (size="12")
- Table: Horizontal scroll enabled
- Font sizes: Reduced to 0.8rem
- Stat cards: Stacked vertically (size="12")

### Dark Mode Support

```scss
@media (prefers-color-scheme: dark) {
  .holdings-table {
    background: var(--ion-color-dark);
    color: var(--ion-color-light);
    
    tbody tr:hover {
      background-color: var(--ion-color-dark-tint);
    }
  }
}
```

---

## Key Components

### Summary Stats Cards

**Total Holdings Card**:
- Icon: Trending up
- Value: `getTotalHoldings()` - count of filtered holdings
- Color: Primary

**Total Allocation Card**:
- Icon: Pie chart
- Value: `getTotalPercentage()` - sum of all percentages
- Format: "XX.X%"
- Color: Success

### Action Buttons

**Add Holding**:
- Location: Header (end slot) and search section
- Color: Success (green)
- Action: Opens alert prompt to add new holding

**Bulk Import**:
- Location: Search section
- Color: Warning (orange)
- Action: Imports predefined holdings from code

**Edit/Delete**:
- Location: Actions column in table
- Edit: Primary color (blue)
- Delete: Danger color (red)

---

## Chart Configuration Details

### Common Chart Options

All three charts share these configuration options:

```typescript
{
  responsive: true,              // Adapts to container size
  maintainAspectRatio: false,    // Allows custom height
  plugins: {
    legend: {
      position: 'bottom',        // Legend at bottom
      labels: {
        padding: 20,             // Spacing around labels
        usePointStyle: true      // Point style instead of box
      }
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return context.label + ': ' + context.parsed.toFixed(1) + '%';
        }
      }
    }
  }
}
```

### Chart Container Structure

```html
<div class="chart-container">
  <h3>Chart Title</h3>
  <div class="chart-wrapper">
    <canvas #chartRef height="300"></canvas>
  </div>
</div>
```

**CSS**:
- Container: Centered text, 16px padding
- Wrapper: Relative positioning, 300px height, 100% width
- Canvas: Max height/width 100% for responsiveness

---

## Data Model

### Holding Interface

```typescript
interface Holding {
  id?: string;
  name: string;
  sector: string;
  instrument: string;
  percentageOfHoldings: number;
  marketCapitalization?: string;  // Optional: "Large Cap", "Mid Cap", "Small Cap"
  createdAt: string;
  createdBy: string;
}
```

### Example Holding Object

```typescript
{
  id: "abc123",
  name: "HDFC Bank Ltd",
  sector: "Financial",
  instrument: "Equity",
  percentageOfHoldings: 5,
  marketCapitalization: "Large Cap",
  createdAt: "2023-12-25T10:00:00Z",
  createdBy: "admin"
}
```

---

## Performance Considerations

1. **Chart Destruction**: Previous chart instances are destroyed before creating new ones to prevent memory leaks
2. **Pagination**: Only renders 10 holdings at a time to improve table performance
3. **Filtered Data**: Charts use `filteredHoldings` instead of all holdings for better performance
4. **Lazy Loading**: Charts are generated only after data is loaded and view is initialized

---

## Future Enhancements

Potential improvements:
1. **Chart Export**: Add ability to export charts as images
2. **Advanced Filtering**: Add filters by sector, market cap, instrument type
3. **Sorting**: Add column sorting functionality
4. **Chart Types**: Add bar charts or line charts for time-series data
5. **Real-time Updates**: WebSocket integration for live portfolio updates

---

## Summary

The portfolio page provides a comprehensive view of holdings through:
- **Three interactive pie charts** showing sector, market cap, and asset allocation
- **Detailed holdings table** with pagination, search, and actions
- **Responsive design** that works on desktop and mobile
- **Real-time updates** when holdings are added, edited, or deleted

All charts and tables are dynamically generated based on the holdings data from Firestore, ensuring accurate and up-to-date portfolio visualization.

