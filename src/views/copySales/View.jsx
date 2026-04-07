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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';

export default function View() {
  const router = useRouter();
  const params = useParams();
  const salesId = params.id;

  const [saleDetails, setSaleDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch sale details
  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sales/${salesId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setSaleDetails(data.data);
        } else {
          toast.error('Sale not found');
          router.push('/sales');
        }
      } catch (error) {
        console.error('Error fetching sale details:', error);
        toast.error('Failed to load sale details');
        router.push('/sales');
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [salesId, router]);

  // Calculate totals for display
  const calculateTotals = (items = []) => {
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalGST = 0;
    let taxableAmount = 0;
    let exemptAmount = 0;

    items.forEach(item => {
      // const amount = (item.unit_price || 0) * (item.quantity || 0);
      // const discount = item.discount || 0;
      // const amountAfterDiscount = amount - discount;
      // const gstAmount = item.gst_amount || 0;
      // const itemTotal = amountAfterDiscount + gstAmount;

      const amount =
        (parseFloat(item.unit_price) || 0) *
        (parseFloat(item.quantity) || 0);

      const discount = parseFloat(item.discount) || 0;

      const amountAfterDiscount = amount - discount;

      const gstAmount = parseFloat(item.gst_amount) || 0;

      const itemTotal = amountAfterDiscount + gstAmount;


      totalAmount += amount;
      totalDiscount += discount;
      totalGST += gstAmount;

      const gstRate = parseFloat(item.gst_percentage) || 0;
      if (gstRate === 0) {
        exemptAmount += itemTotal;
      } else {
        taxableAmount += itemTotal;
      }
    });

    return {
      totalAmount,
      totalDiscount,
      totalGST,
      taxableAmount,
      exemptAmount,
      grandTotal: totalAmount - totalDiscount + totalGST
    };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'C': return 'success';
      case 'IP': return 'warning';
      case 'CN': return 'error';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'C': return 'Completed';
      case 'IP': return 'In Progress';
      case 'CN': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading sale details...</Typography>
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
            Back to Sales
          </Button>
        </Link>
      </Box>
    );
  }

  const totals = calculateTotals(saleDetails.items);

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>

              <Typography variant="h4" component="h1">
                Sale Details
              </Typography>
            </Box>

            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={getStatusText(saleDetails.status)}
                color={getStatusColor(saleDetails.status)}
                sx={{ fontWeight: 'medium' }}
              />

            </Box> */}
          </Box>
        </Grid>

        {/* Sale Information Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Invoice Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Invoice Information" />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Invoice Number
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {saleDetails.sales_invoice_no || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Invoice Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(saleDetails.sales_date)}
                      </Typography>
                    </Grid>
                    {/* <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Created By
                      </Typography>
                      <Typography variant="body1">
                        User ID: {saleDetails.created_by}
                      </Typography>
                    </Grid> */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Currency
                      </Typography>
                      <Typography variant="body1">
                        {saleDetails.currency_info.currencyName || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Customer Information" />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Customer Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {saleDetails.customer_name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Taxpayer Registration No
                      </Typography>
                      <Typography variant="body1">
                        {saleDetails.customer_tpn || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Customer ID
                      </Typography>
                      <Typography variant="body1">
                        {saleDetails.customer_id || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Items Table */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Sale Items" />
                <CardContent sx={{ p: 0 }}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Item Type</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Discount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount after Discount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">GST %</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">GST Amount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {saleDetails.items.map((item, index) => {
                          {/* const amount = (item.unit_price || 0) * (item.quantity || 0);
                          const discount = item.discount || 0;
                          const amountAfterDiscount = amount - discount;
                          const gstAmount = item.gst_amount || 0;
                          const itemTotal = amountAfterDiscount + gstAmount; */}

                          const amount =
                            (parseFloat(item.unit_price) || 0) *
                            (parseFloat(item.quantity) || 0);

                          const discount = parseFloat(item.discount) || 0;

                          const amountAfterDiscount = amount - discount;

                          const gstAmount = parseFloat(item.gst_amount) || 0;

                          const itemTotal = amountAfterDiscount + gstAmount;


                          return (
                            <TableRow key={index} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.sales_item_type === 'GOODS' ? 'Goods' : 'Service'}
                                  size="small"
                                  color={item.sales_item_type === 'GOODS' ? 'primary' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.goods_service_name || 'N/A'}
                                  </Typography>
                                  {item.goods_service_description && (
                                    <Typography variant="caption" color="text.secondary">
                                      {item.goods_service_description}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{item.unitObject.name || 'N/A'}</TableCell>
                              <TableCell align="right">{item.unit_price || '0.00'}</TableCell>
                              <TableCell align="right">{item.quantity || '0'}</TableCell>
                              <TableCell align="right">{amount}</TableCell>
                              <TableCell align="right">
                                {discount > 0 ? `-${discount}` : '0.00'}
                              </TableCell>

                               <TableCell align="right">
                                {amountAfterDiscount}
                              </TableCell>
                              
                              <TableCell align="right">
                                {item.gst_percentage ? `${item.gst_percentage}%` : '0%'}
                              </TableCell>
                              <TableCell align="right">
                                {gstAmount > 0 ? `${gstAmount}` : '0.00'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                                {itemTotal}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Sidebar - Totals and Actions */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Totals Summary */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Amount Summary" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Subtotal */}






                    {/* Exempt Amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Exempt Amount:
                      </Typography>
                      <Typography variant="body2">
                        {saleDetails?.exempt_amount ?? 0}
                      </Typography>
                    </Box>

                    {/* Taxable Amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taxable Amount:
                      </Typography>
                      <Typography variant="body2">
                        {saleDetails?.taxable_amount ?? 0}
                      </Typography>
                    </Box>


                    {/* GST */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        5% GST on Taxable amount:
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {saleDetails?.gst_amount ?? 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="body1">
                        {parseFloat(saleDetails?.total_invoice_amount) ?? 0}
                      </Typography>
                    </Box>

                    {/* Discount (if not stored, keep 0 or remove) */}
                    {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Discount:
                      </Typography>
                      <Typography variant="body1" color="error">
                        -{totals.totalDiscount}
                      </Typography>
                    </Box> */}

                    <Divider sx={{ my: 1 }} />

                    <Divider sx={{ my: 1 }} />

                    {/* Grand Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        Grand Total:
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {saleDetails?.total_invoice_amount ?? 0}
                      </Typography>
                    </Box>

                  </Box>
                </CardContent>

              </Card>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Actions" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    <Button

                      variant="outlined"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(`/api/invoice/copy_pdf/${saleDetails.sales_id}`, '_blank')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Invoice
                    </Button>
                    
                    <Link href="sales-copy" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ArrowBackIcon />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Back to Sales List
                      </Button>
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Additional Information" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created On
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(saleDetails.created_on)}
                      </Typography>
                    </Box>
                    {/* <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(saleDetails.updatedAt)}
                      </Typography>
                    </Box> */}
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Organization Name
                      </Typography>
                      <Typography variant="body2">
                        {saleDetails.organization.orgType === "business" ? saleDetails.organization.businessDetails?.businessName :
                          saleDetails.organization.orgType === "government_agency" ? saleDetails.organization.governmentAgencyDetail?.agencyName :
                            saleDetails.organization.orgType === "corporation" ? saleDetails.organization.corporationDetail?.corporationName :
                              saleDetails.organization.orgType === "cso" ? saleDetails.organization.csoDetail?.agencyName :
                                'N/A'
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Items Count
                      </Typography>
                      <Typography variant="body2">
                        {saleDetails.items?.length || 0} items
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Bottom Actions */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Sale ID: {salesId}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="/sales-copy">
            <Button variant="outlined" sx={{ backgroundColor: 'red', color: 'white', }}>
              Close
            </Button>
          </Link>

        </Box>
      </Box>
    </Box>
  );
}