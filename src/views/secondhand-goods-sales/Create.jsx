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
  Divider,
  Autocomplete
} from '@mui/material';
import Link from 'next/link';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PartyCreate from '../party/Create';

// Updated Payment mode options based on your requirements
const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'PAYMENT_GATEWAY', label: 'Payment Gateway' },
  { value: 'MBOB', label: 'mBOB' },
  { value: 'MPAY', label: 'mPAY' },
  { value: 'TPAY', label: 'TPay' },
  { value: 'DRUKPAY', label: 'DrukPay' },
  { value: 'EPAY', label: 'ePay' },
  { value: 'DK_BANK', label: 'DK Bank' },
];

// Bank options for Cheque payment
const BANK_OPTIONS = [
  { value: 'Bank of Bhutan', label: 'Bank of Bhutan' },
  { value: 'Bhutan National Bank', label: 'Bhutan National Bank' },
  { value: 'Druk PNB', label: 'Druk PNB' },
  { value: 'BDBL', label: 'BDBL' },
  { value: 'T Bank', label: 'T Bank' },
];

export default function Create() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    organization_id: 1,
    customer_id: '',
    currency: '2',
    customer_tpn: '',
    customer_name: '',
    sales_date: new Date().toISOString().split('T')[0],
    created_by: 1,
    status: 'IP',
    items: [],
    // New fields
    create_new_customer: false,
    new_customer_data: null,
    party_type: 'INDIVIDUAL',
    // Payment fields (updated according to your model)
    payment_mode: '',
    transaction_id: '', // For PAYMENT_GATEWAY
    journal_number: '', // For MBOB, MPAY, TPAY, DRUKPAY, EPAY, DK_BANK
    cheque_number: '', // For CHEQUE
    bank_name: '', // For CHEQUE
  });

  // Search and customer state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Individual customer fields (always shown for individual type)
  const [individualCustomerFields, setIndividualCustomerFields] = useState({
    cid: '',
    taxPayerRegion: '',
    email: '',
    phone: ''
  });

  // Dropdown data states
  const [parties, setParties] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredInventoryItems, setFilteredInventoryItems] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [allGst, setAllGst] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // New item template
  const newItemTemplate = {
    sales_item_type: 'GOODS',
    inventory_id: '',
    goods_services_id: '',
    goods_service_name: '',
    goods_service_description: '',
    unit_of_measurement_id: '',
    unit_price: 0,
    exiting_price: 0,
    quantity: 1,
    discount: '',
    gst_rate: 0,
    available_quantity: 0, // Track available stock for validation
  };

  const [partyTypeFilter, setPartyTypeFilter] = useState('INDIVIDUAL');
  const [open, setOpen] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  // Clear search when party type changes
  useEffect(() => {
    setSearchQuery('');
    setFormData(prev => ({
      ...prev,
      customer_id: '',
      customer_name: '',
      customer_tpn: '',
      party_type: partyTypeFilter,
      create_new_customer: false,
      new_customer_data: null
    }));
    setIndividualCustomerFields({
      cid: '',
      taxPayerRegion: '',
      email: '',
      phone: ''
    });
  }, [partyTypeFilter]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        const [
          partiesRes,
          inventoryRes,
          currencyRes,
          unitsRes,
          gstRes
        ] = await Promise.all([
          fetch('/api/party/list?page=1&limit=1000&partyType=' + partyTypeFilter),
          fetch('/api/inventory/list?page=1&limit=1000'),
          fetch('/api/currency/list?page=1&limit=1000'),
          fetch('/api/unit/list?page=1&limit=1000'),
          fetch('/api/map-gst-rates/list?page=1&limit=1000&sortBy=mappingId&sortDir=asc'),
        ]);

        const partiesData = await partiesRes.json();
        const inventoryData = await inventoryRes.json();
        const currencyData = await currencyRes.json();
        const unitsData = await unitsRes.json();
        const allGstData = await gstRes.json();

        setParties(partiesData.parties || []);
        setInventoryItems(inventoryData.data || []);
        setCurrencies(currencyData.rates);
        setUnits(unitsData.units);
        setAllGst(allGstData.data);

        // Filter and group inventory items by name
        processInventoryItems(inventoryData.data || []);

      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        toast.error('Failed to load dropdown data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [partyTypeFilter]);

  // Process inventory items to group by name
  const processInventoryItems = (items) => {
    // Group items by goods/service name and type
    const groupedItems = {};

    items.forEach(item => {
      const key = item.goods_service_name || (item.goods?.goodsName || item.service?.service_name);
      if (!key) return;

      // Determine item type
      const itemType = item.goods_id ? 'GOODS' : 'SERVICE';

      // Create unique key with type to separate same name across types
      const uniqueKey = `${key}_${itemType}`;

      if (!groupedItems[uniqueKey]) {
        groupedItems[uniqueKey] = {
          name: key,
          type: itemType,
          goods_id: item.goods_id,
          service_id: item.service_id,
          total_qty: 0,  // Start with 0
          variants: []
        };
      }

      // Add variant
      groupedItems[uniqueKey].variants.push({
        id: item.id,
        price: parseFloat(item.price || 0),
        qty: parseFloat(item.qty || 0),
        unit_id: item.unit_id,
        unit_name: item.unit?.name || item.unit?.unitName || '',
        goods_id: item.goods_id,
        service_id: item.service_id,
        goods_service_id: item.goods_id || item.service_id
      });

      // Update total quantity by summing all variants
      groupedItems[uniqueKey].total_qty = groupedItems[uniqueKey].variants.reduce(
        (sum, variant) => sum + variant.qty,
        0
      );
    });

    console.log('Processed items:', groupedItems);

    setFilteredInventoryItems(Object.values(groupedItems));
  };

  // Get search placeholder based on party type
  const getSearchPlaceholder = () => {
    switch (partyTypeFilter) {
      case 'INDIVIDUAL':
        return 'Search by Name, CID, or TPN';
      case 'BUSINESS':
        return 'Search by Business Name, License No, or TPN';
      case 'CORPORATION':
        return 'Search by Corporation Name or TPN';
      case 'GOVERNMENT_AGENCY':
        return 'Search by Agency Name or TPN';
      case 'CSO':
        return 'Search by CSO Name, Registration No, or TPN';
      default:
        return 'Search customer';
    }
  };

  // Handle customer search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter search query');
      return;
    }

    setIsSearching(true);

    const query = searchQuery.toLowerCase().trim();
    const filteredParties = parties.filter(party => {
      const { displayName, details = {} } = party;

      // Search in common fields
      const searchFields = [
        displayName,
        details.name,
        details.businessName,
        details.corporationName,
        details.agencyName,
        details.csoName,
        details.cid,
        details.taxPayerRegNo,
        details.licenseNo,
        details.companyRegistrationNo,
        details.csoRegistrationNo
      ];

      return searchFields.some(field =>
        field && field.toString().toLowerCase().includes(query)
      );
    });

    if (filteredParties.length === 0) {
      toast.info('No customer found. You can enter customer details manually.');
    } else {
      // If found, select the first customer
      const customer = filteredParties[0];
      setFormData(prev => ({
        ...prev,
        customer_id: customer.partyId,
        customer_name: customer.displayName || customer.details?.name || customer.details?.businessName || '',
        customer_tpn: customer.details?.taxPayerRegNo || '',
        create_new_customer: false,
        new_customer_data: null,
        party_type: partyTypeFilter
      }));

      // For individual, also populate individual fields if available
      if (partyTypeFilter === 'INDIVIDUAL') {
        setIndividualCustomerFields({
          cid: customer.details?.cid || '',
          taxPayerRegion: customer.details?.taxPayerRegion || '',
          email: customer.details?.email || '',
          phone: customer.details?.phone || ''
        });
      }

      toast.success('Customer found and selected!');
    }

    setIsSearching(false);
  };

  // Handle individual customer field change
  const handleIndividualFieldChange = (field, value) => {
    setIndividualCustomerFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle payment mode change
  const handlePaymentModeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      payment_mode: value,
      // Clear dependent fields when payment mode changes
      transaction_id: '',
      journal_number: '',
      cheque_number: '',
      bank_name: ''
    }));
  };

  // Handle item type change
  const handleItemTypeChange = useCallback((index, type) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItemTemplate,
        sales_item_type: type,
      };
      return { ...prev, items: newItems };
    });
  }, []);

  // Handle item name selection (Step 1: Select item name)
  const handleItemNameSelection = useCallback((index, itemName) => {
    // Find the selected item group
    const itemGroup = filteredInventoryItems.find(item => item.name === itemName);

    if (!itemGroup) return;

    // Update item with basic info
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        goods_service_name: itemName,
        sales_item_type: itemGroup.type,
        // Reset other fields
        inventory_id: '',
        goods_services_id: '',
        unit_price: 0,
        exiting_price: 0,
        unit_of_measurement_id: '',
        available_quantity: 0,
        gst_rate: 0,
      };
      return { ...prev, items: newItems };
    });
  }, [filteredInventoryItems]);

  // Handle price selection (Step 2: Select price variant)
  const handlePriceSelection = useCallback((index, inventoryId) => {
    // Get the current item to know its type
    setFormData(prev => {
      const newItems = [...prev.items];
      const currentItem = newItems[index];
      const itemName = currentItem.goods_service_name;

      // Find the item group
      const itemGroup = filteredInventoryItems.find(item => item.name === itemName);
      if (!itemGroup) return prev;

      // Find the selected variant
      const selectedVariant = itemGroup.variants.find(v => v.id === parseInt(inventoryId));
      if (!selectedVariant) return prev;

      // Update item with variant details
      newItems[index] = {
        ...currentItem,
        inventory_id: selectedVariant.id,
        goods_services_id: selectedVariant.goods_service_id,
        unit_price: selectedVariant.price,
        exiting_price: selectedVariant.price,
        unit_of_measurement_id: selectedVariant.unit_id,
        available_quantity: selectedVariant.qty,
        gst_rate: 0, // Will be updated by getGstRateForItem
      };

      return { ...prev, items: newItems };
    });

    // Now fetch GST rate for this item
    // We need to get the updated form data to access the sales_item_type
    setTimeout(() => {
      setFormData(prev => {
        const currentItem = prev.items[index];
        if (!currentItem.goods_services_id) return prev;

        // Call getGstRateForItem with current data
        getGstRateForItem(
          currentItem.goods_services_id,
          currentItem.sales_item_type,
          index
        );

        return prev;
      });
    }, 0);
  }, [filteredInventoryItems]);

  // Get GST rate for item
  const getGstRateForItem = useCallback((goodsServicesId, salesItemType, index) => {
    let gstRate = 0;
    const mapping = allGst.find(m =>
      m.serviceGoodsId === parseInt(goodsServicesId) &&
      m.type === salesItemType
    );

    if (mapping) {
      gstRate = mapping.rate ? mapping.rate.gstRate : 0;
    }

    setFormData(prev => {
      const newItems = [...prev.items];
      if (newItems[index]) {
        newItems[index] = {
          ...newItems[index],
          gst_rate: gstRate,
        };
      }
      return { ...prev, items: newItems };
    });
  }, [allGst]);

  // Handle item input change
  const handleItemChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      if (!newItems[index]) return prev;

      newItems[index][field] = value;

      // Validate quantity doesn't exceed available stock
      if (field === 'quantity') {
        const quantity = parseFloat(value) || 0;
        const availableQty = parseFloat(newItems[index].available_quantity) || 0;

        if (quantity > availableQty) {
          toast.error(`Cannot sell ${quantity} units. Only ${availableQty} units available in stock.`);
          // Reset to available quantity
          newItems[index][field] = availableQty;
        }
      }

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

  // Calculate item totals
  const calculateItemTotals = useCallback((item) => {
    const unitPrice = parseFloat(item.unit_price) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    const gstRate = parseFloat(item.gst_rate) || 0;

    const amount = unitPrice * quantity;

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

  // Calculate overall totals
  const calculateTotals = useCallback(() => {
    let totalAmount = 0;
    let exemptAmount = 0;
    let taxableAmount = 0;

    formData.items.forEach(item => {
      const itemTotals = calculateItemTotals(item);
      totalAmount += itemTotals.total;

      const gstRate = parseFloat(item.gst_rate) || 0;
      if (gstRate === 0) {
        exemptAmount += itemTotals.total;
      } else {
        taxableAmount += itemTotals.total;
      }
    });

    return { totalAmount, exemptAmount, taxableAmount };
  }, [formData.items, calculateItemTotals]);

  // Validate form
  const validateForm = useCallback(() => {
    // Validate customer information
    if (partyTypeFilter === 'INDIVIDUAL') {
      // For individual, always need name
      if (!formData.customer_name?.trim()) {
        toast.error('Please enter customer name');
        return false;
      }
    } else {
      // For other types, need customer ID (either from search or existing)
      if (!formData.customer_id) {
        toast.error('Please select a customer');
        return false;
      }
    }

    // Validate payment fields based on payment mode
    if (!formData.payment_mode) {
      toast.error('Please select payment mode');
      return false;
    }

    // // Validate based on payment mode
    // switch (formData.payment_mode) {
    //   case 'PAYMENT_GATEWAY':
        
        

    //   case 'MBOB':
    //   case 'MPAY':
    //   case 'TPAY':
    //   case 'DRUKPAY':
    //   case 'EPAY':
    //   case 'DK_BANK':
               

    //   case 'CHEQUE':
        
       

    //   case 'CASH':
    //     // No additional validation needed for cash
    //     break;

    //   default:
    //     // Handle any other payment modes
    //     break;
    // }

    // Validate other fields
    if (!formData.currency) {
      toast.error('Please select a currency');
      return false;
    }

    if (!formData.sales_date) {
      toast.error('Please select a sales date');
      return false;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    // Validate items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];

      if (!item.goods_service_name) {
        toast.error(`Please select an item name for item ${i + 1}`);
        return false;
      }

      if (!item.inventory_id) {
        toast.error(`Please select a price variant for item ${i + 1}`);
        return false;
      }

      const quantity = parseFloat(item.quantity) || 0;
      const availableQty = parseFloat(item.available_quantity) || 0;

      if (quantity > availableQty) {
        toast.error(`Cannot sell ${quantity} units of ${item.goods_service_name}. Only ${availableQty} units available in stock.`);
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
  }, [formData, partyTypeFilter]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare items for backend
      const itemsForBackend = formData.items.map(item => {
        const itemTotals = calculateItemTotals(item);

        return {
          sales_item_type: item.sales_item_type,
          inventory_id: parseInt(item.inventory_id),
          goods_services_id: parseInt(item.goods_services_id),
          goods_service_name: item.goods_service_name,
          goods_service_description: item.goods_service_description || '',
          unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
          unit_price: parseFloat(item.unit_price),
          exiting_price: parseFloat(item.exiting_price),
          quantity: parseFloat(item.quantity),
          discount: item.discount || '',
          gst_rate: parseFloat(item.gst_rate) || 0,
        };
      });

      // Prepare new customer data for individual
      let newCustomerData = null;
      let createNewCustomer = false;

      if (partyTypeFilter === 'INDIVIDUAL' && !formData.customer_id) {
        // Creating new individual customer
        createNewCustomer = true;
        newCustomerData = {
          name: formData.customer_name,
          cid: individualCustomerFields.cid,
          taxPayerRegNo: formData.customer_tpn,
          taxPayerRegion: individualCustomerFields.taxPayerRegion,
          email: individualCustomerFields.email,
          phone: individualCustomerFields.phone,
          taxPayerRegStatus: 'NO'
        };
      }

      // Prepare payload with updated payment fields
      const payload = {
        ...formData,
        items: itemsForBackend,
        create_new_customer: createNewCustomer,
        new_customer_data: newCustomerData,
        party_type: partyTypeFilter
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('/api/secondhand-sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Second hand sale created successfully!');

        // try {
        //   await fetch('/api/invoice/create', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //       second_hand_sales_id: data.data.second_hand_sales_id,
        //     }),
        //   });
        // } catch (error) {
        //   console.error('API call failed', error);
        // }

        // router.push(`/api/invoice/pdf/${data.data.second_hand_sales_id}`);
        router.push(`/api/secondhandgood-original-invoice/${data.data.second_hand_sales_id}`);

      } else {
        toast.error(data.error || 'Failed to create sale');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Error creating sale. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
            Create New Second Hand Sale
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Customer Information Section */}
              <Grid item xs={12} md={12}>
                <Card>
                  <CardHeader title="Customer Information" />
                  <Button
                    sx={{ position: 'absolute', top: 106, right: 50 }}
                    variant="contained"
                    onClick={handleOpen}
                  >
                    Add Party
                  </Button>

                  <Dialog
                    open={open}
                    onClose={handleClose}
                    fullWidth
                    maxWidth="md"
                  >
                    <DialogTitle sx={{ m: 0, p: 2 }}>
                      Create New Party
                      <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: 8
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                      <PartyCreate onSuccess={handleClose} />
                    </DialogContent>
                  </Dialog>
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Customer Type */}
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel id="party-type-label">
                            Customer Type
                          </InputLabel>
                          <Select
                            labelId="party-type-label"
                            value={partyTypeFilter}
                            label="Customer Type"
                            onChange={(e) => setPartyTypeFilter(e.target.value)}
                          >
                            <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                            <MenuItem value="BUSINESS">Business</MenuItem>
                            <MenuItem value="GOVERNMENT_AGENCY">Government Agency</MenuItem>
                            <MenuItem value="CORPORATION">Corporation</MenuItem>
                            <MenuItem value="CSO">CSO</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Search Section - For ALL party types */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            label={getSearchPlaceholder()}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={getSearchPlaceholder()}
                            variant="outlined"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearch();
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            startIcon={isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                            sx={{ minWidth: '120px', height: '56px' }}
                          >
                            {isSearching ? 'Searching...' : 'Search'}
                          </Button>
                        </Box>
                      </Grid>

                      {/* Customer Details Fields */}
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                          Customer Details
                        </Typography>
                      </Grid>

                      {/* Customer Name */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer Name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                          variant="outlined"
                          required
                           InputProps={{
                            readOnly: partyTypeFilter !== 'INDIVIDUAL'
                          }}
                        />
                      </Grid>

                      {/* TPN */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Taxpayer Registration No (TPN)"
                          value={formData.customer_tpn}
                          onChange={(e) => setFormData(prev => ({ ...prev, customer_tpn: e.target.value }))}
                          variant="outlined"
                          placeholder="Tpn"
                          InputProps={{
                            readOnly: partyTypeFilter !== 'INDIVIDUAL'
                          }}

                        />
                      </Grid>

                      {/* Individual Customer Additional Fields (always shown for individual type) */}
                      {partyTypeFilter === 'INDIVIDUAL' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="CID (Citizen ID)"
                              value={individualCustomerFields.cid}
                              onChange={(e) => handleIndividualFieldChange('cid', e.target.value)}
                              variant="outlined"
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              required
                              fullWidth
                              select
                              label="Tax Payer Region"
                              value={individualCustomerFields.taxPayerRegion}
                              onChange={(e) =>
                                handleIndividualFieldChange('taxPayerRegion', e.target.value)
                              }
                              variant="outlined"
                            >
                              <MenuItem value="RRCO Thimphu">RRCO Thimphu</MenuItem>
                              <MenuItem value="RRCO Paro">RRCO Paro</MenuItem>
                              <MenuItem value="RRCO Phuntsholing">RRCO Phuntsholing</MenuItem>
                              <MenuItem value="RRCO Samtse">RRCO Samtse</MenuItem>
                              <MenuItem value="RRCO Gelephu">RRCO Gelephu</MenuItem>
                              <MenuItem value="RRCO Samdrupjongkhar">RRCO Samdrupjongkhar</MenuItem>
                              <MenuItem value="RRCO Mongar">RRCO Mongar</MenuItem>
                              <MenuItem value="RRCO Bumthang">RRCO Bumthang</MenuItem>
                            </TextField>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Email"
                              type="email"
                              value={individualCustomerFields.email}
                              onChange={(e) => handleIndividualFieldChange('email', e.target.value)}
                              variant="outlined"
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Phone"
                              value={individualCustomerFields.phone}
                              onChange={(e) => handleIndividualFieldChange('phone', e.target.value)}
                              variant="outlined"
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sale Details & Payment Section */}
              <Grid item xs={12} md={12}>
                <Card sx={{ mt: 3 }}>
                  <CardHeader title="Sale & Payment Details" />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Sales Date */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Sales Date"
                          type="date"
                          value={formData.sales_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, sales_date: e.target.value }))}
                          required
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      {/* Currency */}
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Currency</InputLabel>
                          <Select
                            value={formData.currency}
                            label="Currency"
                            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
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
                        </FormControl>
                      </Grid>

                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sale Items */}
              <Grid item xs={12}>
                <Card sx={{ overflow: 'visible', mt: 3 }}>
                  <CardHeader
                    title={
                      <Typography variant="h5" fontWeight="bold">
                        Sale Items (From Inventory)
                      </Typography>
                    }
                    subheader="Select items from available inventory stock"
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
                          Click "Add Item" to start adding items from inventory
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
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Type</TableCell>
                              <TableCell sx={{ minWidth: 200, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Item Name</TableCell>
                              <TableCell sx={{ minWidth: 180, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Price Variant</TableCell>
                              <TableCell sx={{ minWidth: 120, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Unit</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Unit Price</TableCell>
                              <TableCell sx={{ minWidth: 100, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Qty</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Amount</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Discount</TableCell>
                              <TableCell sx={{ display: "none", minWidth: 160, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>After Discount</TableCell>
                              <TableCell sx={{ display: "none", minWidth: 120, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>GST %</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Total</TableCell>
                              <TableCell sx={{ minWidth: 100, bgcolor: '#f5f5f5', fontWeight: 'bold' }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {formData.items.map((item, index) => {
                              const itemTotals = calculateItemTotals(item);

                              // Filter inventory items by selected type
                              const filteredByType = filteredInventoryItems.filter(
                                invItem => invItem.type === item.sales_item_type
                              );

                              // Find the selected item group
                              const selectedItemGroup = filteredByType.find(
                                invItem => invItem.name === item.goods_service_name
                              );

                              // Get available variants for the selected item
                              const availableVariants = selectedItemGroup?.variants || [];

                              return (
                                <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                  {/* TYPE */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.sales_item_type}
                                        onChange={(e) => handleItemTypeChange(index, e.target.value)}
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="GOODS">Goods</MenuItem>
                                        <MenuItem value="SERVICE">Service</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* ITEM NAME */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.goods_service_name}
                                        onChange={(e) => handleItemNameSelection(index, e.target.value)}
                                        displayEmpty
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="">
                                          <em>Select Item</em>
                                        </MenuItem>
                                        {filteredByType.map((invItem) => (
                                          <MenuItem
                                            key={invItem.name}
                                            value={invItem.name}
                                          >
                                            {invItem.name} ({invItem.type}) - Available: {invItem.total_qty}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* PRICE VARIANT */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.inventory_id}
                                        onChange={(e) => handlePriceSelection(index, e.target.value)}
                                        displayEmpty
                                        disabled={!item.goods_service_name}
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="">
                                          <em>Select Price</em>
                                        </MenuItem>
                                        {availableVariants.map((variant) => (
                                          <MenuItem
                                            key={variant.id}
                                            value={variant.id}
                                          >
                                            ₹{variant.price} (Stock: {variant.qty}, Unit: {variant.unit_name})
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* UNIT (Display only, auto-set from price selection) */}
                                  <TableCell>
                                    <TextField
                                      value={units.find(u => u.id === item.unit_of_measurement_id)?.name || ''}
                                      InputProps={{
                                        readOnly: true
                                      }}
                                      inputProps={{
                                        style: { fontSize: '0.95rem', padding: '10px 8px' }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* PRICE */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                      inputProps={{
                                        min: 0,
                                        step: "0.1",
                                        style: { fontSize: '0.95rem', padding: '10px 8px' }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* QTY with validation */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                      inputProps={{
                                        min: 1,
                                        max: item.available_quantity,
                                        step: "0.01",
                                        style: { fontSize: '0.95rem', padding: '10px 8px' }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                      error={parseFloat(item.quantity) > parseFloat(item.available_quantity)}
                                      helperText={parseFloat(item.quantity) > parseFloat(item.available_quantity)
                                        ? `Max: ${item.available_quantity}`
                                        : `Available: ${item.available_quantity}`}
                                    />
                                  </TableCell>

                                  {/* Amount */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity && item.unit_price ? (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2) : '0.00'}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        readOnly: true
                                      }}
                                      inputProps={{
                                        style: {
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
                                  {/* <TableCell>
                                    <TextField
                                      value={item.discount}
                                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                      placeholder="10% or 100"
                                      inputProps={{ style: { fontSize: '0.95rem', padding: '10px 8px' } }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell> */}

                                  <TableCell>
                                    <TextField
                                      value={item.discount ?? ''}
                                      onChange={(e) => {
                                        let value = e.target.value;

                                        // allow only digits
                                        if (!/^\d*$/.test(value)) return;

                                        // remove leading zero if more than one digit
                                        if (value.length > 1 && value.startsWith('0')) {
                                          value = value.replace(/^0+/, '');
                                        }

                                        handleItemChange(index, 'discount', value);
                                      }}
                                      placeholder="Enter discount"
                                      inputProps={{
                                        inputMode: 'numeric',
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
                                  <TableCell sx={{ display: "none" }}>
                                    <TextField
                                      type="number"
                                      value={itemTotals.amountAfterDiscount.toFixed(2)}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
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

                                  {/* GST */}
                                  <TableCell sx={{ display: "none" }}>
                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                      <TextField
                                        type="number"
                                        value={item.gst_rate}
                                        onChange={(e) => handleItemChange(index, 'gst_rate', e.target.value)}
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
                                  <TableCell sx={{ display: "" }}>
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
                                        ₹{itemTotals.total.toFixed(2)}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ₹{totals.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>



            {/* Payment Mode */}
            {formData.items.length > 0 && (
              <Grid item xs={12} md={12}>
                <Card sx={{ mt: 3 }}>
                  <CardHeader title="Payment Details" />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Payment Mode</InputLabel>
                          <Select
                            value={formData.payment_mode}
                            label="Payment Mode"
                            onChange={(e) => handlePaymentModeChange(e.target.value)}
                          >
                            <MenuItem value="">
                              <em>Select payment mode</em>
                            </MenuItem>
                            {PAYMENT_MODES.map((mode) => (
                              <MenuItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Transaction ID (only for PAYMENT_GATEWAY) */}
                      {formData.payment_mode === 'PAYMENT_GATEWAY' && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Transaction ID"
                            value={formData.transaction_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                            variant="outlined"
                            placeholder="Enter transaction ID"
                            
                          />
                        </Grid>
                      )}

                      {/* Journal No (for mBOB, mPAY, TPay, DrukPay, ePay, DK Bank) */}
                      {(formData.payment_mode === 'MBOB' ||
                        formData.payment_mode === 'MPAY' ||
                        formData.payment_mode === 'TPAY' ||
                        formData.payment_mode === 'DRUKPAY' ||
                        formData.payment_mode === 'EPAY' ||
                        formData.payment_mode === 'DK_BANK') && (
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Journal No"
                              value={formData.journal_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, journal_number: e.target.value }))}
                              variant="outlined"
                              placeholder="Enter journal number"
                              
                            />
                          </Grid>
                        )}

                      {/* Cheque Number (only for Cheque payment) */}
                      {formData.payment_mode === 'CHEQUE' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Cheque Number"
                              value={formData.cheque_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, cheque_number: e.target.value }))}
                              variant="outlined"
                              placeholder="Enter cheque number"
                              
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth >
                              <InputLabel>Bank</InputLabel>
                              <Select
                                value={formData.bank_name}
                                label="Bank"
                                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                              >
                                <MenuItem value="">
                                  <em>Select bank</em>
                                </MenuItem>
                                {BANK_OPTIONS.map((bank) => (
                                  <MenuItem key={bank.value} value={bank.value}>
                                    {bank.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}




            {/* Form Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || formData.items.length === 0}
                startIcon={loading && <CircularProgress size={20} />}
                sx={{ px: 4 }}
              >
                {loading ? 'Creating Sale...' : 'Create Sale'}
              </Button>

              <Link href="/secondhand-goods-sales" passHref>
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