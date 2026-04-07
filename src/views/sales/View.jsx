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

  const [sending, setSending] = useState({});

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




  const getSupplierInfo = (organization) => {
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





  const getCustomerInfo = (customer) => {
    if (!customer) return {};

    switch (customer.partyType) {
      case "BUSINESS":
        return {
          name: customer.businessParty?.businessName,
          tpn: customer.businessParty?.taxPayerRegNo,
          email: customer.businessParty?.officeEmail,
          phone: customer.businessParty?.officePhone,
          address: customer.businessParty?.address,
        };

      case "GOVERNMENT_AGENCY":
        return {
          name: customer.governmentAgencyParty?.agencyName,
          tpn: customer.governmentAgencyParty?.taxPayerRegNo,
          email: customer.governmentAgencyParty?.officeEmail,
          phone: customer.governmentAgencyParty?.officePhone,
          address: customer.governmentAgencyParty?.address,
        };

      case "CORPORATION":
        return {
          name: customer.corporationParty?.corporationName,
          tpn: customer.corporationParty?.taxPayerRegNo,
          email: customer.corporationParty?.officeEmail,
          phone: customer.corporationParty?.officePhone,
          address: customer.corporationParty?.address,
        };

      case "CSO":
        return {
          name: customer.csoParty?.agencyName,
          tpn: customer.csoParty?.taxPayerRegNo,
          email: customer.csoParty?.officeEmail,
          phone: customer.csoParty?.officePhone,
          address: customer.csoParty?.address,
        };

      case "INDIVIDUAL":
        return {
          name: customer.individualParty?.fullName,
          tpn: customer.individualParty?.cid,
          email: customer.individualParty?.email,
          phone: customer.individualParty?.phone,
          address: customer.individualParty?.address,
        };

      default:
        return {};
    }
  };




  const parseAddressFromJson = (json) => {
    try {
      if (!json) return ''

      const data = typeof json === 'string' ? JSON.parse(json) : json

      const parts = [
         data.flatNo && `Flat: ${data.flatNo}.`,
          data.buildingNo && `Building: ${data.buildingNo}.`,
          data.locality && `Locality: ${data.locality}.`,
          data.wardName && `Street: ${data.wardName}.`,
          data.village && `Village: ${data.village}.`,
          data.gewog && `Gewog: ${data.gewog}.`,
          data.dzongkhag && `Dzongkhag: ${data.dzongkhag}.`
      ]

      return parts.filter(Boolean).join(', ')
    } catch (error) {
      console.error('Invalid address JSON:', error)
      return ''
    }
  }


  const supplier = getSupplierInfo(saleDetails.organization);
  const customer = getCustomerInfo(saleDetails.customer);





  const sendInvoice = async (sales_id, emailOriginalInvoiceSent) => {
    try {
      // Show loading for this specific row
      setSending(prev => ({ ...prev, [sales_id]: true }));

      const res = await fetch("/api/invoice/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success(
        data.type === "ORIGINAL"
          ? "✅ Original invoice sent successfully!"
          : "📄 Copy invoice sent successfully!"
      );

    } catch (err) {
      toast.error(err.message || "Failed to send invoice");
    } finally {
      setSending(prev => ({ ...prev, [sales_id]: false }));
    }
  };





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


                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Payment Mode
                      </Typography>

                      <Typography variant="body1">
                        {!saleDetails.payment_mode && 'N/A'}

                        {saleDetails.payment_mode === 'CASH' && 'Cash'}

                        {saleDetails.payment_mode === 'PAYMENT_GATEWAY' &&
                          `Payment Gateway (Txn ID: ${saleDetails.transaction_id || 'N/A'})`}

                        {['MBOB', 'MPAY', 'TPAY', 'DRUKPAY', 'EPAY', 'DK_BANK'].includes(
                          saleDetails.payment_mode
                        ) &&
                          `${saleDetails.payment_mode} (Journal No: ${saleDetails.journal_number || 'N/A'
                          })`}

                        {saleDetails.payment_mode === 'CHEQUE' &&
                          `Cheque (No: ${saleDetails.cheque_number || 'N/A'}, Bank: ${saleDetails.bank_name
                            ? saleDetails.bank_name.replace(/_/g, ' ')
                            : 'N/A'
                          })`}
                      </Typography>
                    </Grid>


                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* supplier and Customer Information */}
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

                    {supplier.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography>{supplier.email}</Typography>
                      </Grid>
                    )}

                    {/* {supplier.phone && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography>{supplier.phone}</Typography>
                      </Grid>
                    )} */}

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


            <Grid item xs={12}>
              <Card>
                <CardHeader title="Customer Information" />
                <CardContent>
                  <Grid container spacing={3}>
                    {customer.name && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Customer Name</Typography>
                        <Typography fontWeight="medium">{customer.name}</Typography>
                      </Grid>
                    )}

                    {customer.tpn && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Taxpayer Registration No</Typography>
                        <Typography>{customer.tpn}</Typography>
                      </Grid>
                    )}

                    {customer.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography>{customer.email}</Typography>
                      </Grid>
                    )}

                    {customer.phone && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography>{customer.phone}</Typography>
                      </Grid>
                    )}

                    {customer.address && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Address</Typography>
                        <Typography>{customer.address}</Typography>
                      </Grid>
                    )}
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

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={() => sendInvoice(saleDetails.sales_id, saleDetails.emailOriginalInvoiceSent)}
                      disabled={sending[saleDetails.sales_id]}
                      className={`btn ${saleDetails.emailOriginalInvoiceSent === 'Y' ? 'btn-primary' : 'btn-secondary'}`}
                      title={saleDetails.emailOriginalInvoiceSent === 'Y'
                        ? "Send Original Invoice"
                        : "Send Copy Invoice"
                      }
                    >
                      {sending[saleDetails.sales_id] ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Sending...
                        </>
                      ) : (
                        <> {saleDetails.emailOriginalInvoiceSent === 'Y' ? 'Send Original Invoice To Email' : 'Send Copy Invoice To Email'}
                        </>
                      )}
                    </Button>
                    <Link href={`/sales/edit/${salesId}`} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<EditIcon />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Edit Sale
                      </Button>
                    </Link>
                    <Link href="/sales" style={{ textDecoration: 'none' }}>
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
          <Link href="/sales">
            <Button variant="outlined" sx={{ backgroundColor: 'red', color: 'white', }}>
              Close
            </Button>
          </Link>

        </Box>
      </Box>
    </Box>
  );
}