"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Collapse,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  Numbers as NumbersIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

// Format currency (removed INR symbol)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function InventoryStockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Expanded rows - using unique key: type_id
  const [expandedRows, setExpandedRows] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    minQty: searchParams.get('min_qty') || '',
    maxQty: searchParams.get('max_qty') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    sortBy: searchParams.get('sortBy') || 'item_name',
    sortDir: searchParams.get('sortDir') || 'asc'
  });
  
  const [showFilters, setShowFilters] = useState(false);

  // Generate unique key for each item (type_id)
  const getItemUniqueKey = (item) => {
    return `${item.item_type}_${item.item_id}`;
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, value);
      });
      queryParams.set('page', (pagination.page + 1).toString());
      queryParams.set('limit', pagination.limit.toString());
      
      const response = await fetch(`/api/inventory-stock?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setInventoryData(data.data);
        setTotals(data.totals);
        setPagination({
          page: data.pagination.page - 1,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        });
        
        // Clear expanded rows when data changes
        setExpandedRows({});
        
        // Update URL with filters
        const newUrl = `/inventory-stock?${queryParams}`;
        window.history.pushState({}, '', newUrl);
      } else {
        setError(data.error || 'Failed to fetch inventory data');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInventoryData();
  }, [filters.search, filters.type, filters.sortBy, filters.sortDir, pagination.page, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: parseInt(event.target.value, 10),
      page: 0 
    }));
  };

  // Toggle row expansion using unique key
  const handleExpandRow = (item) => {
    const uniqueKey = getItemUniqueKey(item);
    setExpandedRows(prev => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey]
    }));
  };

  // Check if row is expanded
  const isRowExpanded = (item) => {
    const uniqueKey = getItemUniqueKey(item);
    return !!expandedRows[uniqueKey];
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: '',
      minQty: '',
      maxQty: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'item_name',
      sortDir: 'asc'
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Export data
  const handleExport = () => {
    // Implement export functionality
    alert('Export functionality to be implemented');
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  if (loading && !inventoryData.length) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LinearProgress sx={{ width: '100%', maxWidth: 600 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <InventoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Inventory Stock
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your inventory stock levels
          </Typography>
        </Box>
        
        
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {totals && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CategoryIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">Total Items</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {totals.total_items}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique products/services
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon sx={{ mr: 2, color: 'warning.main' }} />
                  <Typography variant="h6">Total Value</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(totals?.total_value || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total inventory value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          
        </Grid>
      )}

      {/* Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Items"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Item Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="GOODS">Goods</MenuItem>
                  <MenuItem value="SERVICE">Services</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Min Quantity"
                type="number"
                value={filters.minQty}
                onChange={(e) => handleFilterChange('minQty', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Max Quantity"
                type="number"
                value={filters.maxQty}
                onChange={(e) => handleFilterChange('maxQty', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="item_name">Item Name</MenuItem>
                  <MenuItem value="total_qty">Total Quantity</MenuItem>
                  <MenuItem value="total_value">Total Value</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort Direction</InputLabel>
                <Select
                  value={filters.sortDir}
                  label="Sort Direction"
                  onChange={(e) => handleFilterChange('sortDir', e.target.value)}
                >
                  <MenuItem value="asc">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ArrowUpwardIcon sx={{ mr: 1, fontSize: 16 }} />
                      Ascending
                    </Box>
                  </MenuItem>
                  <MenuItem value="desc">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ArrowDownwardIcon sx={{ mr: 1, fontSize: 16 }} />
                      Descending
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Inventory Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}></TableCell>
                <TableCell>Item Details</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell align="right">Live Stock</TableCell>
                <TableCell align="right">Inventory Value</TableCell>
                <TableCell align="center">Unit</TableCell>
                <TableCell align="center">Price Variants</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No inventory items found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                inventoryData.map((item) => {
                  const uniqueKey = getItemUniqueKey(item);
                  const isExpanded = isRowExpanded(item);
                  
                  return (
                    <>
                      {/* Main Row */}
                      <TableRow key={uniqueKey} hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandRow(item)}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {item.item_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code: {item.item_code || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.item_type}
                            color={item.item_type === 'GOODS' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="medium">
                            {item.total_qty?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="medium" color="primary">
                            {formatCurrency(item.total_inventory_value || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {item.unit_name || 'Unit'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.price_variants || 0}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row (Price Variants) */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, px: 0, border: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: 'background.default' }}>
                              <Typography variant="h6" gutterBottom>
                                Price Variants for {item.item_name}
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Purchase Price</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Inventory Value</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.variants && item.variants.map((variant) => (
                                    <TableRow key={variant.inventory_id}>
                                      <TableCell>
                                        <Typography fontWeight="medium">
                                          {formatCurrency(variant.price || 0)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        {variant.qty?.toFixed(2) || '0.00'} {variant.unit_name || 'Unit'}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(variant.inventory_amount || 0)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #inventory-report, #inventory-report * {
            visibility: visible;
          }
          #inventory-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
}