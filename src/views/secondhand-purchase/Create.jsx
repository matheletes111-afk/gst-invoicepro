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
  Divider
} from '@mui/material';
import Link from 'next/link';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Search as SearchIcon, Inventory as InventoryIcon } from '@mui/icons-material';

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

export default function CreateSecondHandPurchase() {
  const router = useRouter();

  // Form state - Updated to match payment structure from first code
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
    // Updated payment fields (according to your model)
    payment_mode: '',
    transaction_id: '', // For PAYMENT_GATEWAY
    journal_number: '', // For MBOB, MPAY, TPAY, DRUKPAY, EPAY, DK_BANK
    cheque_number: '', // For CHEQUE
    bank_name: '', // For CHEQUE
  });

  // Search states
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [isSupplierSearching, setIsSupplierSearching] = useState(false);
  const [isDealerSearching, setIsDealerSearching] = useState(false);

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

  // New item template
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

  // Fetch dropdown data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        const [
          suppliersRes,
          dealersRes,
          goodsRes,
          servicesRes,
          currencyRes,
          unitsRes,
          gstRes
        ] = await Promise.all([
          fetch('/api/supplier/list?page=1&limit=1000'),
          fetch('/api/dealer/list?page=1&limit=1000'),
          fetch('/api/goods-catalog/list?page=1&limit=1000'),
          fetch('/api/service-catalog/list?page=1&limit=1000'),
          fetch('/api/currency/list?page=1&limit=1000'),
          fetch('/api/unit/list?page=1&limit=1000'),
          fetch('/api/map-gst-rates/list?page=1&limit=1000&sortBy=mappingId&sortDir=asc'),
        ]);

        const suppliersData = await suppliersRes.json();
        const dealersData = await dealersRes.json();
        const goodsData = await goodsRes.json();
        const servicesData = await servicesRes.json();
        const currencyData = await currencyRes.json();
        const unitsData = await unitsRes.json();
        const allGstData = await gstRes.json();

        setSuppliers(suppliersData.data || suppliersData.suppliers || []);
        setDealers(dealersData.data || dealersData.dealers || []);
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

  // Handle supplier search
  const handleSupplierSearch = () => {
    if (!supplierSearchQuery.trim()) {
      toast.error('Please enter supplier search query');
      return;
    }

    setIsSupplierSearching(true);

    const query = supplierSearchQuery.toLowerCase().trim();
    const filteredSuppliers = suppliers.filter(supplier => {
      const searchFields = [
        supplier.supplierName,
        supplier.businessName,
        supplier.contactName,
        supplier.taxpayerRegNo,
        supplier.businessLicenseNo,
        supplier.companyRegistrationNo,
        supplier.email,
        supplier.phone
      ];

      return searchFields.some(field =>
        field && field.toString().toLowerCase().includes(query)
      );
    });

    if (filteredSuppliers.length === 0) {
      toast.info('No supplier found. You can enter supplier details manually.');
    } else {
      // If found, select the first supplier
      const supplier = filteredSuppliers[0];
      setFormData(prev => ({
        ...prev,
        supplier_id: supplier.supplierId || supplier.id,
        supplier_name: supplier.supplierName || supplier.businessName || '',
        supplier_tpn: supplier.taxpayerRegNo || '',
      }));

      toast.success('Supplier found and selected!');
    }

    setIsSupplierSearching(false);
  };

  // Handle dealer search
  const handleDealerSearch = () => {
    if (!dealerSearchQuery.trim()) {
      toast.error('Please enter dealer search query');
      return;
    }

    setIsDealerSearching(true);

    const query = dealerSearchQuery.toLowerCase().trim();
    const filteredDealers = dealers.filter(dealer => {
      const searchFields = [
        dealer.dealerName,
        dealer.businessName,
        dealer.contactName,
        dealer.taxpayerRegNo,
        dealer.businessLicenseNo,
        dealer.companyRegistrationNo,
        dealer.email,
        dealer.phone
      ];

      return searchFields.some(field =>
        field && field.toString().toLowerCase().includes(query)
      );
    });

    if (filteredDealers.length === 0) {
      toast.info('No dealer found. You can enter dealer details manually.');
    } else {
      // If found, select the first dealer
      const dealer = filteredDealers[0];
      setFormData(prev => ({
        ...prev,
        dealer_id: dealer.dealerId || dealer.id,
        dealer_name: dealer.dealerName || dealer.businessName || '',
        dealer_tpn: dealer.taxpayerRegNo || '',
      }));

      toast.success('Dealer found and selected!');
    }

    setIsDealerSearching(false);
  };

  // Handle payment mode change - Updated from first code
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
    let gstAmountTotal = 0;
    let salesAmount = 0;
    let totalQuantity = 0;

    formData.items.forEach(item => {
      const itemTotals = calculateItemTotals(item);
      totalAmount += itemTotals.total;
      salesAmount += itemTotals.amountAfterDiscount;
      gstAmountTotal += itemTotals.gstAmount;
      totalQuantity += parseFloat(item.quantity) || 0;

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
      salesAmount,
      totalQuantity
    };
  }, [formData.items, calculateItemTotals]);

  // Validate form - Updated from first code
  const validateForm = useCallback(() => {
    if (!formData.supplier_id && !formData.supplier_name) {
      toast.error('Please select a supplier or enter supplier name');
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
    if (!formData.payment_mode) {
      toast.error('Please select payment mode');
      return false;
    }

    // Validate based on payment mode - Updated from first code
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

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    // Check for integer quantities (second hand items usually sold as whole units)
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

      // Check if quantity is a whole number (for second hand items)
      const quantity = parseFloat(item.quantity);
      if (!Number.isInteger(quantity)) {
        toast.error(`Quantity must be a whole number for second hand items (item ${i + 1})`);
        return false;
      }
    }

    return true;
  }, [formData]);

  // Get GST rate for item
  const getGstRateForItem = (goodsServicesId, purchaseItemType, index) => {
    let gstRate = 0;
    const mapping = allGst.find(m => m.serviceGoodsId === parseInt(goodsServicesId) && m.type === purchaseItemType);
    if (mapping) {
      gstRate = mapping.rate ? mapping.rate.gstRate : 0;
    }

    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        gst_rate: gstRate,
      };
      return { ...prev, items: newItems };
    });
  }

  // Handle form submission - Updated payload structure
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Calculate totals
      const totals = calculateTotals();

      // Prepare items for backend
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
          quantity: parseInt(item.quantity),
          amount: itemTotals.amount,
          discount: item.discount || '',
          amount_after_discount: itemTotals.amountAfterDiscount,
          gst_amount: itemTotals.gstAmount,
          gst_percentage: item.gst_rate.toString(),
          goods_service_total_amount: itemTotals.total,
        };
      });

      // Updated payload structure from first code
      const payload = {
        organization_id: formData.organization_id,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        supplier_name: formData.supplier_name,
        supplier_tpn: formData.supplier_tpn,
        dealer_id: formData.dealer_id ? parseInt(formData.dealer_id) : null,
        dealer_name: formData.dealer_name,
        dealer_tpn: formData.dealer_tpn,
        currency: parseInt(formData.currency),
        purchase_date: formData.purchase_date,
        purchase_order_no: formData.purchase_order_no,
        // Updated Payment fields from first code
        payment_mode: formData.payment_mode,
        transaction_id: formData.transaction_id,
        journal_number: formData.journal_number,
        cheque_number: formData.cheque_number,
        bank_name: formData.bank_name,
        // Totals
        sales_amount: totals.salesAmount,
        exempt_amount: totals.exemptAmount,
        taxable_amount: totals.taxableAmount,
        gst_amount: totals.gstAmountTotal,
        total_invoice_amount: totals.totalAmount,
        created_by: formData.created_by,
        items: itemsForBackend,
      };

      console.log('Second hand purchase payload:', payload);

      const response = await fetch('/api/secondhand-purchase/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear the form
        setFormData({
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
          // Reset payment fields
          payment_mode: '',
          transaction_id: '',
          journal_number: '',
          cheque_number: '',
          bank_name: ''
        });

        // Show only success toast
        toast.success('Second hand purchase created successfully!');

        // Redirect to purchase list after 1 second
        setTimeout(() => {
          router.push(`/api/secondhand-purchase/invoice/${data.data.purchase_id}`);
        }, 1000);
      } else {
        // Show error toast
        toast.error(data.error || 'Failed to create purchase');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creating purchase. Please try again.');
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Create Second Hand Purchase
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => router.push('/supplier/create')}
              >
                Add Supplier
              </Button>

            </Box>
          </Box>


        </Grid>

        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Supplier & Dealer Information */}
              <Grid item xs={12} md={12}>
                <Card>
                  <CardHeader
                    title="Supplier Information"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Supplier Search Section */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            label="Search Supplier (Name, License No, TPN)"
                            value={supplierSearchQuery}
                            onChange={(e) => setSupplierSearchQuery(e.target.value)}
                            placeholder="Search supplier by name, license, or TPN"
                            variant="outlined"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSupplierSearch();
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleSupplierSearch}
                            disabled={isSupplierSearching || !supplierSearchQuery.trim()}
                            startIcon={isSupplierSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                            sx={{ minWidth: '120px', height: '56px' }}
                          >
                            {isSupplierSearching ? 'Searching...' : 'Search'}
                          </Button>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                          Supplier Details
                        </Typography>
                      </Grid>

                      {/* Supplier Name */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Supplier Name *"
                          value={formData.supplier_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                          variant="outlined"
                          required
                           InputProps={{
                            readOnly: true
                          }}
                        />
                      </Grid>

                      {/* Supplier TPN */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Supplier Taxpayer Registration No"
                          value={formData.supplier_tpn}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_tpn: e.target.value }))}
                          variant="outlined"
                          placeholder="Supplier Tpn"
                           InputProps={{
                            readOnly: true
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 3 }}>
                  <CardHeader
                    title="Dealer Information (Optional)"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Dealer Search Section */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            label="Search Dealer (Name, License No, TPN)"
                            value={dealerSearchQuery}
                            onChange={(e) => setDealerSearchQuery(e.target.value)}
                            placeholder="Search dealer by name, license, or TPN"
                            variant="outlined"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleDealerSearch();
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleDealerSearch}
                            disabled={isDealerSearching || !dealerSearchQuery.trim()}
                            startIcon={isDealerSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                            sx={{ minWidth: '120px', height: '56px' }}
                          >
                            {isDealerSearching ? 'Searching...' : 'Search'}
                          </Button>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                          Dealer Details
                        </Typography>
                      </Grid>

                      {/* Dealer Name */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Dealer Name"
                          value={formData.dealer_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, dealer_name: e.target.value }))}
                          variant="outlined"
                           InputProps={{
                            readOnly: true
                          }}
                        />
                      </Grid>

                      {/* Dealer TPN */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Dealer Taxpayer Registration No"
                          value={formData.dealer_tpn}
                          onChange={(e) => setFormData(prev => ({ ...prev, dealer_tpn: e.target.value }))}
                          variant="outlined"
                          placeholder="Dealer Tpn"
                           InputProps={{
                            readOnly: true
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Purchase Details */}
                <Card sx={{ mt: 3 }}>
                  <CardHeader
                    title="Purchase Details"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Purchase Date */}
                      <Grid item xs={12} md={6}>
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
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Currency *</InputLabel>
                          <Select
                            value={formData.currency}
                            label="Currency *"
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

              {/* Second Hand Purchase Items Table */}
              <Grid item xs={12}>
                <Card sx={{ overflow: 'visible', mt: 3 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon color="primary" />
                        <Typography variant="h5" fontWeight="bold">
                          Second Hand Items
                        </Typography>
                      </Box>
                    }

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
                          Click "Add Item" to start adding second hand items
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
                              <TableCell sx={{ minWidth: 200, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Item</TableCell>
                              <TableCell sx={{ minWidth: 120, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Unit</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Unit Price</TableCell>
                              <TableCell sx={{ minWidth: 100, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Qty</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Amount</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Discount</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Total</TableCell>
                              <TableCell sx={{ minWidth: 100, bgcolor: '#f5f5f5', fontWeight: 'bold' }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {formData.items.map((item, index) => {
                              const itemTotals = calculateItemTotals(item);
                              const itemOptions = item.purchase_item_type === 'GOODS' ? goods : services;

                              return (
                                <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                  {/* TYPE */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.purchase_item_type}
                                        onChange={(e) => handleItemTypeChange(index, e.target.value)}
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="GOODS">Goods</MenuItem>
                                        <MenuItem value="SERVICE">Service</MenuItem>
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
                                          handleItemSelection(index, e.target.value, item.purchase_item_type)
                                        }}
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="" sx={{ fontSize: '0.95rem' }}>
                                          <em>Select {item.purchase_item_type === 'GOODS' ? 'Good' : 'Service'}</em>
                                        </MenuItem>
                                        {itemOptions.map((option) => (
                                          <MenuItem
                                            key={item.purchase_item_type === 'GOODS' ? option.goodsId : option.service_id}
                                            value={item.purchase_item_type === 'GOODS' ? option.goodsId : option.service_id}
                                            sx={{ fontSize: '0.95rem' }}
                                          >
                                            {item.purchase_item_type === 'GOODS' ? option.goodsName : option.service_name}
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
                                        onChange={(e) => handleItemChange(index, 'unit_of_measurement_id', e.target.value)}
                                        sx={{ width: '122px', height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="" sx={{ fontSize: '0.95rem' }}>
                                          <em>Select Unit</em>
                                        </MenuItem>
                                        {units.map((unit) => (
                                          <MenuItem key={unit.id} value={unit.id} sx={{ fontSize: '0.95rem' }}>
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
                                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                      InputProps={{ startAdornment: <InputAdornment position="start"></InputAdornment> }}
                                      inputProps={{
                                        min: 0,
                                        step: "0.01",
                                        style: { fontSize: '0.95rem', padding: '10px 8px' }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* QTY - Integer only for second hand */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // Ensure integer value
                                        if (value === '' || /^\d+$/.test(value)) {
                                          handleItemChange(index, 'quantity', value);
                                        }
                                      }}
                                      inputProps={{
                                        min: 1,
                                        step: "0.01",
                                        style: { fontSize: '0.95rem', padding: '10px 8px' }
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
                                        startAdornment: <InputAdornment position="start"></InputAdornment>,
                                        readOnly: true
                                      }}
                                      inputProps={{
                                        style: {
                                          width: '122px',
                                          fontSize: '0.95rem',
                                          fontWeight: 'bold',
                                          color: '#1976d2',
                                          padding: '10px 8px'
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
                                      value={item.discount || 0}
                                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                      placeholder="10% or 100"
                                      inputProps={{
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


                                  {/* TOTAL */}
                                  <TableCell>
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
                  <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight="bold">
                        Total Purchase Amount:
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {totals.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Payment Mode - Placed after totals summary like in first code */}
            {formData.items.length > 0 && (
              <Grid item xs={12} md={12}>
                <Card sx={{ mt: 3 }}>
                  <CardHeader title=" Payment Details" />
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
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

              <Button
                type="submit"
                variant="contained"
                disabled={loading || formData.items.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <InventoryIcon />}
                sx={{ px: 4 }}
              >
                {loading ? 'Save...' : 'Save'}
              </Button>

              {/*<Button
                  variant="outlined"
                  onClick={() => router.back()}
                  sx={{
                      backgroundColor: "red",color:"white",
                      "&:hover": { backgroundColor: "red" }
                    }}
                >
                  Cancel
                </Button>*/}

              <Button
                variant="contained"
                onClick={() => router.back()}
                sx={{
                  backgroundColor: "red",
                  "&:hover": { backgroundColor: "#cc0000" }
                }}
              >
                Cancel
              </Button>

            </Box>
          </form>
        </Grid>
      </Grid>
    </Box>
  );
}