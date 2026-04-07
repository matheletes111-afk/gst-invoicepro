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
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete'

export default function Edit() {
  const router = useRouter();
  const params = useParams();
  const adjustmentId = params.id;

  // Store original item data for comparison
  const [originalItems, setOriginalItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    sales_id: '',
    organization_id: 1,
    customer_id: '',
    currency: '',
    customer_tpn: '',
    customer_name: '',
    sales_date: new Date().toISOString().split('T')[0],
    remark: '',
    adjustment_type: '',
    adjustment_amount: 0,
    created_by: 1,
    status: 'IP',
    items: [],
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

  const [partyTypeFilter, setPartyTypeFilter] = useState('')
  const [customerSearchText, setCustomerSearchText] = useState('')

  useEffect(() => {
    setCustomerSearchText('')
  }, [partyTypeFilter])

  // Calculate original item totals (without adjustments)
  const calculateOriginalItemTotals = useCallback((item) => {
    if (!item) return { amount: 0, discountAmount: 0, amountAfterDiscount: 0, gstAmount: 0, total: 0 };

    const unitPrice = parseFloat(item.original_unit_price || item.unit_price) || 0;
    const quantity = parseFloat(item.original_quantity || item.quantity) || 0;
    const gstRate = parseFloat(item.original_gst_rate || item.gst_rate) || 0;
    const discount = item.original_discount || item.discount;

    // Calculate amount
    const amount = unitPrice * quantity;

    // Calculate discount
    let discountAmount = 0;
    if (discount && discount !== '') {
      const discountStr = discount.toString().trim();
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

  // Calculate current item totals WITHOUT adjustment (for adjustment calculation)
  const calculateCurrentItemTotalsWithoutAdjustment = useCallback((item) => {
    if (!item) return { amount: 0, discountAmount: 0, amountAfterDiscount: 0, gstAmount: 0, total: 0 };

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
    const total = amountAfterDiscount + gstAmount; // NO adjustment here

    return { amount, discountAmount, amountAfterDiscount, gstAmount, total };
  }, []);

  // Calculate current item totals WITH adjustment (for display) - FIXED
  const calculateCurrentItemTotalsWithAdjustment = useCallback((item) => {
    if (!item) return {
      amount: 0,
      discountAmount: 0,
      amountAfterDiscount: 0,
      gstAmount: 0,
      adjustmentAmount: 0,
      total: 0
    };

    const unitPrice = parseFloat(item.unit_price) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    const gstRate = parseFloat(item.gst_rate) || 0;
    const adjustmentAmount = parseFloat(item.adjustment_amount) || 0;
    const isCredit = item.adjustment_type === 'CREDIT';

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

    // FIXED: The total should be WITHOUT adjustment for display
    // Adjustment amount is just the difference, not added to total
    const totalWithoutAdjustment = amountAfterDiscount + gstAmount;

    // For new items with manual adjustment, add it
    // For existing items, adjustment is just the difference, not added
    let total = totalWithoutAdjustment;
    if (item.is_new_item) {
      total = totalWithoutAdjustment + (isCredit ? adjustmentAmount : -adjustmentAmount);
    }

    return {
      amount,
      discountAmount,
      amountAfterDiscount,
      gstAmount,
      adjustmentAmount,
      total,
      totalWithoutAdjustment
    };
  }, []);

  // Calculate adjustment automatically when any value changes (only for existing items)
  const calculateAdjustment = useCallback((item, originalTotal, currentTotalWithoutAdjustment) => {
    // For new items, don't auto-calculate adjustment
    if (item.is_new_item) {
      return {
        adjustment_amount: 0,
        adjustment_type: '',
        adjustment_reason: ''
      };
    }

    const adjustmentAmount = currentTotalWithoutAdjustment - originalTotal;
    let adjustmentType = '';
    let adjustmentReason = '';

    // Build adjustment reason based on what changed
    const reasons = [];

    if (Math.abs(parseFloat(item.original_quantity) - parseFloat(item.quantity)) > 0.01) {
      reasons.push(`Quantity changed from ${item.original_quantity} to ${item.quantity}`);
    }
    if (Math.abs(parseFloat(item.original_unit_price) - parseFloat(item.unit_price)) > 0.01) {
      reasons.push(`Unit price changed from ${item.original_unit_price} to ${item.unit_price}`);
    }
    if (item.original_discount !== item.discount) {
      reasons.push(`Discount changed from ${item.original_discount || '0'} to ${item.discount || '0'}`);
    }
    if (Math.abs(parseFloat(item.original_gst_rate) - parseFloat(item.gst_rate)) > 0.01) {
      reasons.push(`GST changed from ${item.original_gst_rate}% to ${item.gst_rate}%`);
    }

    if (Math.abs(adjustmentAmount) > 0.01) {
      if (adjustmentAmount > 0) {
        adjustmentType = 'CREDIT';
      } else if (adjustmentAmount < 0) {
        adjustmentType = 'DEBIT';
      }
      adjustmentReason = reasons.join(', ');
    }

    return {
      adjustment_amount: Math.abs(adjustmentAmount),
      adjustment_type: adjustmentType,
      adjustment_reason: adjustmentReason
    };
  }, []);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        // Fetch adjustment details
        const adjustmentRes = await fetch(`/api/adjustment/${adjustmentId}`);
        const adjustmentData = await adjustmentRes.json();

        if (!adjustmentData.success || !adjustmentData.data) {
          toast.error('Adjustment not found');
          router.push('/adjustment_list');
          return;
        }

        const adjustment = adjustmentData.data;
        const saleId = adjustment.sale_id;

        // Fetch dropdown data and sale details in parallel
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
          fetch(`/api/sales/${saleId}`),
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

          // Transform original sale items for form
          const transformedItems = sale.items.map(item => {
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
              original_gst_rate: gstRate,
              original_quantity: item.quantity || 1,
              original_unit_price: item.unit_price || 0,
              original_discount: discountText,
              adjustment_reason: '',
              adjustment_type: '',
              adjustment_amount: 0,
              is_new_item: false,
            };
          });

          // Store original items for comparison
          setOriginalItems(transformedItems.map(item => ({ ...item })));

          setPartyTypeFilter(sale.customer.partyType || '')

          // Transform adjustment items to match form structure
          const adjustmentItems = adjustment.items.map(adjItem => {
            // Find matching original item
            const originalItem = transformedItems.find(item =>
              (adjItem.sales_item_type === 'GOODS' && item.goods_services_id == adjItem.goods_id) ||
              (adjItem.sales_item_type === 'SERVICE' && item.goods_services_id == adjItem.service_id)
            );

            return {
              adjustment_item_id: adjItem.adjustment_item_id,
              sales_item_type: adjItem.sales_item_type,
              goods_services_id: adjItem.goods_id || adjItem.service_id || '',
              goods_service_name: adjItem.goods_service_name || '',
              goods_service_description: adjItem.goods_service_description || '',
              unit_of_measurement_id: adjItem.unit_of_measurement_id || '',
              unit_price: parseFloat(adjItem.unit_price) || 0,
              quantity: parseFloat(adjItem.quantity) || 1,
              discount: adjItem.discount || '',
              gst_rate: parseFloat(adjItem.gst_percentage) || 0,
              original_gst_rate: originalItem ? originalItem.original_gst_rate : parseFloat(adjItem.gst_percentage) || 0,
              original_quantity: originalItem ? originalItem.original_quantity : parseFloat(adjItem.quantity) || 1,
              original_unit_price: originalItem ? originalItem.original_unit_price : parseFloat(adjItem.unit_price) || 0,
              original_discount: originalItem ? originalItem.original_discount : adjItem.discount || '',
              adjustment_reason: adjItem.reason_for_adjustment || '',
              adjustment_type: adjItem.adjustment_type || '',
              adjustment_amount: parseFloat(adjItem.adjustment_amount) || 0,
              is_new_item: false,
            };
          });

          // Set form data
          setFormData({
            sales_id: adjustment.sale_id,
            organization_id: adjustment.organization_id || 1,
            customer_id: adjustment.customer_id,
            currency: adjustment.invoice?.currency || '',
            customer_tpn: adjustment.customer_tpn || adjustment.customer?.individualParty?.taxPayerRegNo || '',
            customer_name: adjustment.customer_name || adjustment.customer?.individualParty?.name || '',
            sales_date: adjustment.date.split('T')[0],
            remark: adjustment.remark || '',
            adjustment_type: adjustment.adjustment_type || '',
            adjustment_amount: parseFloat(adjustment.adjustment_amount) || 0,
            created_by: adjustment.created_by || 1,
            status: adjustment.status || 'IP',
            items: adjustmentItems,
          });
        } else {
          toast.error('Sale not found');
          router.push('/adjustment_list');
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
  }, [adjustmentId, router]);

  // New item template (same as create page)
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
    original_gst_rate: 0,
    original_quantity: 1,
    original_unit_price: 0,
    original_discount: '',
    adjustment_reason: '',
    adjustment_type: '',
    adjustment_amount: 0,
    is_new_item: true,
  };

  // Handle item type change
  const handleItemTypeChange = useCallback((index, type) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItemTemplate,
        sales_item_type: type,
        is_new_item: true,
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
        const currentItem = newItems[index];

        newItems[index] = {
          ...currentItem,
          goods_services_id: itemId,
          goods_service_name: type === 'GOODS' ? selectedItem.goodsName : selectedItem.service_name,
          goods_service_description: type === 'GOODS' ? selectedItem.goodsDescription : selectedItem.service_description,
          unit_price: type === 'GOODS' ? selectedItem.goodsPrice || 0 : currentItem.unit_price,
          unit_of_measurement_id: type === 'GOODS' ? selectedItem.unitId || '' : currentItem.unit_of_measurement_id,
        };

        // For new items, don't auto-calculate adjustment
        if (currentItem.is_new_item) {
          newItems[index] = {
            ...newItems[index],
            adjustment_amount: 0,
            adjustment_type: '',
            adjustment_reason: ''
          };
        } else {
          // For existing items, calculate adjustment if values changed
          const originalTotal = calculateOriginalItemTotals(currentItem).total;
          const currentTotalWithoutAdjustment = calculateCurrentItemTotalsWithoutAdjustment(newItems[index]).total;

          const adjustment = calculateAdjustment(
            newItems[index],
            originalTotal,
            currentTotalWithoutAdjustment
          );

          newItems[index] = {
            ...newItems[index],
            adjustment_amount: adjustment.adjustment_amount,
            adjustment_type: adjustment.adjustment_type,
            adjustment_reason: adjustment.adjustment_reason
          };
        }

        return { ...prev, items: newItems };
      });
    }
  }, [goods, services, calculateOriginalItemTotals, calculateCurrentItemTotalsWithoutAdjustment, calculateAdjustment]);

  // Handle item input change - Auto calculate adjustment when any field changes
  const handleItemChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = newItems[index];
      newItems[index] = { ...item, [field]: value };

      // If quantity, unit price, discount, or GST rate is changed for existing items, auto-calculate adjustment
      const adjustmentFields = ['quantity', 'unit_price', 'discount', 'gst_rate'];
      if (adjustmentFields.includes(field) && !item.is_new_item && originalItems.length > 0) {
        const originalItem = originalItems[index];
        if (originalItem) {
          const originalTotal = calculateOriginalItemTotals(originalItem).total;
          const currentTotalWithoutAdjustment = calculateCurrentItemTotalsWithoutAdjustment(newItems[index]).total;

          const adjustment = calculateAdjustment(
            newItems[index],
            originalTotal,
            currentTotalWithoutAdjustment
          );

          newItems[index] = {
            ...newItems[index],
            adjustment_amount: adjustment.adjustment_amount,
            adjustment_type: adjustment.adjustment_type,
            adjustment_reason: adjustment.adjustment_reason
          };
        }
      }

      // For new items, if adjustment amount is manually changed, determine type
      if (field === 'adjustment_amount' && item.is_new_item) {
        const amount = parseFloat(value) || 0;
        if (amount > 0) {
          newItems[index].adjustment_type = 'CREDIT';
        } else if (amount < 0) {
          newItems[index].adjustment_type = 'DEBIT';
          newItems[index].adjustment_amount = Math.abs(amount);
        } else {
          newItems[index].adjustment_type = '';
        }
      }

      // For existing items, manual adjustment amount change
      if (field === 'adjustment_amount' && !item.is_new_item) {
        const amount = parseFloat(value) || 0;
        if (amount > 0) {
          newItems[index].adjustment_type = 'CREDIT';
        } else if (amount < 0) {
          newItems[index].adjustment_type = 'DEBIT';
          newItems[index].adjustment_amount = Math.abs(amount);
        }
      }

      return { ...prev, items: newItems };
    });
  }, [originalItems, calculateOriginalItemTotals, calculateCurrentItemTotalsWithoutAdjustment, calculateAdjustment]);

  // Add new item
  const addNewItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        ...newItemTemplate,
        is_new_item: true
      }]
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

  // Calculate overall totals with adjustments (same as create page)
  const calculateTotals = useCallback(() => {
    let totalOriginalAmount = 0;
    let totalCurrentAmount = 0;
    let totalAdjustment = 0;
    let creditAdjustment = 0;
    let debitAdjustment = 0;
    let existingItemsCount = 0;
    let newItemsCount = 0;
    let currentSalesAmount = 0;
    let currentTaxableAmount = 0;
    let currentExemptAmount = 0;
    let currentGstAmount = 0;
    let originalSalesAmount = 0;
    let originalTaxableAmount = 0;
    let originalExemptAmount = 0;
    let originalGstAmount = 0;

    formData.items.forEach((item, index) => {
      const currentTotals = calculateCurrentItemTotalsWithAdjustment(item);
      totalCurrentAmount += currentTotals.total;

      const amountAfter = currentTotals.amountAfterDiscount || 0;
      currentSalesAmount += amountAfter;

      // Exempt: gst_rate <= 0 or less than 1 treated as exempt
      const gstRate = parseFloat(item.gst_rate) || 0;
      if (gstRate > 0) {
        currentTaxableAmount += amountAfter;
      } else {
        currentExemptAmount += amountAfter;
      }

      if (item.is_new_item) {
        newItemsCount++;
        // For new items, adjustment is manually added
        totalAdjustment += item.adjustment_type === 'CREDIT' ? currentTotals.adjustmentAmount : -currentTotals.adjustmentAmount;
      } else {
        existingItemsCount++;
        // For existing items, calculate original total
        if (originalItems.length > 0 && originalItems[index]) {
          const originalTotals = calculateOriginalItemTotals(originalItems[index]);
          totalOriginalAmount += originalTotals.total;
          const origAmountAfter = originalTotals.amountAfterDiscount || 0;
          originalSalesAmount += origAmountAfter;
          const origGstRate = parseFloat(originalItems[index].original_gst_rate || originalItems[index].gst_rate) || 0;
          if (origGstRate > 0) {
            originalTaxableAmount += origAmountAfter;
          } else {
            originalExemptAmount += origAmountAfter;
          }
        }
        totalAdjustment += item.adjustment_type === 'CREDIT' ? currentTotals.adjustmentAmount : -currentTotals.adjustmentAmount;
      }

      // Calculate credit/debit totals
      if (item.adjustment_type === 'CREDIT') {
        creditAdjustment += currentTotals.adjustmentAmount;
      } else if (item.adjustment_type === 'DEBIT') {
        debitAdjustment += currentTotals.adjustmentAmount;
      }
    });

    // If no original items exist in the form (all new items), use 0 as base
    if (existingItemsCount === 0) {
      totalOriginalAmount = 0;
    }
    // GST is 5% of total taxable amount as requested
    currentGstAmount = currentTaxableAmount * 0.05;
    const currentInvoiceTotal = currentSalesAmount + currentGstAmount;

    // Compute original GST and invoice totals similarly
    originalGstAmount = originalTaxableAmount * 0.05;
    const originalInvoiceTotal = originalSalesAmount + originalGstAmount;

    return {
      totalOriginalAmount,
      totalCurrentAmount,
      totalAdjustment,
      creditAdjustment,
      debitAdjustment,
      netAdjustment: totalAdjustment,
      existingItemsCount,
      newItemsCount,
      currentSalesAmount,
      currentTaxableAmount,
      currentExemptAmount,
      currentGstAmount,
      currentInvoiceTotal,
      originalSalesAmount,
      originalTaxableAmount,
      originalExemptAmount,
      originalGstAmount,
      originalInvoiceTotal
    };
  }, [formData.items, originalItems, calculateCurrentItemTotalsWithAdjustment, calculateOriginalItemTotals]);

  // Validate form
  const validateForm = useCallback(() => {
    if (!formData.customer_id) {
      toast.error('Customer is required');
      return false;
    }
    if (!formData.currency) {
      toast.error('Currency is required');
      return false;
    }
    if (!formData.sales_date) {
      toast.error('Sales date is required');
      return false;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.goods_services_id) {
        toast.error(`Please select an item for row ${i + 1}`);
        return false;
      }
      if (!item.unit_of_measurement_id) {
        toast.error(`Please select a unit for row ${i + 1}`);
        return false;
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        toast.error(`Please enter a valid price for row ${i + 1}`);
        return false;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        toast.error(`Please enter a valid quantity for row ${i + 1}`);
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

      // Prepare items for backend
      const itemsForBackend = formData.items.map((item, index) => {
        const originalItem = originalItems[index] || {};

        const payloadItem = {
          // Include adjustment_item_id for updates
          adjustment_item_id: item.adjustment_item_id,
          sales_item_type: item.sales_item_type,
          goods_services_id: parseInt(item.goods_services_id),
          goods_service_name: item.goods_service_name,
          goods_service_description: item.goods_service_description,
          unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
          unit_price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          discount: item.discount || '',
          gst_rate: parseFloat(item.gst_rate) || 0,
          adjustment_reason: item.adjustment_reason || '',
          adjustment_type: item.adjustment_type || 'NONE',
          adjustment_amount: parseFloat(item.adjustment_amount) || 0,
          is_new_item: item.is_new_item || false,
        };

        // Add original values for comparison
        if (!item.is_new_item && originalItem) {
          payloadItem.original_gst_rate = parseFloat(originalItem.original_gst_rate || originalItem.gst_rate) || 0;
          payloadItem.original_quantity = parseFloat(originalItem.original_quantity || originalItem.quantity) || 0;
          payloadItem.original_unit_price = parseFloat(originalItem.original_unit_price || originalItem.unit_price) || 0;
          payloadItem.original_discount = originalItem.original_discount || originalItem.discount || '';
          payloadItem.new_gst_rate = parseFloat(item.gst_rate) || 0;
        }

        return payloadItem;
      });

      // compute master invoice diff and set top-level adjustment
      const totalsForSubmit = calculateTotals();
      const invoiceDiff = (totalsForSubmit.currentInvoiceTotal || 0) - (totalsForSubmit.originalInvoiceTotal || 0);
      let masterAdjustmentType = 'NONE';
      let masterAdjustmentAmount = 0;
      if (invoiceDiff > 0) {
        masterAdjustmentType = 'CREDIT';
        masterAdjustmentAmount = invoiceDiff;
      } else if (invoiceDiff < 0) {
        masterAdjustmentType = 'DEBIT';
        masterAdjustmentAmount = Math.abs(invoiceDiff);
      }

      const payload = {
        ...formData,
        remark: formData.remark || '',
        adjustment_type: masterAdjustmentType,
        adjustment_amount: parseFloat(masterAdjustmentAmount.toFixed(2)),
        items: itemsForBackend,
      };

      console.log('Updating adjustment payload:', payload);

      const response = await fetch('/api/adjustment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Adjustment updated successfully!');
        router.push('/adjustment_list');
      } else {
        toast.error(data.error || 'Failed to update adjustment');
      }
    } catch (error) {
      console.error('Error updating adjustment:', error);
      toast.error('Error updating adjustment. Please try again.');
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
        <Link href="/adjustment_list">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Back to Adjustments
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
              Edit Adjustment for Invoice - {saleDetails.sales_invoice_no}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Sale Information - Hidden as per create page */}
              <Grid item xs={12} md={12} sx={{ display: 'none' }}>
                <Card>
                  <CardHeader title="Sale Information" />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Invoice No"
                          value={saleDetails.sales_invoice_no}
                          InputProps={{ readOnly: true }}
                          variant="outlined"
                          disabled={true}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Sales Date"
                          type="date"
                          value={formData.sales_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, sales_date: e.target.value }))}
                          required
                          InputLabelProps={{ shrink: true }}
                          disabled={true}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer Name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                          required
                          InputLabelProps={{ shrink: true }}
                          disabled={true}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer TPN"
                          value={formData.customer_tpn}
                          onChange={(e) => setFormData(prev => ({ ...prev, customer_tpn: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                          disabled={true}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Items Table - Matching create page UI */}
              <Grid item xs={12}>
                <Card sx={{ overflow: 'visible' }}>
                  <CardHeader
                    title={
                      <Typography variant="h5" fontWeight="bold">
                        Adjustment Items
                      </Typography>
                    }
                    subheader={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          • Existing items: Auto-adjustment on any change (Qty, Price, Discount, GST)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • New items: Manual adjustment only
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
                        Add New Item
                      </Button>
                    }
                  />

                  <CardContent sx={{ p: 2 }}>
                    {formData.items.length === 0 && (
                      <Box
                        sx={{
                          textAlign: 'center',
                          py: 8,
                          border: '2px dashed #e0e0e0',
                          borderRadius: 2,
                        }}
                      >
                        <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                          No items added
                        </Typography>
                        <Typography color="text.secondary" variant="body1">
                          Click "Add New Item" to add items
                        </Typography>
                      </Box>
                    )}

                    {formData.items.length > 0 && (
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
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Type</TableCell>
                              <TableCell sx={{ minWidth: 200, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Item</TableCell>
                              <TableCell sx={{ minWidth: 120, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Unit</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Unit Price</TableCell>
                              <TableCell sx={{ minWidth: 100, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Qty</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Amount</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Discount</TableCell>
                              <TableCell sx={{ minWidth: 160, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>After Discount</TableCell>
                              <TableCell sx={{ minWidth: 120, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>GST %</TableCell>
                              <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Total</TableCell>
                              <TableCell sx={{ minWidth: 100, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {formData.items.map((item, index) => {
                              const itemTotals = calculateCurrentItemTotalsWithAdjustment(item);
                              const currentTotalWithoutAdjustment = calculateCurrentItemTotalsWithoutAdjustment(item).total;
                              const itemOptions = item.sales_item_type === 'GOODS' ? goods : services;
                              const originalItem = originalItems[index];
                              const originalTotal = originalItem ? calculateOriginalItemTotals(originalItem).total : 0;
                              const adjustmentDifference = Math.abs(currentTotalWithoutAdjustment - originalTotal);

                              return (
                                <TableRow key={index} hover sx={{
                                  '&:hover': { bgcolor: '#fafafa' },
                                  bgcolor: item.is_new_item ? '#f9f9f9' : 'inherit'
                                }}>
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

                                  {/* ITEM */}
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={item.goods_services_id}
                                        onChange={(e) => handleItemSelection(index, e.target.value, item.sales_item_type)}
                                        sx={{ height: 46, fontSize: '0.95rem' }}
                                      >
                                        <MenuItem value="">
                                          <em>Select {item.sales_item_type === 'GOODS' ? 'Good' : 'Service'}</em>
                                        </MenuItem>
                                        {itemOptions.map((option) => (
                                          <MenuItem
                                            key={item.sales_item_type === 'GOODS' ? option.goodsId : option.service_id}
                                            value={item.sales_item_type === 'GOODS' ? option.goodsId : option.service_id}
                                          >
                                            {item.sales_item_type === 'GOODS' ? option.goodsName : option.service_name}
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
                                        <MenuItem value="">
                                          <em>Select Unit</em>
                                        </MenuItem>
                                        {units.map((unit) => (
                                          <MenuItem key={unit.id} value={unit.id}>
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
                                        step: "1",
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
                                      InputProps={{ readOnly: true }}
                                      inputProps={{ style: { fontSize: '0.95rem', fontWeight: 'bold', color: '#1976d2', padding: '10px 8px' } }}
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
                                      inputProps={{ style: { fontSize: '0.95rem', padding: '10px 8px' } }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell> */}
                                  <TableCell>
                                    <TextField
                                      value={item.discount ?? ''}   // ❌ no forced 0
                                      onChange={(e) => {
                                        let value = e.target.value;

                                        // allow only digits
                                        if (!/^\d*$/.test(value)) return;

                                        // remove leading zero(s)
                                        if (value.length > 1 && value.startsWith('0')) {
                                          value = value.replace(/^0+/, '');
                                        }

                                        handleItemChange(index, 'discount', value);
                                      }}
                                      placeholder="Enter discount amount"
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
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={itemTotals.amountAfterDiscount.toFixed(2)}
                                      InputProps={{ readOnly: true }}
                                      inputProps={{ style: { fontSize: '0.95rem', fontWeight: 'bold', color: '#2e7d32', padding: '10px 8px' } }}
                                      size="small"
                                      fullWidth
                                      variant="outlined"
                                    />
                                  </TableCell>

                                  {/* GST */}
                                  <TableCell>
                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                      <TextField
                                        type="number"
                                        value={item.gst_rate}
                                        onChange={(e) => handleItemChange(index, 'gst_rate', e.target.value)}
                                        inputProps={{
                                          min: 0,
                                          max: 100,
                                          step: "0.01",
                                          style: { fontSize: '0.95rem', padding: '10px 28px 10px 8px' }
                                        }}
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                      />
                                      <Box sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary', fontSize: '0.95rem' }}>
                                        %
                                      </Box>
                                    </Box>
                                    {item.is_new_item && (
                                      <Typography variant="caption" color="green">
                                        New Item
                                      </Typography>
                                    )}
                                  </TableCell>

                                  {/* TOTAL */}
                                  <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', minHeight: 46 }}>
                                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#d32f2f', fontSize: '1rem' }}>
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
                                      sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
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


                    <br></br>
                    <br></br>
                    <Grid item xs={12} sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Remark"
                        multiline
                        rows={3}
                        value={formData.remark}
                        onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                        variant="outlined"
                      />
                    </Grid>
                  </CardContent>
                </Card>


              </Grid>
            </Grid>

            {/* Totals Summary - Matching create page */}
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Adjustment Summary" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Original Sales Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.originalSalesAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Original Exempt Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.originalExemptAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Original Taxable Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.originalTaxableAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Original Gst Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.originalGstAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Original Invoice Total:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.originalInvoiceTotal || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          New Sales Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.currentSalesAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          New Exempt Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.currentExemptAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          New Taxable Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.currentTaxableAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          New Gst Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.currentGstAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          New Invoice Total:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(totals.currentInvoiceTotal || 0).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="bold">
                            Invoice Difference:
                          </Typography>
                          {((totals.currentInvoiceTotal || 0) - (totals.originalInvoiceTotal || 0)) > 0 ? (
                            <Typography variant="body1" color="green" fontWeight="medium">
                              Credit +{(((totals.currentInvoiceTotal || 0) - (totals.originalInvoiceTotal || 0))).toFixed(2)}
                            </Typography>
                          ) : ((totals.currentInvoiceTotal || 0) - (totals.originalInvoiceTotal || 0)) < 0 ? (
                            <Typography variant="body1" color="error" fontWeight="medium">
                              Debit -{(Math.abs((totals.currentInvoiceTotal || 0) - (totals.originalInvoiceTotal || 0))).toFixed(2)}
                            </Typography>
                          ) : (
                            <Typography variant="body1" color="text.secondary" fontWeight="medium">
                              No change
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || formData.items.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Updating Adjustment...' : 'Update Adjustment'}
              </Button>

              <Link href="/adjustment_list">
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