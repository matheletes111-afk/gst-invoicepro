"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';

// Payment mode labels
const PAYMENT_MODES = {
  'CASH': 'Cash',
  'CHEQUE': 'Cheque',
  'PAYMENT_GATEWAY': 'Payment Gateway',
  'MBOB': 'mBOB',
  'MPAY': 'mPAY',
  'TPAY': 'TPay',
  'DRUKPAY': 'DrukPay',
  'EPAY': 'ePay',
  'DK_BANK': 'DK Bank',
};

// Bank options for Cheque payment
const BANK_OPTIONS = [
  { value: 'Bank of Bhutan', label: 'Bank of Bhutan' },
  { value: 'Bhutan National Bank', label: 'Bhutan National Bank' },
  { value: 'Druk PNB', label: 'Druk PNB' },
  { value: 'BDBL', label: 'BDBL' },
  { value: 'T Bank', label: 'T Bank' },
];

// Status chip colors
const getStatusColor = (status) => {
  switch (status) {
    case 'IP':
      return 'warning';
    case 'CO':
      return 'success';
    case 'CA':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'IP':
      return 'In Progress';
    case 'CO':
      return 'Completed';
    case 'CA':
      return 'Cancelled';
    default:
      return status;
  }
};

export default function View() {
  const router = useRouter();
  const params = useParams();
  const salesId = params.id;

  // State
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sale data
  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/secondhand-sales/${salesId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setSale(data.data);
        } else {
          setError('Sale not found');
        }
      } catch (error) {
        console.error('Error fetching sale:', error);
        setError('Failed to load sale data');
      } finally {
        setLoading(false);
      }
    };

    fetchSaleData();
  }, [salesId]);

  // Calculate totals
  const calculateTotals = (items) => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;

    items?.forEach(item => {
      const amount = (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);
      subtotal += amount;

      // Calculate discount
      let discountAmount = 0;
      if (item.discount) {
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
      totalDiscount += discountAmount;

      // Calculate GST
      const amountAfterDiscount = amount - discountAmount;
      const gstRate = parseFloat(item.gst_percentage) || 0;
      const gstAmount = (amountAfterDiscount * gstRate) / 100;
      totalGst += gstAmount;

      grandTotal += amountAfterDiscount + gstAmount;
    });

    return { subtotal, totalDiscount, totalGst, grandTotal };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0).replace('₹', '₹');
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/invoice/download/${salesId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${sale.sales_invoice_no}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading sale data...</Typography>
      </Box>
    );
  }

  if (error || !sale) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Sale not found'}
        </Typography>
        <Link href="/secondhand-sales">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Back to Sales
          </Button>
        </Link>
      </Box>
    );
  }

  const totals = calculateTotals(sale.items);
  const paymentModeLabel = PAYMENT_MODES[sale.payment_mode] || sale.payment_mode;
  const bankName = sale.bank_name || BANK_OPTIONS.find(bank => bank.value === sale.bank_name)?.label || sale.bank_name;

  return (
    <Box sx={{ p: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Second Hand Sale Details
          </Typography>
          {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Invoice #: {sale.sales_invoice_no}
            </Typography>
            <Chip
              label={getStatusText(sale.status)}
              color={getStatusColor(sale.status)}
              size="small"
            />
          </Box> */}
        </Box>

      </Box>

      <Grid container spacing={3}>
        {/* Sale Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Sale Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {sale.sales_invoice_no}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sale Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(sale.sales_date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Currency
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {sale.currency || 'N/A'}
                  </Typography>
                </Grid>
                {/* <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusText(sale.status)}
                    color={getStatusColor(sale.status)}
                    size="small"
                  />
                </Grid> */}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Customer Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Customer Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {sale.customer_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {sale.customer?.partyType || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    TPN
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {sale.customer_tpn || 'N/A'}
                  </Typography>
                </Grid>
                {sale.customer?.individualParty && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        CID
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {sale.customer.individualParty.cid || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {sale.customer.individualParty.phone || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {sale.customer.individualParty.email || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tax Region
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {sale.customer.individualParty.taxPayerRegion || 'N/A'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Information */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Payment Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Mode
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {paymentModeLabel}
                  </Typography>
                </Grid>

                {sale.payment_mode === 'PAYMENT_GATEWAY' && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Transaction ID
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {sale.transaction_id || sale.upi_id || 'N/A'}
                    </Typography>
                  </Grid>
                )}

                {(sale.payment_mode === 'MBOB' ||
                  sale.payment_mode === 'MPAY' ||
                  sale.payment_mode === 'TPAY' ||
                  sale.payment_mode === 'DRUKPAY' ||
                  sale.payment_mode === 'EPAY' ||
                  sale.payment_mode === 'DK_BANK') && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Journal Number
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {sale.journal_number || 'N/A'}
                      </Typography>
                    </Grid>
                  )}

                {sale.payment_mode === 'CHEQUE' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Cheque Number
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {sale.cheque_number || sale.check_number || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Bank Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {bankName}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sale Items */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Sale Items" />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Discount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">GST %</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">GST Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items?.map((item, index) => {
                      const amount = (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);

                      // Calculate discount
                      let discountAmount = 0;
                      let discountText = item.discount || '';
                      if (item.discount) {
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
                      const gstRate = parseFloat(item.gst_percentage) || 0;
                      const gstAmount = (amountAfterDiscount * gstRate) / 100;
                      const total = amountAfterDiscount + gstAmount;

                      return (
                        <TableRow key={item.id || index} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.sales_item_type || 'GOODS'}
                              size="small"
                              color={item.sales_item_type === 'SERVICE' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{item.goods_service_name}</TableCell>
                          <TableCell>
                            {item.unit?.name || 'N/A'}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{discountText || '0'}</TableCell>
                          <TableCell align="right">{gstRate}%</TableCell>
                          <TableCell align="right">{formatCurrency(amount)}</TableCell>
                          <TableCell align="right">{formatCurrency(gstAmount)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="primary">
                              {formatCurrency(total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Empty state */}
                    {(!sale.items || sale.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No items found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Totals Summary */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Totals Summary" />
            <CardContent>
              <Box sx={{ maxWidth: 400, ml: 'auto' }}>
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="body1">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" align="right">
                      {formatCurrency(totals.subtotal)}
                    </Typography>
                  </Grid>

                  <Grid item xs={8}>
                    <Typography variant="body1" color="text.secondary">
                      Discount:
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" align="right" color="text.secondary">
                      -{formatCurrency(totals.totalDiscount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={8}>
                    <Typography variant="body1" color="text.secondary">
                      GST:
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" align="right" color="text.secondary">
                      {formatCurrency(totals.totalGst)}
                    </Typography>
                  </Grid>

                  <Divider sx={{ my: 1, width: '100%' }} />

                  <Grid item xs={8}>
                    <Typography variant="h6" fontWeight="bold">
                      Grand Total:
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" fontWeight="bold" align="right" color="primary">
                      {formatCurrency(totals.grandTotal)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Footer Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ display: { xs: 'flex', md: 'none' } }}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ display: { xs: 'flex', md: 'none' } }}
              >
                Download
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* <Link href={`/secondhand-goods-sales/edit/${salesId}`}>
                <Button variant="contained" startIcon={<EditIcon />}>
                  Edit Sale
                </Button>
              </Link> */}
              <Link href="/secondhand-goods-sales">
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "red",
                    "&:hover": { backgroundColor: "#cc0000" }
                  }}
                >
                  Close
                </Button>
              </Link>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable, #printable * {
            visibility: visible;
          }
          #printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}</style>

      {/* Printable Invoice */}
      <Box id="printable" sx={{ display: 'none' }}>
        <Box sx={{ p: 4 }}>
          {/* Invoice Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, borderBottom: '2px solid #000', pb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                INVOICE
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Second Hand Sale
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight="bold">
                {sale.sales_invoice_no}
              </Typography>
              <Typography variant="body2">
                Date: {formatDate(sale.sales_date)}
              </Typography>
              {/* <Typography variant="body2">
                Status: {getStatusText(sale.status)}
              </Typography> */}
            </Box>
          </Box>

          {/* Company & Customer Info */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Seller Information
              </Typography>
              <Typography>Your Company Name</Typography>
              <Typography>Your Company Address</Typography>
              <Typography>Phone: Your Company Phone</Typography>
              <Typography>Email: Your Company Email</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Information
              </Typography>
              <Typography>{sale.customer_name || 'N/A'}</Typography>
              <Typography>TPN: {sale.customer_tpn || 'N/A'}</Typography>
              {sale.customer?.individualParty && (
                <>
                  <Typography>CID: {sale.customer.individualParty.cid || 'N/A'}</Typography>
                  <Typography>Phone: {sale.customer.individualParty.phone || 'N/A'}</Typography>
                  <Typography>Email: {sale.customer.individualParty.email || 'N/A'}</Typography>
                </>
              )}
            </Grid>
          </Grid>

          {/* Items Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">GST %</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sale.items?.map((item, index) => {
                  const amount = (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);

                  let discountText = item.discount || '';
                  if (!discountText && item.discount > 0) {
                    discountText = formatCurrency(item.discount);
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.goods_service_name}</TableCell>
                      <TableCell>{item.goods_service_description || 'N/A'}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{discountText || '0'}</TableCell>
                      <TableCell align="right">{parseFloat(item.gst_percentage) || 0}%</TableCell>
                      <TableCell align="right">{formatCurrency(amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Box sx={{ maxWidth: 300, ml: 'auto' }}>
            <Grid container spacing={1}>
              <Grid item xs={7}>
                <Typography>Subtotal:</Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography align="right">{formatCurrency(totals.subtotal)}</Typography>
              </Grid>

              <Grid item xs={7}>
                <Typography>Discount:</Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography align="right">-{formatCurrency(totals.totalDiscount)}</Typography>
              </Grid>

              <Grid item xs={7}>
                <Typography>GST:</Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography align="right">{formatCurrency(totals.totalGst)}</Typography>
              </Grid>

              <Grid item xs={7}>
                <Typography variant="h6" fontWeight="bold">
                  Grand Total:
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="h6" fontWeight="bold" align="right">
                  {formatCurrency(totals.grandTotal)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Payment Info */}
          <Box sx={{ mt: 6, pt: 4, borderTop: '1px dashed #ccc' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Payment Information
            </Typography>
            <Typography>
              Payment Mode: {paymentModeLabel}
            </Typography>
            {sale.payment_mode === 'PAYMENT_GATEWAY' && sale.transaction_id && (
              <Typography>Transaction ID: {sale.transaction_id}</Typography>
            )}
            {sale.payment_mode === 'CHEQUE' && sale.cheque_number && (
              <Typography>Cheque #: {sale.cheque_number} - {bankName}</Typography>
            )}
            {(sale.payment_mode === 'MBOB' ||
              sale.payment_mode === 'MPAY' ||
              sale.payment_mode === 'TPAY' ||
              sale.payment_mode === 'DRUKPAY' ||
              sale.payment_mode === 'EPAY' ||
              sale.payment_mode === 'DK_BANK') && sale.journal_number && (
                <Typography>Journal #: {sale.journal_number}</Typography>
              )}
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 8, textAlign: 'center', color: '#666' }}>
            <Typography variant="body2">
              Thank you for your business!
            </Typography>
            <Typography variant="caption">
              This is a computer generated invoice. No signature required.
            </Typography>
          </Box>


        </Box>
      </Box>
    </Box>
  );
}