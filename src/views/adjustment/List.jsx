"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { toast } from "sonner";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  TablePagination,
  Alert
} from '@mui/material';
import Link from 'next/link';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';


export default function List() {
  const router = useRouter();

  // State declarations
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_tpn: '',
  });

  // Search filter states
  const [searchFilters, setSearchFilters] = useState({
    invoiceNumber: '',
    startDate: '',
    endDate: ''
  });

  // Fetch dropdown data
  useEffect(() => {
    fetchAllData();
  }, [partyTypeFilter]);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      const partiesRes = await fetch('/api/party/list?page=1&limit=1000&partyType=' + partyTypeFilter);
      const partiesData = await partiesRes.json();
      setParties(partiesData.parties || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
    } finally {
      setLoadingData(false);
    }
  };

  // Search sales/invoices function - REMOVED useCallback to avoid stale closures
  const searchSales = async (customerId, filters, page = 1) => {
    if (!customerId) {
      setSales([]);
      return;
    }

    try {
      setSearchLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        customerId: customerId,
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.invoiceNumber) {
        params.append('invoiceNumber', filters.invoiceNumber);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/adjustment/search?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSales(data.data || []);
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });

        if (data.data?.length === 0) {
          toast.info('No invoices found for this customer');
        }
      } else {
        toast.error(data.error || 'Failed to search invoices');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching invoices');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle customer selection - auto search when customer is selected
  const handleCustomerChange = async (customerId) => {
    console.log('Customer selected:', customerId);

    if (!customerId) {
      setFormData({
        customer_id: '',
        customer_name: '',
        customer_tpn: '',
      });
      setSales([]);
      return;
    }

    const customer = parties.find(p => p.partyId === parseInt(customerId));
    console.log('Found customer:', customer);

    if (customer) {
      setFormData({
        customer_id: customerId,
        customer_name: customer.displayName || customer.details?.cid || '',
        customer_tpn: customer.details?.taxPayerRegNo || '',
      });
    } else {
      setFormData({
        customer_id: customerId,
        customer_name: '',
        customer_tpn: '',
      });
    }

    // Clear previous search results
    setSales([]);
    setPagination({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });

    // Auto-search when customer is selected
    await searchSales(customerId, searchFilters, 1);
  };

  // Handle search button click
  const handleSearchSales = () => {
    console.log('Searching sales for customer ID:', formData.customer_id);
    if (!formData.customer_id) {
      toast.error('Please select a customer first');
      return;
    }
    searchSales(formData.customer_id, searchFilters, 1);
  };

  // Clear search - FIXED VERSION
  const handleClearSearch = async () => {
    // First clear the filters
    const clearedFilters = {
      invoiceNumber: '',
      startDate: '',
      endDate: ''
    };
    setSearchFilters(clearedFilters);

    // Clear results
    setSales([]);
    setPagination({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });

    // If there's a customer selected, search with cleared filters
    if (formData.customer_id) {
      // Wait for state to update and then search
      await searchSales(formData.customer_id, clearedFilters, 1);
    } else {
      toast.info('Please select a customer first');
    }
  };

  // Handle pagination change
  const handlePageChange = (event, newPage) => {
    const page = newPage + 1; // Convert to 1-based
    setPagination(prev => ({ ...prev, page }));
    if (formData.customer_id) {
      searchSales(formData.customer_id, searchFilters, page);
    }
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));
    if (formData.customer_id) {
      searchSales(formData.customer_id, searchFilters, 1);
    }
  };



  // Add handleBack function if needed
  const handleBack = () => {
    router.back();
  };

  // Navigate to sales/create
  const handleCreateSale = () => {
    router.push('/sales/create');
  };

  if (loadingData) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
      </Box>
    );
  }

  const getCustomerSearchLabel = () => {
    switch (partyTypeFilter) {
      case 'INDIVIDUAL':
        return 'Search by Name, CID, or TPN';
      case 'BUSINESS':
        return 'Search by Name, Business License, Company Reg. No, or TPN';
      case 'CORPORATION':
        return 'Search by Name, Company Reg. No, or TPN';
      case 'CSO':
        return 'Search by Name or Registration No or TPN';
      case 'GOVERNMENT_AGENCY':
        return 'Search by Agency Name or TPN';
      default:
        return 'Search customer by Name / ID / Registration';
    }
  };

  const filterCustomers = (options, { inputValue }) => {
    const search = inputValue.toLowerCase();

    return options.filter((party) => {
      const { partyType, displayName, details = {} } = party;

      const commonFields = [
        displayName,
        details.taxPayerRegNo
      ];

      let typeSpecificFields = [];

      switch (partyType) {
        case 'INDIVIDUAL':
          typeSpecificFields = [
            details.cid,
            details.email,
            details.phone
          ];
          break;

        case 'BUSINESS':
          typeSpecificFields = [
            details.licenseNo,
            details.companyRegistrationNo
          ];
          break;

        case 'CORPORATION':
          typeSpecificFields = [
            details.corporationName,
            details.companyRegistrationNo
          ];
          break;

        case 'CSO':
          typeSpecificFields = [
            details.csoRegistrationNo
          ];
          break;

        case 'GOVERNMENT_AGENCY':
          typeSpecificFields = [
            details.agencyName
          ];
          break;

        default:
          break;
      }

      return [...commonFields, ...typeSpecificFields]
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(search));
    });
  };

  const getCustomerOptionLabel = (party) => {
    const { partyType, displayName, details = {} } = party;

    switch (partyType) {
      case 'INDIVIDUAL':
        return `${displayName} ${details.cid ? `- CID: ${details.cid}` : ''}`;

      case 'BUSINESS':
        return `${displayName} ${details.licenseNo ? `- LIC: ${details.licenseNo}` : ''}`;

      case 'CORPORATION':
        return `${displayName} ${details.companyRegistrationNo ? `- REG: ${details.companyRegistrationNo}` : ''}`;

      case 'CSO':
        return `${displayName} ${details.csoRegistrationNo ? `- REG: ${details.csoRegistrationNo}` : ''}`;

      case 'GOVERNMENT_AGENCY':
        return `${displayName}`;

      default:
        return displayName || '';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Customer Selection & Invoice Search</Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Customer Information - Full width */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Customer Information" />
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Customer Type */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel id="party-type-label">
                          Customer / Party
                        </InputLabel>
                        <Select
                          labelId="party-type-label"
                          value={partyTypeFilter}
                          label="Party Type *"
                          onChange={(e) => setPartyTypeFilter(e.target.value)}
                        >
                          <MenuItem value="">
                            <em>All Types</em>
                          </MenuItem>
                          <MenuItem value="BUSINESS">Business</MenuItem>
                          <MenuItem value="GOVERNMENT_AGENCY">Government Agency</MenuItem>
                          <MenuItem value="CORPORATION">Corporation</MenuItem>
                          <MenuItem value="CSO">CSO</MenuItem>
                          <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Customer Selection */}
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={parties}
                        filterOptions={filterCustomers}
                        getOptionLabel={getCustomerOptionLabel}
                        value={
                          parties.find(p => p.partyId === parseInt(formData.customer_id)) || null
                        }
                        onChange={(event, newValue) => {
                          handleCustomerChange(newValue ? newValue.partyId : '');
                        }}
                        isOptionEqualToValue={(option, value) =>
                          option.partyId === value.partyId
                        }
                        disabled={parties.length === 0}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={getCustomerSearchLabel()}
                            placeholder={getCustomerSearchLabel()}
                            required
                            fullWidth
                          />
                        )}
                        noOptionsText="No customers found"
                      />
                    </Grid>

                    {/*         
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Customer Name"
                        value={formData.customer_name}
                        variant="outlined"
                        disabled
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tax Payer Number (TPN)"
                        value={formData.customer_tpn}
                        variant="outlined"
                        disabled
                      />
                    </Grid> */}


                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Search Invoice - Full width */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Search Invoice"
                  subheader="If invoice is already issued then search invoice"
                />
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Invoice Number */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Invoice Number"
                        value={searchFilters.invoiceNumber}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        variant="outlined"
                        placeholder="Enter invoice number"
                      />
                    </Grid>

                    {/* Date Range */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="From Date"
                        type="date"
                        value={searchFilters.startDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="To Date"
                        type="date"
                        value={searchFilters.endDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    {/* Search Buttons */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<SearchIcon />}
                          onClick={handleSearchSales}
                          disabled={searchLoading || !formData.customer_id}
                        >
                          {searchLoading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            'Search Invoice'
                          )}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ClearIcon />}
                          onClick={handleClearSearch}
                          disabled={!formData.customer_id}
                        >
                          Clear
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Results Table or Create Sale Link */}
            {sales.length > 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Search Results"
                    subheader={`${pagination.total} invoice(s) found`}
                  />
                  <CardContent>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Invoice No</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Customer Name</TableCell>
                            <TableCell>Customer TPN</TableCell>
                            <TableCell align="right">Taxable Amount</TableCell>
                            <TableCell align="right">Exempt Amount</TableCell>
                            <TableCell align="right">GST Amount</TableCell>
                            <TableCell align="right">Total Amount</TableCell>
                            {/* <TableCell>Status</TableCell> */}
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sales.map((sale) => (
                            <TableRow
                              key={sale.sales_id}
                              hover
                            >
                              <TableCell>
                                <Typography fontWeight="medium">
                                  {sale.sales_invoice_no || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {formatDate(sale.sales_date)}
                              </TableCell>
                              <TableCell>
                                {sale.customer_name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {sale.customer_tpn || 'N/A'}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(sale.taxable_amount)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(sale.exempt_amount)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(sale.gst_amount)}
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="medium">
                                  {formatCurrency(sale.sales_amount)}
                                </Typography>
                              </TableCell>

                              <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  {/* <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewInvoice(sale)}
                                    title="View Invoice"
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton> */}
                                  {/* <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleEditInvoice(sale)}
                                    title="Edit Invoice"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton> */}
                                  {sale.is_adjustment ? (
                                    <>
                                      
                                      <Link
                                        href={`/adjustment_list/edit/${sale?.adjustment_id}`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                      >
                                        Edit Adjustment
                                      </Link>
                                    </>
                                  ) : (
                                    <>
                                     
                                      <Link
                                        href={`/adjustment/create/${sale.sales_id}`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                      >
                                        Create Adjustment
                                      </Link>
                                    </>
                                  )}


                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={pagination.total}
                        rowsPerPage={pagination.limit}
                        page={pagination.page - 1} // Convert to 0-based
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                      />
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            ) : formData.customer_id && !searchLoading ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ReceiptIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No invoices found for this customer
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Create a new sales invoice for this customer
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleCreateSale}
                      >
                        Create New Sale
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}