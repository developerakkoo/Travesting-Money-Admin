# Mutual Fund Portfolio Page - Table and Chart Documentation

## Overview
This document explains how to implement the Mutual Fund Portfolio table and pie chart display in your application. This documentation focuses on **read-only display** of mutual fund data (table and chart) without CRUD operations (add, edit, delete).

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Model](#data-model)
3. [Chart Implementation](#chart-implementation)
4. [Table Implementation](#table-implementation)
5. [Styling and Theming](#styling-and-theming)
6. [Integration Guide](#integration-guide)
7. [Code Examples](#code-examples)

---

## Architecture Overview

The Mutual Fund Portfolio page displays mutual fund data in two main components:
- **Pie Chart**: Shows portfolio weight distribution across all funds
- **Data Table**: Displays all mutual fund details in a structured table format

### Technology Stack
- **Chart.js**: For rendering the pie chart
- **HTML/CSS**: For table structure and styling
- **JavaScript/TypeScript**: For data processing and chart generation
- **Ionic Framework** (optional): For UI components if using Ionic

---

## Data Model

### MutualFund Interface

```typescript
interface MutualFund {
  id?: string;
  fundName: string;           // e.g., "UTI Nifty 50 Index Fund (Direct)"
  category: string;            // e.g., "Large Cap", "Mid Cap", "Small Cap"
  portfolioWeight: number;     // Percentage value (e.g., 25.0)
  expenseRatio: number;        // Percentage value (e.g., 0.17)
  role: string;                // e.g., "Core Stability Anchor"
  createdAt: string;            // ISO date string
  createdBy: string;           // User/admin identifier
}
```

### Example Data

```typescript
const mutualFunds: MutualFund[] = [
  {
    id: "1",
    fundName: "UTI Nifty 50 Index Fund (Direct)",
    category: "Large Cap",
    portfolioWeight: 25,
    expenseRatio: 0.17,
    role: "Core Stability Anchor",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "admin"
  },
  {
    id: "2",
    fundName: "Parag Parikh Flexi Cap Fund (Direct)",
    category: "Flexi Cap",
    portfolioWeight: 25,
    expenseRatio: 0.63,
    role: "Value + Global Diversification",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "admin"
  },
  {
    id: "3",
    fundName: "Invesco India Mid Cap Fund (Direct)",
    category: "Mid Cap",
    portfolioWeight: 20,
    expenseRatio: 0.65,
    role: "Alpha Generation Engine",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "admin"
  },
  {
    id: "4",
    fundName: "Bandhan Small Cap Fund (Direct)",
    category: "Small Cap",
    portfolioWeight: 15,
    expenseRatio: 0.41,
    role: "Maximum Growth Potential",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "admin"
  },
  {
    id: "5",
    fundName: "Nippon India Multi Cap Fund (Direct)",
    category: "Multi Cap",
    portfolioWeight: 15,
    expenseRatio: 0.73,
    role: "Forced Diversification Buffer",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "admin"
  }
];
```

---

## Chart Implementation

### 1. Setup Chart.js

First, install Chart.js in your project:

```bash
npm install chart.js
```

### 2. HTML Structure

```html
<div class="chart-container">
  <h3>Portfolio Weight Distribution 📊</h3>
  <div class="chart-wrapper">
    <canvas id="weightChart" height="300"></canvas>
  </div>
</div>
```

### 3. Chart Generation Code

```typescript
import Chart from 'chart.js/auto';

// Function to generate the pie chart
function generateWeightChart(mutualFunds: MutualFund[]) {
  // Get canvas element
  const canvas = document.getElementById('weightChart') as HTMLCanvasElement;
  if (!canvas) return;

  // Destroy existing chart if it exists
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Extract labels and data
  const labels = mutualFunds.map(fund => fund.fundName);
  const data = mutualFunds.map(fund => fund.portfolioWeight);
  const colors = generateColors(labels.length);

  // Create new chart
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ': ' + context.parsed.toFixed(1) + '%';
            },
          },
        },
      },
    },
  });
}

// Color generation function
function generateColors(count: number): string[] {
  const baseColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB',
    '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}
```

### 4. Chart CSS

```css
.chart-container {
  text-align: center;
  padding: 16px;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

.chart-wrapper canvas {
  max-height: 100%;
  max-width: 100%;
}
```

### 5. Chart Initialization

```typescript
// Initialize chart after data is loaded
async function loadAndDisplayMutualFunds() {
  // Fetch data from your API/service
  const mutualFunds = await fetchMutualFunds();
  
  // Generate chart
  generateWeightChart(mutualFunds);
  
  // Render table
  renderTable(mutualFunds);
}
```

---

## Table Implementation

### 1. HTML Table Structure

```html
<div class="table-container">
  <table class="funds-table">
    <thead>
      <tr>
        <th>Sr. No</th>
        <th>Fund Name</th>
        <th>Category</th>
        <th>Portfolio Weight</th>
        <th>Expense Ratio</th>
        <th>Role</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody id="fundsTableBody">
      <!-- Rows will be generated dynamically -->
    </tbody>
  </table>
</div>
```

### 2. Table Rendering Code

```typescript
function renderTable(mutualFunds: MutualFund[]) {
  const tbody = document.getElementById('fundsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  mutualFunds.forEach((fund, index) => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div class="fund-name">${fund.fundName}</div>
      </td>
      <td>
        <span class="chip chip-primary">${fund.category}</span>
      </td>
      <td>
        <span class="badge ${fund.portfolioWeight > 10 ? 'badge-success' : 'badge-warning'}">
          ${fund.portfolioWeight.toFixed(1)}%
        </span>
      </td>
      <td>
        <span class="badge badge-tertiary">
          ${fund.expenseRatio.toFixed(2)}%
        </span>
      </td>
      <td>
        <span class="chip chip-secondary">${fund.role}</span>
      </td>
      <td>${formatDate(fund.createdAt)}</td>
    `;
    
    tbody.appendChild(row);
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
```

### 3. Table CSS Styling

```css
.table-container {
  overflow-x: auto;
  margin-bottom: 16px;
}

.funds-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.funds-table thead {
  background: #3880ff; /* Primary color */
  color: white;
}

.funds-table thead th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.funds-table thead th:first-child {
  padding-left: 16px;
}

.funds-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

.funds-table tbody tr:hover {
  background-color: #f5f5f5;
}

.funds-table tbody tr:last-child {
  border-bottom: none;
}

.funds-table tbody td {
  padding: 12px 8px;
  font-size: 0.9rem;
}

.funds-table tbody td:first-child {
  padding-left: 16px;
  font-weight: 500;
  color: #666;
}

.fund-name {
  font-weight: 500;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Chip styles */
.chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.chip-primary {
  background-color: #3880ff;
  color: white;
}

.chip-secondary {
  background-color: #3dc2ff;
  color: white;
}

/* Badge styles */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-success {
  background-color: #2dd36f;
  color: white;
}

.badge-warning {
  background-color: #ffc409;
  color: #333;
}

.badge-tertiary {
  background-color: #5260ff;
  color: white;
}
```

---

## Styling and Theming

### Summary Stats Cards (Optional)

If you want to display summary statistics:

```html
<div class="stats-container">
  <div class="stat-card">
    <div class="stat-icon">📊</div>
    <div class="stat-info">
      <div class="stat-number" id="totalFunds">0</div>
      <div class="stat-label">Total Funds</div>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">📈</div>
    <div class="stat-info">
      <div class="stat-number" id="totalWeight">0%</div>
      <div class="stat-label">Total Weight</div>
    </div>
  </div>
</div>
```

```css
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3880ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

```typescript
function updateStats(mutualFunds: MutualFund[]) {
  const totalFunds = mutualFunds.length;
  const totalWeight = mutualFunds.reduce((sum, fund) => sum + fund.portfolioWeight, 0);
  
  document.getElementById('totalFunds')!.textContent = totalFunds.toString();
  document.getElementById('totalWeight')!.textContent = totalWeight.toFixed(1) + '%';
}
```

### Responsive Design

```css
/* Mobile responsive */
@media (max-width: 768px) {
  .funds-table {
    font-size: 0.8rem;
  }
  
  .funds-table thead th {
    padding: 8px 4px;
    font-size: 0.8rem;
  }
  
  .funds-table tbody td {
    padding: 8px 4px;
  }
  
  .fund-name {
    max-width: 120px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
```

### Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  .funds-table {
    background: #1e1e1e;
    color: #fff;
  }
  
  .funds-table tbody tr:hover {
    background-color: #2d2d2d;
  }
  
  .fund-name {
    color: #fff;
  }
  
  .stat-card {
    background: #1e1e1e;
    color: #fff;
  }
}
```

---

## Integration Guide

### Step 1: Fetch Data

```typescript
// Example: Fetch from API
async function fetchMutualFunds(): Promise<MutualFund[]> {
  try {
    const response = await fetch('/api/mutual-funds');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching mutual funds:', error);
    return [];
  }
}

// Example: Fetch from Firestore (if using Firebase)
import { collection, getDocs } from 'firebase/firestore';

async function fetchMutualFundsFromFirestore(): Promise<MutualFund[]> {
  const querySnapshot = await getDocs(collection(db, 'mutualFunds'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MutualFund));
}
```

### Step 2: Initialize Components

```typescript
// Main initialization function
async function initMutualFundPortfolio() {
  // 1. Fetch data
  const mutualFunds = await fetchMutualFunds();
  
  // 2. Update stats (if using)
  updateStats(mutualFunds);
  
  // 3. Generate chart
  generateWeightChart(mutualFunds);
  
  // 4. Render table
  renderTable(mutualFunds);
}

// Call on page load
document.addEventListener('DOMContentLoaded', initMutualFundPortfolio);
```

### Step 3: Update Chart on Data Change

```typescript
// If data updates dynamically
function updateMutualFundDisplay(mutualFunds: MutualFund[]) {
  generateWeightChart(mutualFunds);
  renderTable(mutualFunds);
  updateStats(mutualFunds);
}
```

---

## Code Examples

### Complete HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mutual Fund Portfolio</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Mutual Fund Portfolio 📊</h1>
    
    <!-- Summary Stats -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-number" id="totalFunds">0</div>
          <div class="stat-label">Total Funds</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-number" id="totalWeight">0%</div>
          <div class="stat-label">Total Weight</div>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="chart-card">
      <h2>Portfolio Weight Distribution 📊</h2>
      <div class="chart-container">
        <div class="chart-wrapper">
          <canvas id="weightChart" height="300"></canvas>
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <div class="table-card">
      <h2>Mutual Funds</h2>
      <div class="table-container">
        <table class="funds-table">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Fund Name</th>
              <th>Category</th>
              <th>Portfolio Weight</th>
              <th>Expense Ratio</th>
              <th>Role</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody id="fundsTableBody">
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

### Complete JavaScript Example

```javascript
// Data model
const mutualFunds = [
  {
    id: "1",
    fundName: "UTI Nifty 50 Index Fund (Direct)",
    category: "Large Cap",
    portfolioWeight: 25,
    expenseRatio: 0.17,
    role: "Core Stability Anchor",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "admin"
  },
  // ... more funds
];

// Chart generation
function generateWeightChart(funds) {
  const canvas = document.getElementById('weightChart');
  if (!canvas) return;

  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  const labels = funds.map(fund => fund.fundName);
  const data = funds.map(fund => fund.portfolioWeight);
  const colors = generateColors(labels.length);

  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ': ' + context.parsed.toFixed(1) + '%';
            },
          },
        },
      },
    },
  });
}

