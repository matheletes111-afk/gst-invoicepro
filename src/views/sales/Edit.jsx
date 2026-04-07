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
  Divider,
  Autocomplete
} from '@mui/material';
import Link from 'next/link';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Save as SaveIcon, Search as SearchIcon } from '@mui/icons-material';

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

export default function Edit() {
  const router = useRouter();
  const params = useParams();
  const salesId = params.id;

  // Form state
  const [formData, setFormData] = useState({
    sales_id: salesId,
    organization_id: 1,
    customer_id: '',
    currency: '',
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

  // Individual customer fields
  const [individualCustomerFields, setIndividualCustomerFields] = useState({
    cid: '',
    taxPayerRegion: '',
    email: '',
    phone: ''
  });

  // Dropdown data states
  const [parties, setParties] = useState([]);
  const [goods, setGoods] = useState([]);
  const [services, setServices] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [saleDetails, setSaleDetails] = useState(null);
  const [allGst, setAllGst] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSale, setLoadingSale] = useState(true);

  // New item template
  const newItemTemplate = {
    sales_item_type: 'GOODS',
    goods_services_id: '',
    goods_service_name: '',
    goods_service_description: '',
    unit_of_measurement_id: '',
    unit_price: 0,
    quantity: 1,
    discount: '',
    gst_rate: 0,
  };

  const [partyTypeFilter, setPartyTypeFilter] = useState('INDIVIDUAL');

  // Quick Add section state (Type persists after add; Item clears on select)
  const [quickAddType, setQuickAddType] = useState('');
  const [quickAddItemValue, setQuickAddItemValue] = useState(null);

  // Clear search when party type changes
  useEffect(() => {
    setSearchQuery('');
  }, [partyTypeFilter]);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        // Fetch dropdown data in parallel
        const [
          partiesRes,
          goodsRes,
          servicesRes,
          currencyRes,
          unitsRes,
          saleRes,
          gstRes
        ] = await Promise.all([
          fetch('/api/party/list?page=1&limit=1000&partyType=' + partyTypeFilter),
          fetch('/api/goods-catalog/list?page=1&limit=1000'),
          fetch('/api/service-catalog/list?page=1&limit=1000'),
          fetch('/api/currency/list?page=1&limit=1000'),
          fetch('/api/unit/list?page=1&limit=1000'),
          fetch(`/api/sales/${salesId}`),
          fetch('/api/map-gst-rates/list?page=1&limit=1000&sortBy=mappingId&sortDir=asc'),
        ]);

        // Parse responses
        const partiesData = await partiesRes.json();
        const goodsData = await goodsRes.json();
        const servicesData = await servicesRes.json();
        const currencyData = await currencyRes.json();
        const unitsData = await unitsRes.json();
        const saleData = await saleRes.json();
        const allGstData = await gstRes.json();

        // Set dropdown data
        setParties(partiesData.parties || []);
        setGoods(goodsData.data || []);
        setServices(servicesData.data || []);
        setCurrencies(currencyData.rates || []);
        setUnits(unitsData.units || []);
        setAllGst(allGstData.data || []);

        // Set sale data if found
        if (saleData.success && saleData.data) {
          const sale = saleData.data;
          setSaleDetails(sale);

          // Get party type from customer
          const customerPartyType = sale.customer?.partyType || 'INDIVIDUAL';
          setPartyTypeFilter(customerPartyType);

          // Transform items for form
          const transformedItems = sale.items.map(item => {
            // Calculate discount percentage or amount from discount and amount
            // let discountText = '';
            // if (item.discount > 0 && item.amount > 0) {
            //   const discountPercentage = (item.discount / item.amount) * 100;
            //   if (Math.abs(discountPercentage - Math.round(discountPercentage)) < 0.01) {
            //     discountText = `${Math.round(discountPercentage)}%`;
            //   } else {
            //     discountText = item.discount.toString();
            //   }
            // }

            let discountText = '';

            if (item.discount !== null && item.discount !== undefined && item.discount !== '') {
              const discountStr = item.discount.toString().trim();

              // Only show % if it explicitly exists
              if (discountStr.endsWith('%')) {
                discountText = discountStr;
              } else {
                // DB value → always flat amount
                discountText = discountStr;
              }
            }



            let gstRate = parseFloat(item.gst_percentage) || 0;

            return {
              sales_item_type: item.sales_item_type,
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

          // Get individual customer data if available
          let individualFields = {
            cid: '',
            taxPayerRegion: '',
            email: '',
            phone: ''
          };

          if (customerPartyType === 'INDIVIDUAL' && sale.customer?.individualParty) {
            const indCustomer = sale.customer.individualParty;
            individualFields = {
              cid: indCustomer.cid || '',
              taxPayerRegion: indCustomer.taxPayerRegion || '',
              email: indCustomer.email || '',
              phone: indCustomer.phone || ''
            };
          }

          setIndividualCustomerFields(individualFields);

          // Map old payment fields to new structure
          const mapPaymentFields = (sale) => {
            // Handle legacy fields from old payment structure
            let payment_mode = sale.payment_mode || '';
            let transaction_id = '';
            let journal_number = '';
            let cheque_number = '';
            let bank_name = '';

            // Map old fields to new structure
            if (sale.payment_mode) {
              // If payment_mode already exists in new format, use it directly
              payment_mode = sale.payment_mode;

              // Map the fields based on the payment mode
              if (sale.payment_mode === 'PAYMENT_GATEWAY') {
                transaction_id = sale.transaction_id || sale.upi_id || '';
              }
              else if (sale.payment_mode === 'CHEQUE') {
                cheque_number = sale.cheque_number || sale.check_number || '';
                bank_name = sale.bank_name || '';
              }
              // For mBOB, mPAY, TPAY, DRUKPAY, EPAY, DK_BANK
              else if (sale.payment_mode === 'MBOB' ||
                sale.payment_mode === 'MPAY' ||
                sale.payment_mode === 'TPAY' ||
                sale.payment_mode === 'DRUKPAY' ||
                sale.payment_mode === 'EPAY' ||
                sale.payment_mode === 'DK_BANK') {
                journal_number = sale.journal_number || '';
              }
              // For CASH - no additional fields needed
            }

            // For backward compatibility with old ONLINE payment mode
            else if (sale.payment_mode === 'ONLINE') {
              payment_mode = 'PAYMENT_GATEWAY';
              transaction_id = sale.upi_id || '';
            }

            // If journal_number exists in old data, preserve it
            if (sale.journal_number) {
              journal_number = sale.journal_number;
            }

            return {
              payment_mode,
              transaction_id,
              journal_number,
              cheque_number,
              bank_name
            };
          };
          const paymentFields = mapPaymentFields(sale);

          // Set form data with sale details
          setFormData({
            sales_id: sale.sales_id,
            organization_id: sale.organization_id,
            customer_id: sale.customer_id,
            currency: sale.currency,
            customer_tpn: sale.customer_tpn || '',
            customer_name: sale.customer_name || '',
            sales_date: sale.sales_date.split('T')[0],
            created_by: sale.created_by,
            status: sale.status,
            items: transformedItems,
            // Updated payment fields
            ...paymentFields,
            party_type: customerPartyType,
            create_new_customer: false,
            new_customer_data: null
          });
        } else {
          toast.error('Sale not found');
          router.push('/sales');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
        setLoadingSale(false);
      }
    };

    fetchAllData();
  }, [salesId, router]);

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

  // Quick Add: add row when user selects an item (onChange). Type is kept; only Item selection clears.
  const addItemFromQuickAdd = useCallback((type, selectedItem) => {
    if (!type || !selectedItem) return;
    const itemId = type === 'GOODS' ? selectedItem.goodsId : selectedItem.service_id;
    const mapping = allGst.find(m => m.serviceGoodsId === parseInt(itemId) && m.type === type);
    const gstRate = mapping?.rate?.gstRate ?? 0;
    const unitPrice = type === 'GOODS' ? (selectedItem.goodsPrice || 0) : (selectedItem.service_price ?? selectedItem.price ?? 0);
    const unitId = type === 'GOODS' ? (selectedItem.unitId || '') : '';
    const newItem = {
      ...newItemTemplate,
      sales_item_type: type,
      goods_services_id: itemId,
      goods_service_name: type === 'GOODS' ? selectedItem.goodsName : selectedItem.service_name,
      goods_service_description: type === 'GOODS' ? selectedItem.goodsDescription : selectedItem.service_description,
      unit_of_measurement_id: unitId,
      unit_price: unitPrice,
      quantity: 1,
      discount: '',
      gst_rate: gstRate,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setQuickAddItemValue(null); // clear Item only; Type stays
  }, [goods, services, allGst]);

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
      if (!item.goods_services_id) {
        toast.error(`Please select a ${item.sales_item_type === 'GOODS' ? 'good' : 'service'} for item ${i + 1}`);
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
          goods_services_id: parseInt(item.goods_services_id),
          goods_service_name: item.goods_service_name,
          goods_service_description: item.goods_service_description,
          unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
          unit_price: parseFloat(item.unit_price),
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

      const response = await fetch('/api/sales/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sale updated successfully!');

        try {
          await fetch('/api/invoice/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sales_id: data.data.sales_id,
            }),
          });
        } catch (error) {
          console.error('API call failed', error);
        }

        router.push(`/sales`);
      } else {
        toast.error(data.error || 'Failed to update sale');
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Error updating sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (loadingData || loadingSale) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
      </Box>
    );
  }

  if (!saleDetails) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Sale not found
        </Typography>
        <Link href="/sales">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Close
          </Button>
        </Link>
      </Box>
    );
  }

  const getGstRateForItem = (goodsServicesId, salesItemType, index) => {
    let gstRate = 0;
    const mapping = allGst.find(m => m.serviceGoodsId === parseInt(goodsServicesId) && m.type === salesItemType);
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

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Typography variant="h4" component="h1">
              Edit Sale - {saleDetails.sales_invoice_no}
            </Typography>
            <Link href="/sales" passHref style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary" startIcon={<ArrowBackIcon />}>
                View Past Sales
              </Button>
            </Link>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Customer Information Section */}
              <Grid item xs={12} md={12} sx={{ display: 'none' }}>
                <Card>
                  <CardHeader title="Customer Information" />
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
                          placeholder="Enter TPN if available"
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

                          <Grid item xs={12} md={6}>
                            <TextField
                              required
                              fullWidth
                              select
                              label="Tax Payer Region"
                              value={individualCustomerFields.taxPayerRegion}
                              onChange={(e) => handleIndividualFieldChange('taxPayerRegion', e.target.value)}
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
                          <InputLabel>Currency *</InputLabel>
                          <Select
                            value={formData.currency}
                            label="Currency"
                            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                          >
                            {currencies.map((currency) => (
                              <MenuItem key={currency.currencyId || currency.id} value={currency.currencyId || currency.id}>
                                {currency.currencyName || currency.name} ({currency.currencySymbol || currency.symbol || ''})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>



                      {/* Invoice No (Read-only) */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Invoice No"
                          value={saleDetails.sales_invoice_no}
                          InputProps={{ readOnly: true }}
                          variant="outlined"
                          helperText="Invoice number cannot be changed"
                        />
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
                        Sale Items
                      </Typography>
                    }
                    subheader="Edit goods or services in this sale"
                    action={
                      <Button
                        style={{ display: 'none' }}
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
                    {/* Quick Add section */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                        alignItems: 'center',
                        mb: 3,
                        p: 2,
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', gridColumn: '1 / -1' }}>
                        Add Item
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 0, width: '100%' }}>
                        <InputLabel id="quick-add-type-label">Type</InputLabel>
                        <Select
                          labelId="quick-add-type-label"
                          value={quickAddType}
                          label="Type"
                          onChange={(e) => {
                            setQuickAddType(e.target.value);
                            setQuickAddItemValue(null);
                          }}
                        >
                          <MenuItem value="">
                            <em>Select Type</em>
                          </MenuItem>
                          <MenuItem value="GOODS">Goods</MenuItem>
                          <MenuItem value="SERVICE">Service</MenuItem>
                        </Select>
                      </FormControl>
                      <Autocomplete
                        key={`quick-add-${formData.items.length}`}
                        size="small"
                        sx={{ width: '100%', minWidth: 0 }}
                        value={quickAddItemValue}
                        onChange={(e, newValue) => {
                          if (newValue) {
                            setQuickAddItemValue(null); // clear field to blank right after select
                            addItemFromQuickAdd(quickAddType, newValue);
                          }
                        }}
                        options={quickAddType === 'GOODS' ? goods : quickAddType === 'SERVICE' ? services : []}
                        getOptionLabel={(option) => (option.goodsName ?? option.service_name ?? '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={quickAddType ? `Search ${quickAddType === 'GOODS' ? 'Good' : 'Service'}` : 'Select Type first'}
                            placeholder="Type to search..."
                          />
                        )}
                        disabled={!quickAddType}
                        isOptionEqualToValue={(option, value) =>
                          (quickAddType === 'GOODS' ? option.goodsId === value?.goodsId : option.service_id === value?.service_id)
                        }
                      />
                    </Box>

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
                          Click "Add Item" to start editing items
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
                              const itemOptions = item.sales_item_type === 'GOODS' ? goods : services;

                              return (
                                <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                  {/* TYPE - read only */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.sales_item_type}
                                        onChange={(e) => handleItemTypeChange(index, e.target.value)}
                                        IconComponent={() => null}
                                        sx={{
                                          height: 46,
                                          fontSize: '0.95rem',
                                          '&.Mui-disabled': {
                                            color: (theme) => theme.palette.text.primary,
                                            opacity: 1,
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                                            '& .MuiInputBase-root': { backgroundColor: (theme) => theme.palette.background.paper, opacity: 1 },
                                            '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary, WebkitTextFillColor: (theme) => theme.palette.text.primary },
                                          },
                                        }}
                                        disabled
                                      >
                                        <MenuItem value="GOODS">Goods</MenuItem>
                                        <MenuItem value="SERVICE">Service</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* ITEM - read only */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.goods_services_id}
                                        onChange={(e) => {
                                          getGstRateForItem(e.target.value, item.sales_item_type, index);
                                          handleItemSelection(index, e.target.value, item.sales_item_type)
                                        }}
                                        IconComponent={() => null}
                                        sx={{
                                          height: 46,
                                          fontSize: '0.95rem',
                                          '&.Mui-disabled': {
                                            color: (theme) => theme.palette.text.primary,
                                            opacity: 1,
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                                            '& .MuiInputBase-root': { backgroundColor: (theme) => theme.palette.background.paper, opacity: 1 },
                                            '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary, WebkitTextFillColor: (theme) => theme.palette.text.primary },
                                          },
                                        }}
                                        displayEmpty
                                        disabled
                                      >
                                        <MenuItem value="" sx={{ fontSize: '0.95rem' }}>
                                          <em>Select {item.sales_item_type === 'GOODS' ? 'Good' : 'Service'}</em>
                                        </MenuItem>
                                        {itemOptions.map((option) => (
                                          <MenuItem
                                            key={item.sales_item_type === 'GOODS' ? option.goodsId : option.service_id}
                                            value={item.sales_item_type === 'GOODS' ? option.goodsId : option.service_id}
                                            sx={{ fontSize: '0.95rem' }}
                                          >
                                            {item.sales_item_type === 'GOODS' ? option.goodsName : option.service_name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  {/* UNIT - read only for Goods; editable for Service */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.unit_of_measurement_id}
                                        onChange={(e) => handleItemChange(index, 'unit_of_measurement_id', e.target.value)}
                                        IconComponent={item.sales_item_type === 'GOODS' ? () => null : undefined}
                                        sx={{
                                          width: '122px',
                                          height: 46,
                                          fontSize: '0.95rem',
                                          ...(item.sales_item_type === 'GOODS' && {
                                            '&.Mui-disabled': {
                                              color: (theme) => theme.palette.text.primary,
                                              opacity: 1,
                                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                                              '& .MuiInputBase-root': { backgroundColor: (theme) => theme.palette.background.paper, opacity: 1 },
                                              '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary, WebkitTextFillColor: (theme) => theme.palette.text.primary },
                                            },
                                          }),
                                        }}
                                        disabled={item.sales_item_type === 'GOODS'}
                                        displayEmpty
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
                                      value={item.discount ?? ""}
                                      onChange={(e) => {
                                        let value = e.target.value;

                                        // allow only numbers
                                        if (!/^\d*$/.test(value)) return;

                                        // remove leading zeros (keep single 0)
                                        value = value.replace(/^0+(?=\d)/, "");

                                        handleItemChange(index, "discount", value);
                                      }}
                                      placeholder="10"
                                      inputProps={{
                                        style: {
                                          width: "122px",
                                          fontSize: "0.95rem",
                                          padding: "10px 8px"
                                        },
                                        inputMode: "numeric"
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




            {/* Payment Mode */}
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
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || formData.items.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Updating...' : 'Update Sale'}
              </Button>

              <Link href="/sales">
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