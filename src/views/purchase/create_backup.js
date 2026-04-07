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
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PartyCreate from '../party/Create';
import Autocomplete from '@mui/material/Autocomplete'

// Helper function to extract data from API responses
const extractDataFromResponse = (data, key) => {
  if (!data) return [];

  // Handle different response structures
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data[key] && Array.isArray(data[key])) return data[key];
  if (data.success && data[key] && Array.isArray(data[key])) return data[key];
  if (data.success && data.data && Array.isArray(data.data)) return data.data;

  return [];
};

export default function CreatePurchase() {
  const router = useRouter();

  // Form state - Matches sales structure but for purchase
  const [formData, setFormData] = useState({
    organization_id: 1,
    supplier_id: '',
    dealer_id: '',
    currency: '2',
    supplier_tpn: '',
    supplier_name: '',
    dealer_tpn: '',
    dealer_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_order_no: '',
    created_by: 1,
    items: [],
  });

  // Dropdown data states
  const [suppliers, setSuppliers] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [goods, setGoods] = useState([]);
  const [services, setServices] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [allGst, setAllGst] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // New item template - matches sales structure
  const newItemTemplate = {
    purchase_item_type: 'GOODS',
    goods_services_id: '',
    goods_service_name: '',
    goods_service_description: '',
    unit_of_measurement_id: '',
    unit_price: 0,
    quantity: 1,
    discount: '',
    gst_rate: 0,
  };

  // Handle supplier selection
  const handleSupplierChange = useCallback((supplierId) => {
    const supplier = suppliers.find(s => s.supplierId === parseInt(supplierId));
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplier_id: supplierId,
        supplier_name: supplier.supplierName || '',
        supplier_tpn: supplier.taxpayerRegNo || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplier_id: supplierId,
        supplier_name: '',
        supplier_tpn: '',
      }));
    }
  }, [suppliers]);

  // Handle dealer selection
  const handleDealerChange = useCallback((dealerId) => {
    const dealer = dealers.find(d => d.dealerId === parseInt(dealerId));
    if (dealer) {
      setFormData(prev => ({
        ...prev,
        dealer_id: dealerId,
        dealer_name: dealer.dealerName || '',
        dealer_tpn: dealer.taxpayerRegNo || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dealer_id: dealerId,
        dealer_name: '',
        dealer_tpn: '',
      }));
    }
  }, [dealers]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        // Fetch all data in parallel
        const [
          suppliersRes,
          dealersRes,
          goodsRes,
          servicesRes,
          currencyRes,
          unitsRes,
          gstRes
        ] = await Promise.all([
          fetch('/api/supplier/list?page=1&limit=1000&sortBy=supplierId&sortDir=asc'),
          fetch('/api/dealer/list?page=1&limit=1000&sortBy=dealerId&sortDir=asc'),
          fetch('/api/goods-catalog/list?page=1&limit=1000'),
          fetch('/api/service-catalog/list?page=1&limit=1000'),
          fetch('/api/currency/list?page=1&limit=1000'),
          fetch('/api/unit/list?page=1&limit=1000'),
          fetch('/api/map-gst-rates/list?page=1&limit=1000&sortBy=mappingId&sortDir=asc'),
        ]);

        // Parse responses
        const suppliersData = await suppliersRes.json();
        const dealersData = await dealersRes.json();
        const goodsData = await goodsRes.json();
        const servicesData = await servicesRes.json();
        const currencyData = await currencyRes.json();
        const unitsData = await unitsRes.json();
        const allGstData = await gstRes.json();

        // Set data with proper extraction
        setSuppliers(suppliersData.data || []);
        setDealers(dealersData.data || []);
        setGoods(goodsData.data || []);
        setServices(servicesData.data || []);
        setCurrencies(currencyData.rates || []);
        setUnits(unitsData.units || []);
        setAllGst(allGstData.data || []);

      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        toast.error('Failed to load dropdown data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, []);

  // Handle item type change - FIXED VERSION
  const handleItemTypeChange = useCallback((index, type) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItemTemplate,
        purchase_item_type: type,
      };
      return { ...prev, items: newItems };
    });
  }, []);

  // Handle goods/service selection
  const handleItemSelection = useCallback((index, itemId, type) => {
    let selectedItem;
    if (type === 'GOODS') {
      selectedItem = goods.find(g => g.goodsId === parseInt(itemId));
    } else {
      selectedItem = services.find(s => s.service_id === parseInt(itemId));
    }

    if (selectedItem) {
      setFormData(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          goods_services_id: itemId,
          goods_service_name: type === 'GOODS' ? selectedItem.goodsName : selectedItem.service_name,
          goods_service_description: type === 'GOODS' ? selectedItem.goodsDescription : selectedItem.service_description,
          unit_price: type === 'GOODS' ? selectedItem.goodsPrice || 0 : newItems[index].unit_price,
          unit_of_measurement_id: type === 'GOODS' ? selectedItem.unitId || '' : newItems[index].unit_of_measurement_id,
        };
        return { ...prev, items: newItems };
      });
    }
  }, [goods, services]);

  // Handle item input change
  const handleItemChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      return { ...prev, items: newItems };
    });
  }, []);

  // Add new item
  const addNewItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...newItemTemplate }]
    }));
  }, []);

  // Remove item
  const removeItem = useCallback((index) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  }, []);

  // Calculate item totals - SAME AS SALES
  const calculateItemTotals = useCallback((item) => {
    const unitPrice = parseFloat(item.unit_price) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    const gstRate = parseFloat(item.gst_rate) || 0;

    // Calculate amount
    const amount = unitPrice * quantity;

    // Calculate discount
    let discountAmount = 0;
    if (item.discount && item.discount !== '') {
      const discountStr = item.discount.toString().trim();
      if (discountStr.endsWith('%')) {
        const percentage = parseFloat(discountStr.replace('%', ''));
        if (!isNaN(percentage)) {
          discountAmount = (amount * percentage) / 100;
        }
      } else {
        const discountValue = parseFloat(discountStr);
        discountAmount = isNaN(discountValue) ? 0 : discountValue;
      }
    }

    const amountAfterDiscount = amount - discountAmount;
    const gstAmount = (amountAfterDiscount * gstRate) / 100;
    const total = amountAfterDiscount + gstAmount;

    return { amount, discountAmount, amountAfterDiscount, gstAmount, total };
  }, []);

  // Calculate overall totals - SAME AS SALES
  const calculateTotals = useCallback(() => {
    let totalAmount = 0;
    let exemptAmount = 0;
    let taxableAmount = 0;
    let gstAmountTotal = 0;
    let salesAmount = 0;

    formData.items.forEach(item => {
      const itemTotals = calculateItemTotals(item);
      totalAmount += itemTotals.total;
      salesAmount += itemTotals.amountAfterDiscount;
      gstAmountTotal += itemTotals.gstAmount;

      const gstRate = parseFloat(item.gst_rate) || 0;
      if (gstRate === 0) {
        exemptAmount += itemTotals.total;
      } else {
        taxableAmount += itemTotals.total;
      }
    });

    return { 
      totalAmount, 
      exemptAmount, 
      taxableAmount, 
      gstAmountTotal,
      salesAmount 
    };
  }, [formData.items, calculateItemTotals]);

  // Validate form
  const validateForm = useCallback(() => {
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return false;
    }
    if (!formData.currency) {
      toast.error('Please select a currency');
      return false;
    }
    if (!formData.purchase_date) {
      toast.error('Please select a purchase date');
      return false;
    }
    // if (!formData.purchase_order_no) {
    //   toast.error('Please enter a purchase order number');
    //   return false;
    // }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.goods_services_id) {
        toast.error(`Please select a ${item.purchase_item_type === 'GOODS' ? 'good' : 'service'} for item ${i + 1}`);
        return false;
      }
      if (!item.unit_of_measurement_id) {
        toast.error(`Please select a unit for item ${i + 1}`);
        return false;
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        toast.error(`Please enter a valid price for item ${i + 1}`);
        return false;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        toast.error(`Please enter a valid quantity for item ${i + 1}`);
        return false;
      }
    }

    return true;
  }, [formData]);

  // Get GST rate for item - SAME AS SALES
  const getGstRateForItem = (goodsServicesId, purchaseItemType, index) => {
    let gstRate = 0;
    const mapping = allGst.find(m => m.serviceGoodsId === parseInt(goodsServicesId) && m.type === purchaseItemType);
    if (mapping) {
      gstRate = mapping.rate ? mapping.rate.gstRate : 0;
    }
    
    // Update the item's gst_rate in formData
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        gst_rate: gstRate,
      };
      return { ...prev, items: newItems };
    });
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Calculate totals
      const totals = calculateTotals();

      // Prepare items for backend - matches purchase schema
      const itemsForBackend = formData.items.map(item => {
        const itemTotals = calculateItemTotals(item);

        return {
          purchase_item_type: item.purchase_item_type,
          goods_id: item.purchase_item_type === 'GOODS' ? parseInt(item.goods_services_id) : null,
          service_id: item.purchase_item_type === 'SERVICE' ? parseInt(item.goods_services_id) : null,
          goods_service_name: item.goods_service_name,
          goods_service_description: item.goods_service_description,
          unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
          unit_price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          amount: itemTotals.amount,
          discount: item.discount ? parseFloat(item.discount) : 0,
          amount_after_discount: itemTotals.amountAfterDiscount,
          gst_amount: itemTotals.gstAmount,
          gst_percentage: item.gst_rate.toString(),
          goods_service_total_amount: itemTotals.total,
        };
      });

      const payload = {
        organization_id: formData.organization_id,
        supplier_id: parseInt(formData.supplier_id),
        dealer_id: formData.dealer_id ? parseInt(formData.dealer_id) : null,
        currency: parseInt(formData.currency),
        purchase_date: formData.purchase_date,
        purchase_order_no: formData.purchase_order_no,
        sales_amount: totals.salesAmount,
        exempt_amount: totals.exemptAmount,
        taxable_amount: totals.taxableAmount,
        gst_amount: totals.gstAmountTotal,
        total_invoice_amount: totals.totalAmount,
        created_by: formData.created_by,
        created_on: new Date().toISOString().split('T')[0],
        items: itemsForBackend,
      };

      const response = await fetch('/api/purchase/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Purchase created successfully!');
        router.push('/purchase');
      } else {
        toast.error(data.error || 'Failed to create purchase');
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Error creating purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter suppliers for autocomplete
  const filterSuppliers = (options, { inputValue }) => {
    const search = inputValue.toLowerCase();

    return options.filter((supplier) => {
      const searchFields = [
        supplier.supplierName,
        supplier.businessLicenseNo,
        supplier.taxpayerRegNo,
        supplier.contactName,
        supplier.contactEmail,
        supplier.contactPhone,
      ];

      return searchFields
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(search));
    });
  };

  // Filter dealers for autocomplete
  const filterDealers = (options, { inputValue }) => {
    const search = inputValue.toLowerCase();

    return options.filter((dealer) => {
      const searchFields = [
        dealer.dealerName,
        dealer.businessLicenseNo,
        dealer.taxpayerRegNo,
        dealer.contactName,
        dealer.contactEmail,
        dealer.contactPhone,
      ];

      return searchFields
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(search));
    });
  };

  // Get supplier option label
  const getSupplierOptionLabel = (supplier) => {
    if (!supplier) return '';
    return `${supplier.supplierName} ${supplier.taxpayerRegNo ? `- TPN: ${supplier.taxpayerRegNo}` : ''}`;
  };

  // Get dealer option label
  const getDealerOptionLabel = (dealer) => {
    if (!dealer) return '';
    return `${dealer.dealerName} ${dealer.taxpayerRegNo ? `- TPN: ${dealer.taxpayerRegNo}` : ''}`;
  };

  const totals = calculateTotals();

  if (loadingData) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 4
            }}
          >
            <Typography variant="h4" component="h1">
              Create New Purchase
            </Typography>

            <Button
              variant="contained"
              onClick={() => router.push('/supplier/create')}
            >
              Add Supplier
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Left Column - Supplier & Dealer Info */}
              <Grid item xs={12} md={12}>
                <Card>
                  <CardHeader title="Supplier Information" />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Supplier Selection */}
                      <Grid item xs={12}>
                        <Autocomplete
                          options={suppliers}
                          filterOptions={filterSuppliers}
                          getOptionLabel={getSupplierOptionLabel}
                          value={
                            suppliers.find(s => s.supplierId === formData.supplier_id) || null
                          }
                          onChange={(event, newValue) => {
                            handleSupplierChange(newValue ? newValue.supplierId : '')
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.supplierId === value?.supplierId
                          }
                          disabled={suppliers.length === 0}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search supplier by Name, License No, or TPN"
                              placeholder="Search supplier..."
                              required
                              fullWidth
                            />
                          )}
                          noOptionsText="No suppliers found"
                        />
                      </Grid>

                      {/* Supplier Name */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Supplier Name"
                          value={formData.supplier_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                          variant="outlined"
                          required
                        />
                      </Grid>

                      {/* Supplier TPN */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Supplier Taxpayer Registration No"
                          value={formData.supplier_tpn}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_tpn: e.target.value }))}
                          variant="outlined"
                          placeholder="Enter TPN if available"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 3 }}>
                  <CardHeader title="Dealer Information (Optional)" />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Dealer Selection */}
                      <Grid item xs={12}>
                        <Autocomplete
                          options={dealers}
                          filterOptions={filterDealers}
                          getOptionLabel={getDealerOptionLabel}
                          value={
                            dealers.find(d => d.dealerId === formData.dealer_id) || null
                          }
                          onChange={(event, newValue) => {
                            handleDealerChange(newValue ? newValue.dealerId : '')
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.dealerId === value?.dealerId
                          }
                          disabled={dealers.length === 0}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search dealer by Name, License No, or TPN"
                              placeholder="Search dealer..."
                              fullWidth
                            />
                          )}
                          noOptionsText="No dealers found"
                        />
                      </Grid>

                      {/* Dealer Name */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Dealer Name"
                          value={formData.dealer_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, dealer_name: e.target.value }))}
                          variant="outlined"
                        />
                      </Grid>

                      {/* Dealer TPN */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Dealer Taxpayer Registration No"
                          value={formData.dealer_tpn}
                          onChange={(e) => setFormData(prev => ({ ...prev, dealer_tpn: e.target.value }))}
                          variant="outlined"
                          placeholder="Enter TPN if available"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 3 }}>
                  <CardHeader title="Purchase Details" />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Purchase Order No */}
                      {/* <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Purchase Order No *"
                          value={formData.purchase_order_no}
                          onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_no: e.target.value }))}
                          required
                        />
                      </Grid> */}

                      {/* Purchase Date */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Purchase Date *"
                          type="date"
                          value={formData.purchase_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                          required
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      {/* Currency */}
                      <Grid item xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Currency *</InputLabel>
                          <Select
                            value={formData.currency}
                            label="Currency *"
                            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                            disabled={currencies.length === 0}
                          >
                            <MenuItem value="">
                              <em>Select currency</em>
                            </MenuItem>
                            {currencies.map((currency) => (
                              <MenuItem key={currency.currencyId || currency.id} value={currency.currencyId || currency.id}>
                                {currency.currencyName || currency.name} ({currency.currencySymbol || currency.symbol || ''})
                              </MenuItem>
                            ))}
                          </Select>
                          {currencies.length === 0 && (
                            <Typography variant="caption" color="text.secondary">
                              No currencies found
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column - Items Table - SAME AS SALES */}
              <Grid item xs={12}>
                <Card sx={{ overflow: 'visible' }}>
                  <CardHeader
                    title={
                      <Typography variant="h5" fontWeight="bold">
                        Purchase Items
                      </Typography>
                    }
                    subheader="Add goods or services to this purchase"
                    action={
                      <Button
                        startIcon={<AddIcon />}
                        onClick={addNewItem}
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{
                          fontSize: '1rem',
                          px: 3,
                          py: 1
                        }}
                      >
                        Add Item
                      </Button>
                    }
                  />

                  <CardContent sx={{ p: 2 }}>
                    {formData.items.length === 0 ? (
                      <Box sx={{
                        textAlign: 'center',
                        py: 8,
                        border: '2px dashed #e0e0e0',
                        borderRadius: 2
                      }}>
                        <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                          No items added
                        </Typography>
                        <Typography color="text.secondary" variant="body1">
                          Click "Add Item" to start adding items
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                          maxHeight: 'calc(100vh - 300px)',
                          overflowY: 'auto',
                          overflowX: 'auto',
                          border: '1px solid #e0e0e0',
                          borderRadius: 2
                        }}
                      >
                        <Table stickyHeader size="medium">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{
                                minWidth: 130,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Type</TableCell>
                              <TableCell sx={{
                                minWidth: 200,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Item</TableCell>
                              <TableCell sx={{
                                minWidth: 120,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Unit</TableCell>
                              <TableCell sx={{
                                minWidth: 130,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Unit Price</TableCell>
                              <TableCell sx={{
                                minWidth: 100,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Qty</TableCell>
                              <TableCell sx={{
                                minWidth: 130,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Amount</TableCell>
                              <TableCell sx={{
                                minWidth: 130,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Discount</TableCell>
                              <TableCell sx={{
                                display:"none",
                                minWidth: 160,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>After Discount</TableCell>
                              <TableCell sx={{
                                display:"none",
                                minWidth: 120,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>GST %</TableCell>
                              <TableCell sx={{
                                minWidth: 130,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }}>Total</TableCell>
                              <TableCell sx={{
                                minWidth: 100,
                                bgcolor: '#f5f5f5',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                py: 2
                              }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {formData.items.map((item, index) => {
                              const itemTotals = calculateItemTotals(item);
                              const itemOptions =
                                item.purchase_item_type === 'GOODS' ? goods : services;

                              return (
                                <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                  {/* TYPE */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.purchase_item_type}
                                        onChange={(e) =>
                                          handleItemTypeChange(index, e.target.value)
                                        }
                                        sx={{
                                          height: 46,
                                          fontSize: '0.95rem'
                                        }}
                                      >
                                        <MenuItem value="GOODS" sx={{ fontSize: '0.95rem' }}>Goods</MenuItem>
                                        <MenuItem value="SERVICE" sx={{ fontSize: '0.95rem' }}>Service</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* ITEM */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.goods_services_id}
                                        onChange={(e) => {
                                          getGstRateForItem(e.target.value, item.purchase_item_type, index);
                                          handleItemSelection(
                                            index,
                                            e.target.value,
                                            item.purchase_item_type
                                          )
                                        }}
                                        displayEmpty
                                        sx={{
                                          height: 46,
                                          fontSize: '0.95rem'
                                        }}
                                      >
                                        <MenuItem value="" sx={{ fontSize: '0.95rem' }}>
                                          <em>Select {item.purchase_item_type === 'GOODS' ? 'Good' : 'Service'}</em>
                                        </MenuItem>
                                        {itemOptions.map((option) => (
                                          <MenuItem
                                            key={
                                              item.purchase_item_type === 'GOODS'
                                                ? option.goodsId
                                                : option.service_id
                                            }
                                            value={
                                              item.purchase_item_type === 'GOODS'
                                                ? option.goodsId
                                                : option.service_id
                                            }
                                            sx={{ fontSize: '0.95rem' }}
                                          >
                                            {item.purchase_item_type === 'GOODS'
                                              ? option.goodsName
                                              : option.service_name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* UNIT */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.unit_of_measurement_id}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            'unit_of_measurement_id',
                                            e.target.value
                                          )
                                        }
                                        displayEmpty
                                        disabled={units.length === 0}
                                        sx={{
                                          height: 46,
                                          fontSize: '0.95rem'
                                        }}
                                      >
                                        <MenuItem value="" sx={{ fontSize: '0.95rem' }}>
                                          <em>Select Unit</em>
                                        </MenuItem>
                                        {units.map((unit) => (
                                          <MenuItem
                                            key={unit.id}
                                            value={unit.id}
                                            sx={{ fontSize: '0.95rem' }}
                                          >
                                            {unit.name || unit.unitName}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* PRICE */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          'unit_price',
                                          e.target.value
                                        )
                                      }
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start"></InputAdornment>
                                        )
                                      }}
                                      inputProps={{
                                        min: 0,
                                        step: "0.01",
                                        style: {
                                          fontSize: '0.95rem',
                                          padding: '10px 8px'
                                        }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* QTY */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleItemChange(index, 'quantity', e.target.value)
                                      }
                                      inputProps={{
                                        min: 0,
                                        step: "0.01",
                                        style: {
                                          width: '122px',
                                          fontSize: '0.95rem',
                                          padding: '10px 8px'
                                        }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* Amount */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity && item.unit_price ? (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2) : '0.00'}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start"></InputAdornment>
                                        ),
                                        readOnly: true
                                      }}
                                      inputProps={{
                                        style: {
                                          width: '122px',
                                          fontSize: '0.95rem',
                                          fontWeight: 'bold',
                                          color: '#1976d2',
                                          padding: '10px 8px',
                                        }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* DISCOUNT */}
                                  <TableCell>
                                    <TextField
                                      value={item.discount}
                                      onChange={(e) =>
                                        handleItemChange(index, 'discount', e.target.value)
                                      }
                                      placeholder="10% or 100"
                                      inputProps={{
                                        style: {
                                          fontSize: '0.95rem',
                                          padding: '10px 8px'
                                        }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* Amount After Discount */}
                                  <TableCell sx={{display:"none"}}>
                                    <TextField
                                      type="number"
                                      value={itemTotals.amountAfterDiscount.toFixed(2)}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start"></InputAdornment>
                                        ),
                                        readOnly: true
                                      }}
                                      inputProps={{
                                        style: {
                                          width: '122px',
                                          fontSize: '0.95rem',
                                          fontWeight: 'bold',
                                          color: '#2e7d32',
                                          padding: '10px 8px'
                                        }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* GST - FIXED WITH CLEAR VISIBILITY */}
                                  <TableCell sx={{display:"none"}}>
                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                      <TextField
                                        type="number"
                                        value={item.gst_rate}
                                        onChange={(e) =>
                                          handleItemChange(index, 'gst_rate', e.target.value)
                                        }
                                        inputProps={{
                                          min: 0,
                                          max: 100,
                                          step: "0.01",
                                          style: {
                                            width: '100px',
                                            fontSize: '0.95rem',
                                            padding: '10px 28px 10px 8px',
                                          }
                                        }}
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                        sx={{
                                          '& .MuiInputBase-input': {
                                            pr: 4
                                          }
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          right: 12,
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          color: 'text.secondary',
                                          fontSize: '0.95rem',
                                          pointerEvents: 'none'
                                        }}
                                      >
                                        %
                                      </Box>
                                    </Box>
                                  </TableCell>

                                  {/* TOTAL */}
                                  <TableCell sx={{display:""}}>
                                    <Box sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      height: '100%',
                                      minHeight: 46
                                    }}>
                                      <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        sx={{
                                          color: '#d32f2f',
                                          fontSize: '1rem'
                                        }}
                                      >
                                        {itemTotals.total.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  {/* ACTION */}
                                  <TableCell align="center">
                                    <IconButton
                                      size="medium"
                                      onClick={() => removeItem(index)}
                                      color="error"
                                      sx={{
                                        bgcolor: '#ffebee',
                                        '&:hover': { bgcolor: '#ffcdd2' }
                                      }}
                                    >
                                      <DeleteIcon fontSize="medium" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Totals Summary */}
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Totals Summary" />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Sales Amount (After Discount):
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {totals.salesAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Taxable Amount:
                    </Typography>
                    <Typography variant="body1">
                      {totals.taxableAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Exempt Amount:
                    </Typography>
                    <Typography variant="body1">
                      {totals.exemptAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      GST Amount:
                    </Typography>
                    <Typography variant="body1">
                      {totals.gstAmountTotal.toFixed(2)}
                    </Typography>
                  </Box> */}
                  <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight="bold">
                        Total Invoice Amount:
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {totals.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || formData.items.length === 0}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Creating...' : 'Create Purchase'}
              </Button>

              <Link href="/purchase">
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "red",
                    "&:hover": { backgroundColor: "#cc0000" }
                  }}
                >
                  Cancel
                </Button>
              </Link>
            </Box>
          </form>
        </Grid>
      </Grid>
    </Box>
  );
}