"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { toast } from "sonner";
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';

export default function View() {
  const router = useRouter();
  const params = useParams();
  const adjustmentId = params.id;

  // Data states
  const [adjustmentData, setAdjustmentData] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch adjustment data
  useEffect(() => {
    const fetchAdjustmentData = async () => {
      try {
        setLoading(true);

        // Fetch adjustment details
        const adjustmentRes = await fetch(`/api/adjustment/${adjustmentId}`);
        const adjustmentData = await adjustmentRes.json();

        if (!adjustmentData.success || !adjustmentData.data) {
          toast.error('Adjustment not found');
          router.push('/adjustment_list');
          return;
        }

        const adjustment = adjustmentData.data;
        setAdjustmentData(adjustment);

        // Fetch sale details
        if (adjustment.sale_id) {
          const saleRes = await fetch(`/api/sales/${adjustment.sale_id}`);
          const saleData = await saleRes.json();

          if (saleData.success && saleData.data) {
            const sale = saleData.data;
            setSaleDetails(sale);

            // Transform original sale items for comparison
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
                is_new_item: false,
              };
            });

            setOriginalItems(transformedItems);
          }
        }

      } catch (error) {
        console.error('Error fetching adjustment data:', error);
        toast.error('Failed to load adjustment data');
      } finally {
        setLoading(false);
      }
    };

    if (adjustmentId) {
      fetchAdjustmentData();
    }
  }, [adjustmentId, router]);

  const handleDownloadPDF = () => {
    if (!adjustmentId) return;
    window.open(`/api/adjustment/pdf/${adjustmentId}`, '_blank');
  }

  // Calculate original item totals
  const calculateOriginalItemTotals = (item) => {
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
  };

  // Calculate current item totals (for display)
  const calculateCurrentItemTotals = (item) => {
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
    const total = amountAfterDiscount + gstAmount;

    return { amount, discountAmount, amountAfterDiscount, gstAmount, total };
  };

  // Calculate overall totals
  const calculateTotals = () => {
    if (!adjustmentData || !adjustmentData.items) return {
      totalOriginalAmount: 0,
      totalCurrentAmount: 0,
      totalAdjustment: 0,
      currentSalesAmount: 0,
      currentTaxableAmount: 0,
      currentExemptAmount: 0,
      currentGstAmount: 0,
      currentInvoiceTotal: 0,
      originalSalesAmount: 0,
      originalTaxableAmount: 0,
      originalExemptAmount: 0,
      originalGstAmount: 0,
      originalInvoiceTotal: 0
    };

    let totalOriginalAmount = 0;
    let totalCurrentAmount = 0;
    let currentSalesAmount = 0;
    let currentTaxableAmount = 0;
    let currentExemptAmount = 0;
    let currentGstAmount = 0;
    let originalSalesAmount = 0;
    let originalTaxableAmount = 0;
    let originalExemptAmount = 0;
    let originalGstAmount = 0;

    adjustmentData.items.forEach((item, index) => {
      const currentTotals = calculateCurrentItemTotals(item);
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

      // Calculate original totals if available
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
    });

    // GST is 5% of total taxable amount
    currentGstAmount = currentTaxableAmount * 0.05;
    const currentInvoiceTotal = currentSalesAmount + currentGstAmount;

    // Compute original GST and invoice totals
    originalGstAmount = originalTaxableAmount * 0.05;
    const originalInvoiceTotal = originalSalesAmount + originalGstAmount;

    return {
      totalOriginalAmount,
      totalCurrentAmount,
      totalAdjustment: totalCurrentAmount - totalOriginalAmount,
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
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'A': return 'success';
      case 'IP': return 'warning';
      case 'C': return 'error';
      default: return 'default';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'A': return 'Approved';
      case 'IP': return 'In Progress';
      case 'C': return 'Cancelled';
      default: return status;
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading adjustment details...</Typography>
      </Box>
    );
  }

  if (!adjustmentData) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Adjustment not found
        </Typography>
        <Link href="/adjustment_list">
          <Button variant="contained">
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Adjustment Details - {adjustmentData.invoice_no}
            </Typography>

          </Box>
        </Grid>

        {/* Adjustment Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Adjustment Information" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Adjustment ID:</Typography>
                  <Typography variant="body1" fontWeight="medium">{adjustmentData.adjustment_id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Created Date:</Typography>
                  <Typography variant="body1">
                    {new Date(adjustmentData.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Created By:</Typography>
                  <Typography variant="body1">{adjustmentData.created_by_name || 'System'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Adjustment Type:</Typography>
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    color={adjustmentData.adjustment_type === 'CREDIT' ? 'green' : 'error'}
                  >
                    {adjustmentData.adjustment_type || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Adjustment Amount:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {parseFloat(adjustmentData.adjustment_amount || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Invoice Information" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Invoice No:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {saleDetails?.sales_invoice_no || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Sales Date:</Typography>
                  <Typography variant="body1">
                    {saleDetails?.sales_date ? new Date(saleDetails.sales_date).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Customer Name:</Typography>
                  <Typography variant="body1">{adjustmentData.customer_name || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Customer TPN:</Typography>
                  <Typography variant="body1">{adjustmentData.customer_tpn || 'N/A'}</Typography>
                </Box> */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Currency:</Typography>
                  <Typography variant="body1">{adjustmentData.invoice?.currency_info?.currencyName || 'N/A'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Totals Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Summary" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Original Total:</Typography>
                  <Typography variant="body1">{totals.originalInvoiceTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Adjusted Total:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {totals.currentInvoiceTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Difference:</Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={totals.totalAdjustment > 0 ? 'green' : totals.totalAdjustment < 0 ? 'error' : 'text.primary'}
                  >
                    {totals.totalAdjustment > 0 ? '+' : ''}{totals.totalAdjustment.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Items: {adjustmentData.items?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Items Table */}
        <Grid item xs={12}>
          <Card sx={{ overflow: 'visible' }}>
            <CardHeader
              title={
                <Typography variant="h5" fontWeight="bold">
                  Adjustment Items
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Showing all items from the adjustment
                </Typography>
              }
            />

            <CardContent sx={{ p: 2 }}>
              {(!adjustmentData.items || adjustmentData.items.length === 0) ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 8,
                  border: '2px dashed #e0e0e0',
                  borderRadius: 2
                }}>
                  <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                    No adjustment items
                  </Typography>
                </Box>
              ) :
                (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                      maxHeight: 'calc(100vh - 400px)',
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
                          {/* <TableCell sx={{ minWidth: 150, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Adjustment Reason</TableCell>
                        <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Adjustment Type</TableCell>
                        <TableCell sx={{ minWidth: 150, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Adjustment Amount</TableCell> */}
                          <TableCell sx={{ minWidth: 130, bgcolor: '#f5f5f5', fontWeight: 'bold', py: 2 }}>Total</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {adjustmentData.items.map((item, index) => {
                          const currentTotals = calculateCurrentItemTotals(item);
                          const originalItem = originalItems[index];
                          const originalTotals = originalItem ? calculateOriginalItemTotals(originalItem) : { total: 0 };
                          const difference = currentTotals.total - originalTotals.total;

                          return (
                            <TableRow key={index} hover>
                              {/* TYPE */}
                              <TableCell>
                                <Chip
                                  label={item.sales_item_type}
                                  size="small"
                                  color={item.sales_item_type === 'GOODS' ? 'primary' : 'secondary'}
                                />
                              </TableCell>

                              {/* ITEM */}
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.goods_service_name}
                                  </Typography>
                                  {item.goods_service_description && (
                                    <Typography variant="caption" color="text.secondary">
                                      {item.goods_service_description}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>

                              {/* UNIT */}
                              <TableCell>
                                <Typography variant="body2">
                                  {item.unit_of_measurement_name || item.unit_of_measurement_id || 'N/A'}
                                </Typography>
                              </TableCell>

                              {/* PRICE */}
                              <TableCell>
                                <Typography variant="body2">
                                  {parseFloat(item.unit_price).toFixed(2)}
                                </Typography>
                           
                              </TableCell>

                              {/* QTY */}
                              <TableCell>
                                <Typography variant="body2">
                                  {parseFloat(item.quantity).toFixed(2)}
                                </Typography>
                                
                              </TableCell>

                              {/* Amount */}
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium" color="#1976d2">
                                  {currentTotals.amount.toFixed(2)}
                                </Typography>
                              </TableCell>

                              {/* DISCOUNT */}
                              <TableCell>
                                <Typography variant="body2">
                                  {item.discount || '0'}
                                </Typography>
                               
                              </TableCell>

                              {/* Amount After Discount */}
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium" color="#2e7d32">
                                  {currentTotals.amountAfterDiscount.toFixed(2)}
                                </Typography>
                              </TableCell>

                              {/* GST */}
                              <TableCell>
                                <Typography variant="body2">
                                  {parseFloat(item.gst_percentage)}%
                                </Typography>
                                
                              </TableCell>

                              {/* ADJUSTMENT REASON */}
                              {/* <TableCell>
                                <Typography variant="body2">
                                  {item.reason_for_adjustment || 'N/A'}
                                </Typography>
                              </TableCell> */}

                              {/* ADJUSTMENT TYPE */}
                              {/* <TableCell>
                                <Chip
                                  label={item.adjustment_type || 'NONE'}
                                  size="small"
                                  color={item.adjustment_type === 'CREDIT' ? 'success' :
                                    item.adjustment_type === 'DEBIT' ? 'error' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell> */}

                              {/* ADJUSTMENT AMOUNT */}
                              {/* <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight="medium"
                                  color={item.adjustment_type === 'CREDIT' ? 'green' :
                                    item.adjustment_type === 'DEBIT' ? 'error' : 'text.primary'}
                                >
                                  {parseFloat(item.adjustment_amount || 0).toFixed(2)}
                                </Typography>
                              </TableCell> */}

                              {/* TOTAL */}
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#000000ff' }}>
                                    {currentTotals.total.toFixed(2)}
                                  </Typography>
                                 
                                </Box>
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

        {/* Detailed Summary */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Adjustment Summary" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Original Invoice
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Sales Amount:
                      </Typography>
                      <Typography variant="body1">
                        {totals.originalSalesAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Exempt Amount:
                      </Typography>
                      <Typography variant="body1">
                        {totals.originalExemptAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taxable Amount:
                      </Typography>
                      <Typography variant="body1">
                        {totals.originalTaxableAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        GST Amount (5%):
                      </Typography>
                      <Typography variant="body1">
                        {totals.originalGstAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        Invoice Total:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {totals.originalInvoiceTotal.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Adjusted Invoice
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Sales Amount:
                      </Typography>
                      <Typography variant="body1">
                        {adjustmentData.sales_amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Exempt Amount:
                      </Typography>
                      <Typography variant="body1">
                        {adjustmentData.exempt_amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taxable Amount:
                      </Typography>
                      <Typography variant="body1">
                        {adjustmentData.taxable_amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        GST Amount (5%):
                      </Typography>
                      <Typography variant="body1">
                        {adjustmentData.gst_amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        Invoice Total:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {adjustmentData.total_invoice_amount}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Net Change */}
              <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Adjustment Type:
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {adjustmentData.adjustment_type || 'NONE'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Net Change:
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color={totals.totalAdjustment > 0 ? 'green' : totals.totalAdjustment < 0 ? 'error' : 'text.primary'}
                      >
                        {totals.totalAdjustment > 0 ? '+' : ''}{totals.totalAdjustment.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Remark */}
        {adjustmentData.remark && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Remark" />
              <CardContent>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={adjustmentData.remark}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            <Link href={`/adjustment/edit/${adjustmentId}`}>
              <Button variant="contained" color="primary">
                Edit Adjustment
              </Button>
            </Link>
            <Link href="/adjustment_list" sx={{ backgroundColor: 'red', color: 'white' }}>
              <Button
                sx={{
                  backgroundColor: 'red',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'red',
                  },
                }}
              >
                Close
              </Button>

            </Link>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}