// Table rendering
function renderTable(funds) {
  const tbody = document.getElementById('fundsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  funds.forEach((fund, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><div class="fund-name">${fund.fundName}</div></td>
      <td><span class="chip chip-primary">${fund.category}</span></td>
      <td><span class="badge ${fund.portfolioWeight > 10 ? 'badge-success' : 'badge-warning'}">${fund.portfolioWeight.toFixed(1)}%</span></td>
      <td><span class="badge badge-tertiary">${fund.expenseRatio.toFixed(2)}%</span></td>
      <td><span class="chip chip-secondary">${fund.role}</span></td>
      <td>${formatDate(fund.createdAt)}</td>
    `;
    tbody.appendChild(row);
  });
}

// Helper functions
function generateColors(count) {
  const baseColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function updateStats(funds) {
  document.getElementById('totalFunds').textContent = funds.length;
  const totalWeight = funds.reduce((sum, fund) => sum + fund.portfolioWeight, 0);
  document.getElementById('totalWeight').textContent = totalWeight.toFixed(1) + '%';
}

// Initialize
function init() {
  updateStats(mutualFunds);
  generateWeightChart(mutualFunds);
  renderTable(mutualFunds);
}

document.addEventListener('DOMContentLoaded', init);
```

---

## Key Features

### Chart Features
- ✅ Pie chart showing portfolio weight distribution
- ✅ Dynamic color generation
- ✅ Interactive tooltips showing percentages
- ✅ Responsive design
- ✅ Legend at bottom with point style

### Table Features
- ✅ All mutual fund data displayed
- ✅ Color-coded badges for portfolio weight (green > 10%, yellow ≤ 10%)
- ✅ Chips for category and role
- ✅ Responsive design with horizontal scroll on mobile
- ✅ Hover effects on rows

### Styling Features
- ✅ Modern card-based layout
- ✅ Consistent color scheme
- ✅ Dark mode support
- ✅ Mobile responsive
- ✅ Clean, professional appearance

---

## Summary

This documentation provides everything you need to implement a read-only Mutual Fund Portfolio display with:
- **Pie Chart**: Visual representation of portfolio weight distribution
- **Data Table**: Complete mutual fund information in a structured format
- **Responsive Design**: Works on desktop and mobile devices
- **Modern Styling**: Clean, professional appearance

The implementation is framework-agnostic and can be adapted to any JavaScript framework (React, Vue, Angular, or vanilla JavaScript).

---

## Notes

- **No CRUD Operations**: This documentation focuses only on displaying data, not adding, editing, or deleting mutual funds
- **Data Source**: You need to implement your own data fetching logic (API, Firestore, etc.)
- **Customization**: All colors, fonts, and styles can be customized to match your application's theme
- **Performance**: Charts are destroyed and recreated on data updates to prevent memory leaks

