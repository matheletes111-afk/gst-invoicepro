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
    second_hand_sales_id: salesId,
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
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredInventoryItems, setFilteredInventoryItems] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [saleDetails, setSaleDetails] = useState(null);
  const [allGst, setAllGst] = useState([]);

  // Store original sale items separately for edit mode
  const [originalSaleItems, setOriginalSaleItems] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSale, setLoadingSale] = useState(true);

  // New item template
  const newItemTemplate = {
    sales_item_type: 'GOODS',
    inventory_id: '',
    goods_services_id: '',
    goods_service_name: '',
    goods_service_description: '',
    unit_of_measurement_id: '',
    unit_price: 0,
    purchase_amount: 0,
    quantity: 1,
    discount: '',
    gst_rate: 0,
    available_quantity: 0,
  };

  const [partyTypeFilter, setPartyTypeFilter] = useState('INDIVIDUAL');

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
          inventoryRes,
          currencyRes,
          unitsRes,
          saleRes,
          gstRes
        ] = await Promise.all([
          fetch('/api/party/list?page=1&limit=1000&partyType=' + partyTypeFilter),
          fetch('/api/inventory/list?page=1&limit=1000'),
          fetch('/api/currency/list?page=1&limit=1000'),
          fetch('/api/unit/list?page=1&limit=1000'),
          fetch(`/api/secondhand-sales/${salesId}`),
          fetch('/api/map-gst-rates/list?page=1&limit=1000&sortBy=mappingId&sortDir=asc'),
        ]);

        // Parse responses
        const partiesData = await partiesRes.json();
        const inventoryData = await inventoryRes.json();
        const currencyData = await currencyRes.json();
        const unitsData = await unitsRes.json();
        const saleData = await saleRes.json();
        const allGstData = await gstRes.json();

        // Set dropdown data
        setParties(partiesData.parties || []);
        setInventoryItems(inventoryData.data || []);
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
            let discountText = '';
            if (item.discount > 0 && item.amount > 0) {
              const discountPercentage = (item.discount / item.amount) * 100;
              if (Math.abs(discountPercentage - Math.round(discountPercentage)) < 0.01) {
                discountText = `${Math.round(discountPercentage)}%`;
              } else {
                discountText = item.discount.toString();
              }
            }

            let gstRate = parseFloat(item.gst_percentage) || 0;

            // Find the inventory variant for this item
            let available_quantity = 0;
            const inventoryItem = inventoryData.data?.find(inv => inv.id === item.inventory_id);
            if (inventoryItem) {
              available_quantity = parseFloat(inventoryItem.qty || 0) + parseFloat(item.quantity || 0);
            } else {
              // If item not found in current inventory (quantity is 0), we still need to show it in edit
              // Set available quantity to the quantity being edited (so validation passes)
              available_quantity = parseFloat(item.quantity || 0);
            }

            return {
              sales_item_type: item.sales_item_type,
              inventory_id: item.inventory_id,
              goods_services_id: item.goods_id || item.service_id || '',
              goods_service_name: item.goods_service_name || '',
              goods_service_description: item.goods_service_description || '',
              unit_of_measurement_id: item.unit_of_measurement_id || '',
              unit_price: item.unit_price || 0,
              purchase_amount: item.purchase_amount || 0,
              quantity: item.quantity || 1,
              discount: discountText,
              gst_rate: gstRate,
              available_quantity: available_quantity,
            };
          });

          // Store original items for processing
          setOriginalSaleItems(transformedItems);

          // Process inventory items with original sale items included
          // Call the function directly with all needed parameters
          const groupedItems = {};

          // First, add all inventory items
          (inventoryData.data || []).forEach(item => {
            const key = item.goods_service_name || (item.goods?.goodsName || item.service?.service_name);
            if (!key) return;

            const itemType = item.goods_id ? 'GOODS' : 'SERVICE';
            const uniqueKey = `${key}_${itemType}`;

            if (!groupedItems[uniqueKey]) {
              groupedItems[uniqueKey] = {
                name: key,
                type: itemType,
                goods_id: item.goods_id,
                service_id: item.service_id,
                total_qty: 0,
                variants: []
              };
            }

            // Add variant - USE PURCHASE PRICE FOR INVENTORY ITEMS
            // Assuming inventory API returns purchase_price field
            const purchasePrice = item.purchase_price || item.price || 0;

            groupedItems[uniqueKey].variants.push({
              id: item.id,
              price: parseFloat(purchasePrice), // Use purchase price for dropdown
              sale_price: parseFloat(item.price || 0), // Store sale price separately if needed
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

          // Now, ensure all original sale items are included, even if they have 0 quantity in inventory
          transformedItems.forEach(originalItem => {
            const key = originalItem.goods_service_name;
            if (!key) return;

            const itemType = originalItem.sales_item_type || 'GOODS';
            const uniqueKey = `${key}_${itemType}`;

            // If this item is not already in the grouped items (e.g., quantity is 0 in inventory)
            if (!groupedItems[uniqueKey]) {
              groupedItems[uniqueKey] = {
                name: key,
                type: itemType,
                goods_id: originalItem.goods_services_id,
                service_id: originalItem.goods_services_id,
                total_qty: 0,
                variants: []
              };

              // Add the variant from the original sale
              // For original sale items, use purchase_amount for dropdown
              groupedItems[uniqueKey].variants.push({
                id: originalItem.inventory_id,
                price: parseFloat(originalItem.purchase_amount || 0), // Use purchase amount
                sale_price: parseFloat(originalItem.unit_price || 0), // Store sale price
                qty: 0, // This item has 0 quantity in inventory (it was sold)
                unit_id: originalItem.unit_of_measurement_id,
                unit_name: unitsData.units?.find(u => u.id === originalItem.unit_of_measurement_id)?.name || '',
                goods_id: originalItem.goods_services_id,
                service_id: originalItem.goods_services_id,
                goods_service_id: originalItem.goods_services_id
              });
            } else {
              // If the item exists in inventory but the specific variant from the sale might not be there
              const variantExists = groupedItems[uniqueKey].variants.some(
                v => v.id === originalItem.inventory_id
              );

              if (!variantExists) {
                // Add the sale variant to the existing item
                groupedItems[uniqueKey].variants.push({
                  id: originalItem.inventory_id,
                  price: parseFloat(originalItem.purchase_amount || 0), // Use purchase amount
                  sale_price: parseFloat(originalItem.unit_price || 0), // Store sale price
                  qty: 0, // This specific variant has 0 quantity
                  unit_id: originalItem.unit_of_measurement_id,
                  unit_name: unitsData.units?.find(u => u.id === originalItem.unit_of_measurement_id)?.name || '',
                  goods_id: originalItem.goods_services_id,
                  service_id: originalItem.goods_services_id,
                  goods_service_id: originalItem.goods_services_id
                });
              }
            }
          });

          setFilteredInventoryItems(Object.values(groupedItems));

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
            let payment_mode = sale.payment_mode || '';
            let transaction_id = '';
            let journal_number = '';
            let cheque_number = '';
            let bank_name = '';

            if (sale.payment_mode) {
              payment_mode = sale.payment_mode;

              if (sale.payment_mode === 'PAYMENT_GATEWAY') {
                transaction_id = sale.transaction_id || sale.upi_id || '';
              }
              else if (sale.payment_mode === 'CHEQUE') {
                cheque_number = sale.cheque_number || sale.check_number || '';
                bank_name = sale.bank_name || '';
              }
              else if (sale.payment_mode === 'MBOB' ||
                sale.payment_mode === 'MPAY' ||
                sale.payment_mode === 'TPAY' ||
                sale.payment_mode === 'DRUKPAY' ||
                sale.payment_mode === 'EPAY' ||
                sale.payment_mode === 'DK_BANK') {
                journal_number = sale.journal_number || '';
              }
            }
            else if (sale.payment_mode === 'ONLINE') {
              payment_mode = 'PAYMENT_GATEWAY';
              transaction_id = sale.upi_id || '';
            }

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
            second_hand_sales_id: sale.second_hand_sales_id,
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
          toast.error('Second hand sale not found');
          router.push('/secondhand-goods-sales');
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

  // Re-process inventory items when units or original items change
  useEffect(() => {
    if (inventoryItems.length > 0 && originalSaleItems.length > 0 && units.length > 0) {
      // Use a simplified version of the logic here
      const groupedItems = {};

      // First, add all inventory items
      inventoryItems.forEach(item => {
        const key = item.goods_service_name || (item.goods?.goodsName || item.service?.service_name);
        if (!key) return;

        const itemType = item.goods_id ? 'GOODS' : 'SERVICE';
        const uniqueKey = `${key}_${itemType}`;

        if (!groupedItems[uniqueKey]) {
          groupedItems[uniqueKey] = {
            name: key,
            type: itemType,
            goods_id: item.goods_id,
            service_id: item.service_id,
            total_qty: 0,
            variants: []
          };
        }

        // Add variant - USE PURCHASE PRICE FOR INVENTORY ITEMS
        // Assuming inventory API returns purchase_price field
        const purchasePrice = item.purchase_price || item.price || 0;

        groupedItems[uniqueKey].variants.push({
          id: item.id,
          price: parseFloat(purchasePrice), // Use purchase price for dropdown
          sale_price: parseFloat(item.price || 0), // Store sale price separately
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

      // Now, ensure all original sale items are included, even if they have 0 quantity in inventory
      originalSaleItems.forEach(originalItem => {
        const key = originalItem.goods_service_name;
        if (!key) return;

        const itemType = originalItem.sales_item_type || 'GOODS';
        const uniqueKey = `${key}_${itemType}`;

        // If this item is not already in the grouped items (e.g., quantity is 0 in inventory)
        if (!groupedItems[uniqueKey]) {
          groupedItems[uniqueKey] = {
            name: key,
            type: itemType,
            goods_id: originalItem.goods_services_id,
            service_id: originalItem.goods_services_id,
            total_qty: 0,
            variants: []
          };

          // Add the variant from the original sale
          // For original sale items, use purchase_amount for dropdown
          groupedItems[uniqueKey].variants.push({
            id: originalItem.inventory_id,
            price: parseFloat(originalItem.purchase_amount || 0), // Use purchase amount
            sale_price: parseFloat(originalItem.unit_price || 0), // Store sale price
            qty: 0, // This item has 0 quantity in inventory (it was sold)
            unit_id: originalItem.unit_of_measurement_id,
            unit_name: units.find(u => u.id === originalItem.unit_of_measurement_id)?.name || '',
            goods_id: originalItem.goods_services_id,
            service_id: originalItem.goods_services_id,
            goods_service_id: originalItem.goods_services_id
          });
        } else {
          // If the item exists in inventory but the specific variant from the sale might not be there
          const variantExists = groupedItems[uniqueKey].variants.some(
            v => v.id === originalItem.inventory_id
          );

          if (!variantExists) {
            // Add the sale variant to the existing item
            groupedItems[uniqueKey].variants.push({
              id: originalItem.inventory_id,
              price: parseFloat(originalItem.purchase_amount || 0), // Use purchase amount
              sale_price: parseFloat(originalItem.unit_price || 0), // Store sale price
              qty: 0, // This specific variant has 0 quantity
              unit_id: originalItem.unit_of_measurement_id,
              unit_name: units.find(u => u.id === originalItem.unit_of_measurement_id)?.name || '',
              goods_id: originalItem.goods_services_id,
              service_id: originalItem.goods_services_id,
              goods_service_id: originalItem.goods_services_id
            });
          }
        }
      });

      setFilteredInventoryItems(Object.values(groupedItems));
    }
  }, [inventoryItems, originalSaleItems, units]);

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
    const itemGroup = filteredInventoryItems.find(item => item.name === itemName);

    if (!itemGroup) return;

    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        goods_service_name: itemName,
        sales_item_type: itemGroup.type,
        inventory_id: '',
        goods_services_id: '',
        unit_price: 0,
        purchase_amount: 0,
        unit_of_measurement_id: '',
        available_quantity: 0,
        gst_rate: 0,
      };
      return { ...prev, items: newItems };
    });
  }, [filteredInventoryItems]);

  // Handle price selection (Step 2: Select price variant) - UPDATED TO USE PURCHASE PRICE
  const handlePriceSelection = useCallback((index, inventoryId) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const currentItem = newItems[index];
      const itemName = currentItem.goods_service_name;

      const itemGroup = filteredInventoryItems.find(item => item.name === itemName);
      if (!itemGroup) return prev;

      const selectedVariant = itemGroup.variants.find(v => v.id === parseInt(inventoryId));
      if (!selectedVariant) return prev;

      // Check if this is an existing item from the original sale
      const isExistingItem = originalSaleItems.some(
        originalItem => originalItem.inventory_id === currentItem.inventory_id
      );

      let available_quantity = selectedVariant.qty;

      if (isExistingItem) {
        // For existing items in edit mode, we need to add back the quantity being edited
        // because it was already deducted from inventory
        available_quantity += parseFloat(currentItem.quantity || 0);
      }
      // For new items being added during edit, don't add the current quantity
      // because it hasn't been sold yet

      // Set purchase_amount from the variant price (which is purchase price)
      // Set unit_price from sale_price if available, otherwise use purchase price
      const unitPrice = selectedVariant.sale_price || selectedVariant.price;

      newItems[index] = {
        ...currentItem,
        inventory_id: selectedVariant.id,
        goods_services_id: selectedVariant.goods_service_id,
        unit_price: unitPrice, // Sale price
        purchase_amount: selectedVariant.price, // Purchase price from variant
        unit_of_measurement_id: selectedVariant.unit_id,
        available_quantity: available_quantity,
        gst_rate: 0,
      };

      return { ...prev, items: newItems };
    });

    setTimeout(() => {
      setFormData(prev => {
        const currentItem = prev.items[index];
        if (!currentItem.goods_services_id) return prev;

        getGstRateForItem(
          currentItem.goods_services_id,
          currentItem.sales_item_type,
          index
        );

        return prev;
      });
    }, 0);
  }, [filteredInventoryItems, originalSaleItems]);

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

      if (field === 'quantity') {
        const quantity = parseFloat(value) || 0;
        const availableQty = parseFloat(newItems[index].available_quantity) || 0;

        if (quantity > availableQty) {
          toast.error(`Cannot sell ${quantity} units. Only ${availableQty} units available in stock.`);
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
    if (partyTypeFilter === 'INDIVIDUAL') {
      if (!formData.customer_name?.trim()) {
        toast.error('Please enter customer name');
        return false;
      }
    } else {
      if (!formData.customer_id) {
        toast.error('Please select a customer');
        return false;
      }
    }

    if (!formData.payment_mode) {
      toast.error('Please select payment mode');
      return false;
    }

    // switch (formData.payment_mode) {
    //   case 'PAYMENT_GATEWAY':
    //     if (!formData.transaction_id?.trim()) {
    //       toast.error('Please enter Transaction ID for Payment Gateway');
    //       return false;
    //     }
    //     break;

    //   case 'MBOB':
    //   case 'MPAY':
    //   case 'TPAY':
    //   case 'DRUKPAY':
    //   case 'EPAY':
    //   case 'DK_BANK':
       

    //   case 'CHEQUE':
      

    //   case 'CASH':
    //     break;

    //   default:
    //     break;
    // }

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
        const isExistingItem = originalSaleItems.some(
          originalItem => originalItem.inventory_id === item.inventory_id
        );

        if (!isExistingItem) {
          toast.error(`Cannot sell ${quantity} units of ${item.goods_service_name}. Only ${availableQty} units available in stock.`);
          return false;
        } else {
          toast.warning(`Item ${item.goods_service_name} has limited stock. You're editing an existing sale item.`);
        }
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
  }, [formData, partyTypeFilter, originalSaleItems]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

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
          purchase_amount: parseFloat(item.purchase_amount || 0),
          quantity: parseFloat(item.quantity),
          discount: item.discount || '',
          gst_rate: parseFloat(item.gst_rate) || 0,
        };
      });

      let newCustomerData = null;
      let createNewCustomer = false;

      if (partyTypeFilter === 'INDIVIDUAL' && !formData.customer_id) {
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

      const payload = {
        ...formData,
        items: itemsForBackend,
        create_new_customer: createNewCustomer,
        new_customer_data: newCustomerData,
        party_type: partyTypeFilter
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('/api/secondhand-sales/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Second hand sale updated successfully!');
        router.push(`/secondhand-goods-sales`);
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
          Second hand sale not found
        </Typography>
        <Link href="/secondhand-goods-sales">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Close
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Edit Second Hand Sale - {saleDetails.sales_invoice_no}
            </Typography>
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

                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                          Customer Details
                        </Typography>
                      </Grid>

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
                        Sale Items (From Inventory)
                      </Typography>
                    }
                    subheader="Edit items from available inventory stock"
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

                              const filteredByType = filteredInventoryItems.filter(
                                invItem => invItem.type === item.sales_item_type
                              );

                              const selectedItemGroup = filteredByType.find(
                                invItem => invItem.name === item.goods_service_name
                              );

                              const availableVariants = selectedItemGroup?.variants || [];

                              return (
                                <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
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

                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.goods_service_name}
                                        onChange={(e) => handleItemNameSelection(index, e.target.value)}
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
                                            {invItem.name} ({invItem.type}) - Available: {invItem.total_qty > 0 ? invItem.total_qty : 'Sold Out (Editing)'}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.inventory_id}
                                        onChange={(e) => handlePriceSelection(index, e.target.value)}
                                        disabled={!item.goods_service_name}
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="">
                                          <em>Select Purchase Price</em>
                                        </MenuItem>
                                        {availableVariants.map((variant) => (
                                          <MenuItem
                                            key={variant.id}
                                            value={variant.id}
                                          >
                                            ₹{variant.price} (Stock: {variant.qty > 0 ? variant.qty : 'Sold Out'}, Unit: {variant.unit_name})
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>

                                  <TableCell>
                                    <TextField
                                      value={units.find(u => u.id === item.unit_of_measurement_id)?.name || ''}
                                      InputProps={{ readOnly: true }}
                                      inputProps={{ style: { fontSize: '0.95rem', padding: '10px 8px' } }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
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

                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                      inputProps={{
                                        min: 1,
                                        step: "0.01",
                                        style: { fontSize: '0.95rem', padding: '10px 8px' }
                                      }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                      error={parseFloat(item.quantity) > parseFloat(item.available_quantity)}
                                      helperText={
                                        parseFloat(item.quantity) > parseFloat(item.available_quantity)
                                          ? `Max: ${item.available_quantity}`
                                          : `Available: ${item.available_quantity}`
                                      }
                                    />
                                  </TableCell>

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

                                  {/* <TableCell>
                                    <TextField
                                      value={item.discount || 0}
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

                                        // allow only numbers
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
                                        ₹{itemTotals.total.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  </TableCell>

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

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || formData.items.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Updating...' : 'Update Sale'}
              </Button>

              <Link href="/secondhand-goods-sales">
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