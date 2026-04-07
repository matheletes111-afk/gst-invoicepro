'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// MUI
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { FormControl, InputLabel, Select, MenuItem, Box, IconButton, Typography, Checkbox, FormControlLabel } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

import { toast } from "sonner"
import Link from 'next/link'

const Create = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    invoiceDate: "",
    isOriginal: true,
    salesOrderId: "",
    organizationId: "",
    partyId: "",
    customerName: "",
    customerTPN: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    currencyId: "",
    exemptAmount: 0,
    gstRate: 0,
    placeOfSupply: "",
    authorizedSignature: "",
    status: "A"
  })

  const [items, setItems] = useState([
    {
      description: "",
      quantity: "",
      unitId: "",
      rate: "",
      discount: 0,
      saleAmount: 0,
      gstStatus: "APPLICABLE"
    }
  ])

  const [organizations, setOrganizations] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true)
        const [orgsRes, salesRes, currenciesRes, unitsRes] = await Promise.all([
          fetch('/api/organization/list?limit=1000'),
          fetch('/api/second-hand-goods-sales/list?limit=1000'),
          fetch('/api/currency/list?limit=1000'),
          fetch('/api/unit/list?limit=1000')
        ])

        const [orgsData, salesData, currenciesData, unitsData] = await Promise.all([
          orgsRes.json(),
          salesRes.json(),
          currenciesRes.json(),
          unitsRes.json()
        ])

        if (orgsData.success) setOrganizations(orgsData.organizations || [])
        if (salesData.success) setSalesOrders(salesData.data || [])
        if (currenciesData.success) setCurrencies(currenciesData.rates || [])
        if (unitsData.success) setUnits(unitsData.units?.filter(u => u.status === 'A' && u.isDeleted === 0) || [])
      } catch (error) {
        console.error("Error loading dropdown data:", error)
        toast.error("Failed to load dropdown data")
      } finally {
        setLoadingData(false)
      }
    }
    loadDropdownData()
  }, [])

  // Calculate totals when items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      const discount = parseFloat(item.discount) || 0
      const saleAmount = ((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0)) - discount
      return sum + saleAmount
    }, 0)

    // Calculate exempt amount from items
    const exempt = items.reduce((sum, item) => {
      if (item.gstStatus === 'EXEMPT' || item.gstStatus === 'ZERO_RATED') {
        const discount = parseFloat(item.discount) || 0
        const saleAmount = ((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0)) - discount
        return sum + saleAmount
      }
      return sum
    }, 0)

    setFormData(prev => ({
      ...prev,
      exemptAmount: exempt
    }))
  }, [items])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }

    // Calculate sale amount for this item
    if (field === 'rate' || field === 'quantity' || field === 'discount') {
      const rate = parseFloat(field === 'rate' ? value : newItems[index].rate) || 0
      const quantity = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0
      const discount = parseFloat(field === 'discount' ? value : newItems[index].discount) || 0
      newItems[index].saleAmount = (rate * quantity) - discount
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: "",
        unitId: "",
        rate: "",
        discount: 0,
        saleAmount: 0,
        gstStatus: "APPLICABLE"
      }
    ])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    } else {
      toast.error("At least one item is required")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.invoiceDate) {
      toast.error("Invoice Date is required")
      return
    }

    if (!formData.organizationId) {
      toast.error("Organization (Supplier) is required")
      return
    }

    // Validate items
    const validItems = items.filter(item => item.description && item.rate && item.quantity)
    if (validItems.length === 0) {
      toast.error("At least one valid item is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/second-hand-goods-sales-invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salesOrderId: formData.salesOrderId || null,
          organizationId: formData.organizationId || null,
          partyId: formData.partyId || null,
          currencyId: formData.currencyId || null,
          customerName: formData.customerName || null,
          customerTPN: formData.customerTPN || null,
          customerAddress: formData.customerAddress || null,
          customerEmail: formData.customerEmail || null,
          customerPhone: formData.customerPhone || null,
          exemptAmount: formData.exemptAmount || 0,
          gstRate: formData.gstRate || 0,
          placeOfSupply: formData.placeOfSupply || null,
          authorizedSignature: formData.authorizedSignature || null,
          items: validItems.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitId: item.unitId || null,
            rate: parseFloat(item.rate),
            discount: parseFloat(item.discount) || 0,
            gstStatus: item.gstStatus || "APPLICABLE",
            status: "A"
          }))
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Invoice Created Successfully!")
        router.push("/second-hand-goods-sales-invoice")
      } else {
        toast.error(data.error || "Failed to create invoice")
      }
    } catch (err) {
      toast.error(err.message || "Error creating invoice")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create New Invoice" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Invoice Header */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Invoice Details</Typography>
            </Grid>

            {/* Invoice Date */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Invoice Date"
                name="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Is Original */}
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isOriginal}
                    onChange={handleChange}
                    name="isOriginal"
                  />
                }
                label="Original Invoice"
              />
            </Grid>

            {/* Sales Order (Optional) */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sales Order (Optional)</InputLabel>
                <Select
                  label="Sales Order (Optional)"
                  name="salesOrderId"
                  value={formData.salesOrderId}
                  onChange={handleChange}
                  disabled={loadingData}
                >
                  <MenuItem value="">None</MenuItem>
                  {salesOrders.map((so) => (
                    <MenuItem key={so.salesOrderId} value={so.salesOrderId}>
                      SO #{so.salesOrderId} - {so.customer || 'N/A'} ({so.date ? new Date(so.date).toLocaleDateString() : ''})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Organization (Supplier) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Organization (Supplier)</InputLabel>
                <Select
                  label="Organization (Supplier)"
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  disabled={loadingData}
                  required
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name || `Organization ${org.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Currency */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency (Optional)</InputLabel>
                <Select
                  label="Currency (Optional)"
                  name="currencyId"
                  value={formData.currencyId}
                  onChange={handleChange}
                  disabled={loadingData}
                >
                  <MenuItem value="">None</MenuItem>
                  {currencies.map((currency) => (
                    <MenuItem key={currency.currencyId} value={currency.currencyId}>
                      {currency.currencySymbol} - {currency.currencyName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Customer Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Customer Details</Typography>
            </Grid>

            {/* Customer Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name (Optional)"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
              />
            </Grid>

            {/* Customer TPN */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer TPN (Optional)"
                name="customerTPN"
                value={formData.customerTPN}
                onChange={handleChange}
                placeholder="Enter customer TPN"
              />
            </Grid>

            {/* Customer Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Address (Optional)"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                placeholder="Enter customer address"
                multiline
                rows={2}
              />
            </Grid>

            {/* Customer Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Email (Optional)"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="Enter customer email"
              />
            </Grid>

            {/* Customer Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Phone (Optional)"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="Enter customer phone"
              />
            </Grid>

            {/* Items Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6">Invoice Items</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  size="small"
                >
                  Add Item
                </Button>
              </Box>
            </Grid>

            {items.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2">Item {index + 1}</Typography>
                    {items.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removeItem(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    {/* Description */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </Grid>

                    {/* Unit */}
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Unit (Optional)</InputLabel>
                        <Select
                          label="Unit (Optional)"
                          value={item.unitId}
                          onChange={(e) => handleItemChange(index, 'unitId', e.target.value)}
                          disabled={loadingData}
                        >
                          <MenuItem value="">None</MenuItem>
                          {units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Quantity */}
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    {/* Rate */}
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Rate"
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    {/* Discount */}
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Discount"
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    {/* GST Status */}
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>GST Status</InputLabel>
                        <Select
                          label="GST Status"
                          value={item.gstStatus}
                          onChange={(e) => handleItemChange(index, 'gstStatus', e.target.value)}
                        >
                          <MenuItem value="APPLICABLE">Applicable</MenuItem>
                          <MenuItem value="EXEMPT">Exempt</MenuItem>
                          <MenuItem value="ZERO_RATED">Zero Rated</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Sale Amount (Read-only) */}
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Sale Amount"
                        value={item.saleAmount.toFixed(2)}
                        InputProps={{ readOnly: true }}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}

            {/* Summary Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Invoice Summary</Typography>
            </Grid>

            {/* Exempt Amount */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Exempt Amount"
                name="exemptAmount"
                type="number"
                value={formData.exemptAmount}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ readOnly: true }}
                disabled
                helperText="Calculated from exempt items"
              />
            </Grid>

            {/* GST Rate */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="GST Rate (%)"
                name="gstRate"
                type="number"
                value={formData.gstRate}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01, max: 100 }}
                placeholder="Enter GST rate"
              />
            </Grid>

            {/* Place of Supply */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Place of Supply (Optional)"
                name="placeOfSupply"
                value={formData.placeOfSupply}
                onChange={handleChange}
                placeholder="Enter place of supply"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="A">Active</MenuItem>
                  <MenuItem value="I">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">



                <Button variant="contained" type="submit" disabled={loading || loadingData}>
                  {loading ? "Creating..." : "Create Invoice"}
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
            </Grid>

          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default Create

