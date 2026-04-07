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


export default function ViewSecondHandPurchase() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id;

  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);

  // Fetch purchase details
  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/secondhand-purchase/${purchaseId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setPurchaseDetails(data.data);
          // Fetch stock items for this purchase
          fetchStockItems(data.data.purchase_id);
        } else {
          toast.error('Second hand purchase not found');
          router.push('/secondhand-goods-purchase');
        }
      } catch (error) {
        console.error('Error fetching purchase details:', error);
        toast.error('Failed to load purchase details');
        router.push('/secondhand-goods-purchase');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [purchaseId, router]);

  // Fetch stock items
  const fetchStockItems = async (purchaseId) => {
    try {
      setLoadingStock(true);
      const response = await fetch(`/api/secondhand-stock?purchase_id=${purchaseId}`);
      const data = await response.json();

      if (data.success) {
        setStockItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoadingStock(false);
    }
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

  // Get stock status count
  const getStockStatusCount = () => {
    const available = stockItems.filter(item => item.is_available && !item.is_sold).length;
    const sold = stockItems.filter(item => item.is_sold).length;
    const notAvailable = stockItems.filter(item => !item.is_available && !item.is_sold).length;

    return { available, sold, notAvailable, total: stockItems.length };
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
        <Link href="/secondhand-goods-purchase">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Back to Second Hand Purchases
          </Button>
        </Link>
      </Box>
    );
  }

  const supplier = getSupplierInfo(purchaseDetails.supplier);
  const dealer = getDealerInfo(purchaseDetails.dealer);
  const organization = getOrganizationInfo(purchaseDetails.organization);
  const stockStatus = getStockStatusCount();

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={3}>
        {/* Header */}
        {/*<Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1">
                  Second Hand Purchase Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PO No: {purchaseDetails.purchase_order_no}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PackageIcon />}
                onClick={() => router.push(`/secondhand-stock?purchase_id=${purchaseId}`)}
              >
                View Stock ({stockStatus.total})
              </Button>
              <Link href={`/secondhand-goods-purchase/edit/${purchaseId}`}>
                <Button variant="contained" startIcon={<EditIcon />}>
                  Edit Purchase
                </Button>
              </Link>
            </Box>
          </Box>
        </Grid>*/}

        {/* Purchase Information Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Purchase Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">Purchase Information</Typography>

                    </Box>
                  }
                />
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
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">GST %</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">GST Amount</TableCell>
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
                          const gstAmount = parseFloat(item.gst_amount) || 0;
                          const itemTotal = amountAfterDiscount + gstAmount;

                          // Count stock items for this purchase item
                          const itemStockItems = stockItems.filter(
                            stock => stock.purchase_item_id === item.purchase_item_id
                          );
                          const availableStock = itemStockItems.filter(s => s.is_available && !s.is_sold).length;
                          const soldStock = itemStockItems.filter(s => s.is_sold).length;

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
                              <TableCell align="right">{parseFloat(item.unit_price || 0).toFixed(2)}</TableCell>
                              <TableCell align="right">{item.quantity || '0'}</TableCell>
                              <TableCell align="right">{amount.toFixed(2)}</TableCell>
                              <TableCell align="right">
                                {discount > 0 ? `-${discount.toFixed(2)}` : '0.00'}
                              </TableCell>
                              <TableCell align="right">
                                {amountAfterDiscount.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                {item.gst_percentage ? `${item.gst_percentage}%` : '0%'}
                              </TableCell>
                              <TableCell align="right">
                                {gstAmount > 0 ? `${gstAmount.toFixed(2)}` : '0.00'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                                {itemTotal.toFixed(2)}
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

        {/* Right Sidebar - Totals, Inventory Summary, and Actions */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Totals Summary */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Amount Summary" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Exempt Amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Exempt Amount:
                      </Typography>
                      <Typography variant="body2">
                        {parseFloat(purchaseDetails?.exempt_amount || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Taxable Amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taxable Amount:
                      </Typography>
                      <Typography variant="body2">
                        {parseFloat(purchaseDetails?.taxable_amount || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    {/* GST */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        5% GST on Taxable amount:
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {parseFloat(purchaseDetails?.gst_amount || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="body1">
                        {parseFloat(purchaseDetails?.sales_amount || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Grand Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        Grand Total:
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {parseFloat(purchaseDetails?.total_invoice_amount || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Inventory Summary */}


            {/* Actions */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Actions" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link href={`/secondhand-goods-purchase/edit/${purchaseId}`} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<EditIcon />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Edit Purchase
                      </Button>
                    </Link>



                    <Link href="/secondhand-goods-purchase" style={{ textDecoration: 'none' }}>
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
          <Link href="/secondhand-goods-purchase">
            <Button variant="outlined" sx={{ backgroundColor: 'red', color: 'white' }}>
              Close
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}