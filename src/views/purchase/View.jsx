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
  const purchaseId = params.id;

  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});

  // Fetch purchase details
  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/purchase/${purchaseId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setPurchaseDetails(data.data);
        } else {
          toast.error('Purchase not found');
          router.push('/purchase');
        }
      } catch (error) {
        console.error('Error fetching purchase details:', error);
        toast.error('Failed to load purchase details');
        router.push('/purchase');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [purchaseId, router]);

  // Calculate totals for display
  const calculateTotals = (items = []) => {
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalGST = 0;
    let taxableAmount = 0;
    let exemptAmount = 0;

    items.forEach(item => {
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

  // Get supplier info
  const getSupplierInfo = (supplier) => {
    if (!supplier) return {};

    return {
      name: supplier.supplierName,
      tpn: supplier.taxpayerRegNo,
      email: supplier.contactEmail,
      phone: supplier.contactPhone,
      licenseNo: supplier.businessLicenseNo,
      address: `${supplier.location || ''}`,
    };
  };

  // Get dealer info
  const getDealerInfo = (dealer) => {
    if (!dealer) return {};

    return {
      name: dealer.dealerName,
      tpn: dealer.taxpayerRegNo,
      email: dealer.contactEmail,
      phone: dealer.contactPhone,
      licenseNo: dealer.businessLicenseNo,
      address: `${dealer.location || ''}`,
    };
  };

  // Get organization info
  const getOrganizationInfo = (organization) => {
    if (!organization) return {};

    switch (organization.orgType) {
      case "business":
        return {
          name: organization.businessDetails?.businessName,
          tpn: organization.businessDetails?.taxpayerNumber,
          email: organization.businessDetails?.registeredCompanyJson?.ceoEmail,
          phone: organization.businessDetails?.partnersJson?.[0]?.phone,
          address: parseAddressFromJson(organization.businessDetails?.businessLocationJson),
        };

      case "government":
        return {
          name: organization.governmentAgencyDetail?.agencyName,
          tpn: organization.governmentAgencyDetail?.taxpayerNumber,
          email: organization.governmentAgencyDetail?.officeEmail,
          phone: organization.governmentAgencyDetail?.officePhone,
          address: organization.governmentAgencyDetail?.address,
        };

      case "corporation":
        return {
          name: organization.corporationDetail?.corporationName,
          tpn: organization.corporationDetail?.taxpayerNumber,
          email: organization.corporationDetail?.officeEmail,
          phone: organization.corporationDetail?.officePhone,
          address: organization.corporationDetail?.address,
        };

      case "cso":
        return {
          name: organization.csoDetail?.agencyName,
          tpn: organization.csoDetail?.taxpayerNumber,
          email: organization.csoDetail?.officeEmail,
          phone: organization.csoDetail?.officePhone,
          address: organization.csoDetail?.address,
        };

      default:
        return {};
    }
  };

  const parseAddressFromJson = (json) => {
    try {
      if (!json) return '';

      const data = typeof json === 'string' ? JSON.parse(json) : json;

      const parts = [
         data.flatNo && `Flat: ${data.flatNo}.`,
          data.buildingNo && `Building: ${data.buildingNo}.`,
          data.locality && `Locality: ${data.locality}.`,
          data.wardName && `Street: ${data.wardName}.`,
          data.village && `Village: ${data.village}.`,
          data.gewog && `Gewog: ${data.gewog}.`,
          data.dzongkhag && `Dzongkhag: ${data.dzongkhag}.`
      ];

      return parts.filter(Boolean).join(', ');
    } catch (error) {
      console.error('Invalid address JSON:', error);
      return '';
    }
  };

  const sendInvoice = async (purchase_id) => {
    try {
      // Show loading for this specific row
      setSending(prev => ({ ...prev, [purchase_id]: true }));

      const res = await fetch("/api/purchase-invoice/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success(
        data.type === "ORIGINAL"
          ? " Original invoice sent successfully!"
          : " Copy invoice sent successfully!"
      );

    } catch (err) {
      toast.error(err.message || "Failed to send invoice");
    } finally {
      setSending(prev => ({ ...prev, [purchase_id]: false }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading purchase details...</Typography>
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

  const totals = calculateTotals(purchaseDetails.items);
  const supplier = getSupplierInfo(purchaseDetails.supplier);
  const dealer = getDealerInfo(purchaseDetails.dealer);
  const organization = getOrganizationInfo(purchaseDetails.organization);

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                Purchase Details
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Purchase Information Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Purchase Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Purchase Information" />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Purchase Order Number
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {purchaseDetails.purchase_order_no || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Purchase Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(purchaseDetails.purchase_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Currency
                      </Typography>
                      <Typography variant="body1">
                        {purchaseDetails.currency_info?.currencyName || 'N/A'}
                      </Typography>
                    </Grid>

                  

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Payment Mode
                      </Typography>

                      <Typography variant="body1">
                        {!purchaseDetails.payment_mode && 'N/A'}

                        {purchaseDetails.payment_mode === 'CASH' && 'Cash'}

                        {purchaseDetails.payment_mode === 'PAYMENT_GATEWAY' &&
                          `Payment Gateway (Txn ID: ${purchaseDetails.transaction_id || 'N/A'})`}

                        {['MBOB', 'MPAY', 'TPAY', 'DRUKPAY', 'EPAY', 'DK_BANK'].includes(
                          purchaseDetails.payment_mode
                        ) &&
                          `${purchaseDetails.payment_mode} (Journal No: ${purchaseDetails.journal_number || 'N/A'
                          })`}

                        {purchaseDetails.payment_mode === 'CHEQUE' &&
                          `Cheque (No: ${purchaseDetails.cheque_number || 'N/A'}, Bank: ${purchaseDetails.bank_name
                            ? purchaseDetails.bank_name.replace(/_/g, ' ')
                            : 'N/A'
                          })`}
                      </Typography>
                    </Grid>

                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Supplier Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Supplier Information" />
                <CardContent>
                  <Grid container spacing={3}>
                    {supplier.name && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Supplier Name</Typography>
                        <Typography fontWeight="medium">{supplier.name}</Typography>
                      </Grid>
                    )}

                    {supplier.tpn && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">TPN</Typography>
                        <Typography>{supplier.tpn}</Typography>
                      </Grid>
                    )}

                    {supplier.licenseNo && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Business License No</Typography>
                        <Typography>{supplier.licenseNo}</Typography>
                      </Grid>
                    )}

                    {supplier.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography>{supplier.email}</Typography>
                      </Grid>
                    )}

                    {supplier.phone && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography>{supplier.phone}</Typography>
                      </Grid>
                    )}

                    {supplier.address && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Address</Typography>
                        <Typography>{supplier.address}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Dealer Information (if exists) */}
            {dealer.name && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Dealer Information" />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Dealer Name</Typography>
                        <Typography fontWeight="medium">{dealer.name}</Typography>
                      </Grid>

                      {dealer.tpn && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">TPN</Typography>
                          <Typography>{dealer.tpn}</Typography>
                        </Grid>
                      )}

                      {dealer.licenseNo && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Business License No</Typography>
                          <Typography>{dealer.licenseNo}</Typography>
                        </Grid>
                      )}

                      {dealer.email && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography>{dealer.email}</Typography>
                        </Grid>
                      )}

                      {dealer.phone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography>{dealer.phone}</Typography>
                        </Grid>
                      )}

                      {dealer.address && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Address</Typography>
                          <Typography>{dealer.address}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Items Table */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Purchase Items" />
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
                          {/*<TableCell sx={{ fontWeight: 'bold' }} align="right">GST %</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">GST Amount</TableCell>*/}
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchaseDetails.items.map((item, index) => {
                          const amount =
                            (parseFloat(item.unit_price) || 0) *
                            (parseFloat(item.quantity) || 0);

                          const discount = parseFloat(item.discount) || 0;
                          const amountAfterDiscount = amount - discount;
                          const gstAmount =  0;
                          const itemTotal = amountAfterDiscount;

                          return (
                            <TableRow key={index} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.purchase_item_type === 'GOODS' ? 'Goods' : 'Service'}
                                  size="small"
                                  color={item.purchase_item_type === 'GOODS' ? 'primary' : 'secondary'}
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
                              <TableCell>{item.unitObject?.name || 'N/A'}</TableCell>
                              <TableCell align="right">{item.unit_price || '0.00'}</TableCell>
                              <TableCell align="right">{item.quantity || '0'}</TableCell>
                              <TableCell align="right">{amount}</TableCell>
                              <TableCell align="right">
                                {discount > 0 ? `-${discount}` : '0.00'}
                              </TableCell>
                              <TableCell align="right">
                                {amountAfterDiscount}
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
                    {/* Exempt Amount */}
                    {/*<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Exempt Amount:
                      </Typography>
                      <Typography variant="body2">
                        {purchaseDetails?.exempt_amount ?? 0}
                      </Typography>
                    </Box>*/}

                    {/* Taxable Amount */}
                    {/*<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taxable Amount:
                      </Typography>
                      <Typography variant="body2">
                        {purchaseDetails?.taxable_amount ?? 0}
                      </Typography>
                    </Box>*/}

                    {/* GST */}
                    {/*<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        5% GST on Taxable amount:
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {purchaseDetails?.gst_amount ?? 0}
                      </Typography>
                    </Box>*/}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="body1">
                        {parseFloat(purchaseDetails?.sales_amount) ?? 0}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Grand Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        Grand Total:
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {purchaseDetails?.total_invoice_amount ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Actions */}
            {/* <Grid item xs={12}>
              <Card>
                <CardHeader title="Actions" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(`/api/purchase-invoice/pdf/${purchaseDetails.purchase_id}`, '_blank')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      View Invoice
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={() => sendInvoice(purchaseDetails.purchase_id)}
                      disabled={sending[purchaseDetails.purchase_id]}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {sending[purchaseDetails.purchase_id] ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Sending...
                        </>
                      ) : (
                        'Send Invoice To Email'
                      )}
                    </Button>

                    <Link href={`/purchase/edit/${purchaseId}`} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<EditIcon />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Edit Purchase
                      </Button>
                    </Link>

                    <Link href="/purchase" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ArrowBackIcon />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Back to Purchases List
                      </Button>
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid> */}

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
                        {formatDate(purchaseDetails.created_on)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Organization Name
                      </Typography>
                      <Typography variant="body2">
                        {organization.name || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Items Count
                      </Typography>
                      <Typography variant="body2">
                        {purchaseDetails.items?.length || 0} items
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
          Purchase ID: {purchaseId}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="/purchase">
            <Button variant="outlined" sx={{ backgroundColor: 'red', color: 'white' }}>
              Close
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}