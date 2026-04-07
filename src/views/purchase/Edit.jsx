"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Search as SearchIcon, Save as SaveIcon } from '@mui/icons-material';

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

export default function EditPurchase() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id;

  // Form state - Updated to match create structure
  const [formData, setFormData] = useState({
    purchase_id: purchaseId,
    organization_id: 1,
    supplier_id: '',
    dealer_id: '',
    currency: '',
    supplier_tpn: '',
    supplier_name: '',
    dealer_tpn: '',
    dealer_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_order_no: '',
    created_by: 1,
    items: [],
    // New fields like sales
    create_new_customer: false,
    new_customer_data: null,
    party_type: 'SUPPLIER',
    // Updated payment fields
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
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [allGst, setAllGst] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(true);

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

  // Fetch all data
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
          purchaseRes,
          gstRes
        ] = await Promise.all([
          fetch('/api/supplier/list?page=1&limit=1000'),
          fetch('/api/dealer/list?page=1&limit=1000'),
          fetch('/api/goods-catalog/list?page=1&limit=1000'),
          fetch('/api/service-catalog/list?page=1&limit=1000'),
          fetch('/api/currency/list?page=1&limit=1000'),
          fetch('/api/unit/list?page=1&limit=1000'),
          fetch(`/api/purchase/${purchaseId}`),
          fetch('/api/map-gst-rates/list?page=1&limit=1000&sortBy=mappingId&sortDir=asc'),
        ]);

        const suppliersData = await suppliersRes.json();
        const dealersData = await dealersRes.json();
        const goodsData = await goodsRes.json();
        const servicesData = await servicesRes.json();
        const currencyData = await currencyRes.json();
        const unitsData = await unitsRes.json();
        const purchaseData = await purchaseRes.json();
        const allGstData = await gstRes.json();

        setSuppliers(suppliersData.data || suppliersData.suppliers || []);
        setDealers(dealersData.data || dealersData.dealers || []);
        setGoods(goodsData.data || []);
        setServices(servicesData.data || []);
        setCurrencies(currencyData.rates || []);
        setUnits(unitsData.units || []);
        setAllGst(allGstData.data || []);

        // Set purchase data if found
        if (purchaseData.success && purchaseData.data) {
          const purchase = purchaseData.data;
          setPurchaseDetails(purchase);

          // Transform items for form (calculate discount text from amount)
          const transformedItems = purchase.items.map(item => {
            // Calculate discount percentage or amount from discount and amount
            let discountText = '';
            if (item.discount > 0 && item.amount > 0) {
              const discountPercentage = (item.discount / item.amount) * 100;
              // If discount is a round percentage, show as percentage, otherwise as amount
              if (Math.abs(discountPercentage - Math.round(discountPercentage)) < 0.01) {
                discountText = `${Math.round(discountPercentage)}%`;
              } else {
                discountText = item.discount.toString();
              }
            }

            // Get GST rate from gst_percentage
            let gstRate = parseFloat(item.gst_percentage) || 0;

            return {
              purchase_item_type: item.purchase_item_type,
              goods_services_id: item.goods_id || item.service_id || '',
              goods_service_name: item.goods_service_name || '',
              goods_service_description: item.goods_service_description || '',
              unit_of_measurement_id: item.unit_of_measurement_id || '',
              unit_price: item.unit_price || 0,
              quantity: item.quantity || 1,
              discount: discountText,
              gst_rate: gstRate,
            };
          });

          // Map old payment fields to new structure
          // In the fetchAllData useEffect, fix the mapPaymentFields function:

          // Map old payment fields to new structure
          const mapPaymentFields = (purchase) => {
            // Handle legacy fields from old payment structure
            let payment_mode = purchase.payment_mode || '';
            let transaction_id = '';
            let journal_number = '';
            let cheque_number = '';
            let bank_name = '';

            // Map old fields to new structure based on payment_mode
            if (purchase.payment_mode === 'ONLINE') {
              // If it's old ONLINE mode, map to PAYMENT_GATEWAY
              payment_mode = 'PAYMENT_GATEWAY';
              transaction_id = purchase.upi_id || '';
            } else if (purchase.payment_mode === 'CHEQUE') {

              // If it's CHEQUE, use new structure
              payment_mode = 'CHEQUE';
              cheque_number = purchase.cheque_number || '';
              bank_name = purchase.bank_name || '';
            } else {
              // For other payment modes, keep the same value
              payment_mode = purchase.payment_mode || '';

              // Map specific fields based on payment mode
              switch (purchase.payment_mode) {
                case 'PAYMENT_GATEWAY':
                  transaction_id = purchase.transaction_id || '';
                  break;
                case 'MBOB':
                case 'MPAY':
                case 'TPAY':
                case 'DRUKPAY':
                case 'EPAY':
                case 'DK_BANK':
                  journal_number = purchase.journal_number || '';
                  break;
                case 'CHEQUE':
                  cheque_number = purchase.cheque_number || '';
                  bank_name = purchase.bank_name || '';
                  break;
              }
            }

            // If journal_number exists in old data, preserve it for applicable modes
            if (purchase.journal_number && !journal_number) {
              journal_number = purchase.journal_number;
            }

            return {
              payment_mode,
              transaction_id,
              journal_number,
              cheque_number,
              bank_name
            };
          };
          const paymentFields = mapPaymentFields(purchase);

          // Set form data with purchase details
          setFormData({
            purchase_id: purchase.purchase_id,
            organization_id: purchase.organization_id,
            supplier_id: purchase.supplier_id,
            dealer_id: purchase.dealer_id || '',
            currency: purchase.currency,
            supplier_tpn: purchase.supplier?.taxpayerRegNo || '',
            supplier_name: purchase.supplier?.supplierName || '',
            dealer_tpn: purchase.dealer?.taxpayerRegNo || '',
            dealer_name: purchase.dealer?.dealerName || '',
            purchase_date: purchase.purchase_date.split('T')[0],
            purchase_order_no: purchase.purchase_order_no || '',
            created_by: purchase.created_by,
            items: transformedItems,
            // Updated payment fields
            ...paymentFields,
          });
        } else {
          toast.error('Purchase not found');
          router.push('/purchase');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
        setLoadingPurchase(false);
      }
    };

    fetchAllData();
  }, [purchaseId, router]);

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
    const gstAmount = 0;
    const total = amountAfterDiscount;

    return { amount, discountAmount, amountAfterDiscount, gstAmount, total };
  }, []);

  // Calculate overall totals
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

  // Validate form
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

    // Validate based on payment mode
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
          quantity: parseFloat(item.quantity),
          amount: itemTotals.amount,
          discount: item.discount || '',
          amount_after_discount: itemTotals.amountAfterDiscount,
          gst_amount: itemTotals.gstAmount,
          gst_percentage: item.gst_rate.toString(),
          goods_service_total_amount: itemTotals.total,
        };
      });

      const payload = {
        purchase_id: formData.purchase_id,
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
        // Updated Payment fields
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

      console.log('Update purchase payload:', payload);

      const response = await fetch('/api/purchase/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Purchase updated successfully!');
        router.push('/purchase');
      } else {
        toast.error(data.error || 'Failed to update purchase');
      }
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast.error('Error updating purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (loadingData || loadingPurchase) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
      </Box>
    );
  }

  if (!purchaseDetails) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Purchase not found
        </Typography>
        <Link href="/purchase">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Back to Purchases
          </Button>
        </Link>
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
              Edit Purchase - {purchaseDetails.purchase_order_no}
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
              {/* Supplier & Dealer Information */}
              <Grid item xs={12} md={12} sx={{ display: 'none' }}>
                <Card>
                  <CardHeader title="Supplier Information" />
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
                          label="Supplier Name "
                          value={formData.supplier_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                          variant="outlined"
                          required
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
                          placeholder="Enter TPN if available"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Purchase Details (removed payment section from here) */}
                <Card sx={{ mt: 3 }}>
                  <CardHeader title="Purchase Details" />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Purchase Date */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Purchase Date "
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
                          <InputLabel>Currency </InputLabel>
                          <Select
                            value={formData.currency}
                            label="Currency "
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

                      {/* Purchase Order No */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Purchase Order No"
                          value={formData.purchase_order_no}
                          onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_no: e.target.value }))}
                          variant="outlined"
                          required
                          helperText={`Original PO No: ${purchaseDetails.purchase_order_no}`}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Purchase Items Table */}
              <Grid item xs={12}>
                <Card sx={{ overflow: 'visible', mt: 3 }}>
                  <CardHeader
                    title={
                      <Typography variant="h5" fontWeight="bold">
                        Purchase Items
                      </Typography>
                    }
                    subheader="Edit goods or services in this purchase"
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
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Type</TableCell>
                              <TableCell sx={{ minWidth: 200, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Item</TableCell>
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

                                  {/* QTY */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
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

                                        // remove leading zero if more than 1 digit
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


                                  {/* Amount After Discount */}
                                  <TableCell sx={{ display: "none" }}>
                                    <TextField
                                      type="number"
                                      value={itemTotals.amountAfterDiscount.toFixed(2)}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start"></InputAdornment>,
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
                                            padding: '10px 28px 10px 8px'
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {totals.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "none", justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Taxable Amount:
                    </Typography>
                    <Typography variant="body1">
                      {totals.taxableAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "none", justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Exempt Amount:
                    </Typography>
                    <Typography variant="body1">
                      {totals.exemptAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Payment Mode - Placed after totals summary */}
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

            {/* Form Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || formData.items.length === 0}
                startIcon={loading && <CircularProgress size={20} />}
                sx={{ px: 4 }}
              >
                {loading ? 'Updating...' : 'Update Purchase'}
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