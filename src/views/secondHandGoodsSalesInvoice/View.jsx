'use client'

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import Button from "@mui/material/Button"
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'

export default function ViewInvoice({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState(null)

  // Load invoice
  const loadInvoice = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/second-hand-goods-sales-invoice/${id}`)
      const data = await res.json()
      if (data.success && data.invoice) {
        setInvoice(data.invoice)
      } else {
        toast.error(data.error || "Invoice not found")
      }
    } catch (err) {
      toast.error("Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadInvoice()
  }, [id])

  const handleDownloadPDF = () => {
    window.open(`/api/second-hand-goods-sales-invoice/${id}/download`, '_blank')
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Invoice...</Typography>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <Typography variant="h6" color="error">Invoice not found</Typography>

        <Link href="/second-hand-goods-sales-invoice" passHref>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "red",
              color: "white",
              "&:hover": {
                backgroundColor: "#cc0000",
              }
            }}
          >
            Close
          </Button>
        </Link>

      </div>
    )
  }

  // Get organization details
  const org = invoice.organization
  const orgDetails = org?.businessDetails || org?.governmentAgencyDetail || org?.corporationDetail || org?.csoDetail

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Invoice Display */}
        <Card>
          <CardContent>
            <div className="invoice-container" style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Tax Invoice</Typography>
                  {invoice.isOriginal && (
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>Original</Typography>
                  )}
                </div>
                <div className="text-right">
                  <Typography variant="body2"><strong>Invoice No.:</strong> {invoice.invoiceNo}</Typography>
                  <Typography variant="body2"><strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}</Typography>
                  {/* QR Code placeholder */}
                  <div className="mt-2 w-24 h-24 bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-xs text-gray-500">
                    QR Code
                  </div>
                </div>
              </div>

              {/* Supplier Details */}
              <div className="mb-6">
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Supplier Details</Typography>
                <Typography variant="body2"><strong>Supplier Name:</strong> {orgDetails?.businessName || orgDetails?.agencyName || 'N/A'}</Typography>
                <Typography variant="body2"><strong>TPN:</strong> {orgDetails?.taxpayerNumber || orgDetails?.tpn || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {orgDetails?.businessLocationJson?.address || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {orgDetails?.contactEmail || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {orgDetails?.contactPhone || 'N/A'}</Typography>
              </div>

              {/* Customer Details */}
              <div className="mb-6">
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Customer Details</Typography>
                <Typography variant="body2"><strong>Customer Name:</strong> {invoice.customerName || 'N/A'}</Typography>
                <Typography variant="body2"><strong>TPN:</strong> {invoice.customerTPN || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {invoice.customerAddress || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {invoice.customerEmail || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {invoice.customerPhone || 'N/A'}</Typography>
              </div>

              {/* Currency */}
              <div className="mb-4">
                <Typography variant="body2"><strong>Currency:</strong> {invoice.currency?.currencySymbol || 'Nu.'} ({invoice.currency?.currencyName || 'Ngultrum'})</Typography>
              </div>

              {/* Items Table */}
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Sl. No.</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell align="right"><strong>Quantity</strong></TableCell>
                      <TableCell align="right"><strong>Unit</strong></TableCell>
                      <TableCell align="right"><strong>Rate</strong></TableCell>
                      <TableCell align="right"><strong>Discount</strong></TableCell>
                      <TableCell align="right"><strong>Sale Amount</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items?.map((item, index) => (
                      <TableRow key={item.itemId}>
                        <TableCell>{item.slNo}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right">{item.unit?.name || '-'}</TableCell>
                        <TableCell align="right">{item.rate?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right">{item.discount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right">{item.saleAmount?.toFixed(2) || '0.00'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              <div className="mb-6">
                <div className="flex justify-end">
                  <div style={{ width: '400px' }}>
                    <div className="flex justify-between mb-2">
                      <Typography variant="body2"><strong>Total Amount:</strong></Typography>
                      <Typography variant="body2">{invoice.currency?.currencySymbol || 'Nu.'}{invoice.totalAmount?.toFixed(2) || '0.00'}</Typography>
                    </div>
                    <div className="flex justify-between mb-2">
                      <Typography variant="body2"><strong>Exempt Amount:</strong></Typography>
                      <Typography variant="body2">{invoice.currency?.currencySymbol || 'Nu.'}{invoice.exemptAmount?.toFixed(2) || '0.00'}</Typography>
                    </div>
                    <div className="flex justify-between mb-2">
                      <Typography variant="body2"><strong>Taxable Amount:</strong></Typography>
                      <Typography variant="body2">{invoice.currency?.currencySymbol || 'Nu.'}{invoice.taxableAmount?.toFixed(2) || '0.00'}</Typography>
                    </div>
                    <div className="flex justify-between mb-2">
                      <Typography variant="body2"><strong>GST @{invoice.gstRate || 0}%:</strong></Typography>
                      <Typography variant="body2">{invoice.currency?.currencySymbol || 'Nu.'}{invoice.gstAmount?.toFixed(2) || '0.00'}</Typography>
                    </div>
                    <div className="flex justify-between mb-2 border-t-2 pt-2">
                      <Typography variant="body1"><strong>Total Invoice Value (in {invoice.currency?.currencySymbol || 'Nu.'}):</strong></Typography>
                      <Typography variant="body1"><strong>{invoice.currency?.currencySymbol || 'Nu.'}{invoice.totalInvoiceValue?.toFixed(2) || '0.00'}</strong></Typography>
                    </div>
                    <div className="mt-2">
                      <Typography variant="body2"><strong>Amount in Words:</strong> {invoice.amountInWords || 'N/A'}</Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8">
                <Typography variant="body2" sx={{ mb: 2 }}><strong>Declaration:</strong> {invoice.declaration || 'We certify that the particulars are true.'}</Typography>
                {invoice.authorizedSignature && (
                  <div className="mb-4">
                    <Typography variant="body2"><strong>Authorized Signature:</strong></Typography>
                    <img src={invoice.authorizedSignature} alt="Signature" style={{ maxWidth: '200px', maxHeight: '100px' }} />
                  </div>
                )}
                {invoice.placeOfSupply && (
                  <Typography variant="body2" sx={{ mb: 2 }}><strong>Place of Supply:</strong> {invoice.placeOfSupply}</Typography>
                )}
                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 4 }}>
                  The Goods Sold on this Invoice are sold under the GST Second Hand Goods Scheme
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons Below Invoice */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Link href="/second-hand-goods-sales-invoice" passHref>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "red",
                color: "white",
                "&:hover": {
                  backgroundColor: "#cc0000",
                }
              }}
            >
              Close
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

