# Pagination Implementation Guide

## Completed Pages (✅ With 10, 30, 50, 100 Items/Page Options)

1. **ManageOrders** - Updated hook and page with pagination
2. **ManageProducts** - Updated hook and page with pagination  
3. **ManageUsers** - Updated hook and page with pagination
4. **ManageDevices** - Updated hook and page with pagination
5. **ManageServices** - Updated hook and page with pagination

## Quick Implementation Pattern

### For Each Manage Hook:

```javascript
// 1. Add pagination state
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

// 2. Reset page when filters change
useEffect(() => {
  // ... filter logic ...
  setCurrentPage(1);
}, [filters, searchText]);

// 3. Add pagination functions (before return)
const getPaginatedData = () => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return displayData.slice(startIndex, endIndex);
};

const getTotalPages = () => {
  return Math.ceil(displayData.length / pageSize);
};

const handlePageChange = (newPage) => {
  const totalPages = getTotalPages();
  if (newPage >= 1 && newPage <= totalPages) {
    setCurrentPage(newPage);
  }
};

const handlePageSizeChange = (newSize) => {
  setPageSize(newSize);
  setCurrentPage(1);
};

// 4. Include in return statement
return {
  // ... existing returns ...
  currentPage,
  pageSize,
  getPaginatedData,
  getTotalPages,
  handlePageChange,
  handlePageSizeChange,
};
```

### For Each Manage Page Component:

```javascript
// 1. Import Pagination component
import Pagination from '../../components/Pagination/Pagination';

// 2. Destructure pagination functions from hook
const {
  // ... existing ...
  currentPage,
  pageSize,
  getPaginatedData,
  getTotalPages,
  handlePageChange,
  handlePageSizeChange,
} = useManageXXX(userInfo);

// 3. Update table to use getPaginatedData()
{getPaginatedData().map((item, index) => (
  <tr key={item._id || index}>
    <td>{(currentPage - 1) * pageSize + index + 1}</td>
    {/* ... rest of row ... */}
  </tr>
))}

// 4. Add Pagination component after table
{displayData.length > 0 && (
  <Pagination
    currentPage={currentPage}
    totalPages={getTotalPages()}
    pageSize={pageSize}
    onPageChange={handlePageChange}
    onPageSizeChange={handlePageSizeChange}
    totalRecords={displayData.length}
  />
)}
```

## Remaining Pages to Update

### High Priority (Large Datasets):
- **ManageInstallations** - Installation tasks
- **ManageCallRequests** - Call/service requests
- **ManageContact** - Contact inquiries

### Medium Priority:
- **ManageRequests** - General requests
- **ManageLeaves** - Technician leaves

### Lower Priority:
- **ManageRoles** - Role management

## Implementation Steps

For each remaining page:

1. Open `ManageXXXHooks.jsx`
2. Add pagination state at top
3. Add pagination functions before return
4. Update return statement with new functions
5. Open corresponding `ManageXXX.jsx` page
6. Import `Pagination` component
7. Add pagination to hook destructuring
8. Find `.map()` with data and replace with `getPaginatedData().map()`
9. Update index calculation: `(currentPage - 1) * pageSize + index + 1`
10. Add `<Pagination />` component after table

## Copy-Paste Ready Patterns

### Pattern 1: Simple List (like ManageProducts)
Use `displayData.length` for total records

### Pattern 2: Filtered List (like ManageOrders)
Use `filteredData.length` for total records and reset page on filter change

### Pattern 3: Complex Data (like ManageServices)
Use `displayTasks.length` for total records after all filtering applied

## Testing Checklist

- [ ] Page loads without errors
- [ ] Page size selector works (10, 30, 50, 100)
- [ ] Previous/Next buttons navigate correctly
- [ ] Page numbers display properly
- [ ] Record count is accurate
- [ ] Filters reset page to 1
- [ ] Search resets page to 1
- [ ] Serial numbers update correctly per page
- [ ] Pagination hides on single page
- [ ] Works on mobile (pagination is responsive)

## Files Generated

- `/FRONTEND/ADMIN/src/roles/superadmin/components/Pagination/Pagination.jsx` - Main component
- `/FRONTEND/ADMIN/src/roles/superadmin/components/Pagination/Pagination.css` - Styling with 10, 30, 50, 100 options

## Response Format (Backend)

All endpoints already support pagination. The pagination metadata is included in responses:

```javascript
{
  status: "Success",
  data: [...items...],
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalRecords: 150,
    totalPages: 15,
    hasNextPage: true,
    hasPreviousPage: false
  }
}
```

## Notes

- Default page size: 10 items
- Maximum allowed: 100 items per page
- Options: 10, 30, 50, 100
- Pagination resets to page 1 when filters/search changes
- Serial numbers automatically adjust based on current page
- Fully responsive design
