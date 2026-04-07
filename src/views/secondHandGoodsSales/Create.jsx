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
import { FormControl, InputLabel, Select, MenuItem, Box, IconButton, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

import { toast } from "sonner"
import Link from 'next/link'

const Create = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    customer: "",
    customerTPN: "",
    date: "",
    invoiceNo: "",
    invoiceDate: "",
    currencyId: "",
    totalPrice: 0,
    status: "A"
  })

  const [items, setItems] = useState([
    {
      goodsName: "",
      goodsDescription: "",
      unitId: "",
      unitPrice: "",
      quantity: "",
      amount: 0
    }
  ])

  const [currencies, setCurrencies] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true)
        const [currenciesRes, unitsRes] = await Promise.all([
          fetch('/api/currency/list?limit=1000'),
          fetch('/api/unit/list?limit=1000')
        ])

        const [currenciesData, unitsData] = await Promise.all([
          currenciesRes.json(),
          unitsRes.json()
        ])

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

  // Calculate total price when items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      const amount = (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0)
      return sum + amount
    }, 0)
    setFormData(prev => ({ ...prev, totalPrice: total }))
  }, [items])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }

    // Calculate amount for this item
    if (field === 'unitPrice' || field === 'quantity') {
      const unitPrice = parseFloat(field === 'unitPrice' ? value : newItems[index].unitPrice) || 0
      const quantity = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0
      newItems[index].amount = unitPrice * quantity
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        goodsName: "",
        goodsDescription: "",
        unitId: "",
        unitPrice: "",
        quantity: "",
        amount: 0
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

    if (!formData.date) {
      toast.error("Date is required")
      return
    }

    // Validate items
    const validItems = items.filter(item => item.goodsName && item.unitPrice && item.quantity)
    if (validItems.length === 0) {
      toast.error("At least one valid item is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/second-hand-goods-sales/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customer: formData.customer || null,
          customerTPN: formData.customerTPN || null,
          currencyId: formData.currencyId || null,
          invoiceDate: formData.invoiceDate || null,
          items: validItems.map(item => ({
            goodsName: item.goodsName,
            goodsDescription: item.goodsDescription || null,
            unitId: item.unitId || null,
            unitPrice: parseFloat(item.unitPrice),
            quantity: parseFloat(item.quantity),
            status: "A"
          }))
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Sales Order Created Successfully!")
        router.push("/second-hand-goods-sales")
      } else {
        toast.error(data.error || "Failed to create sales order")
      }
    } catch (err) {
      toast.error(err.message || "Error creating sales order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create New Sales Order" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Sales Order Header */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Sales Order Details</Typography>
            </Grid>

            {/* Customer Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name (Optional)"
                name="customer"
                value={formData.customer}
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

            {/* Date (Date of goods issue) */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date (Date of Goods Issue)"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Invoice No */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Invoice No (Optional)"
                name="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleChange}
                placeholder="Enter invoice number"
              />
            </Grid>

            {/* Invoice Date */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Invoice Date (Optional)"
                name="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
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

            {/* Total Price (Read-only, calculated) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Price"
                name="totalPrice"
                value={formData.totalPrice.toFixed(2)}
                InputProps={{ readOnly: true }}
                disabled
              />
            </Grid>

            {/* Items Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6">Items</Typography>
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
                    {/* Goods Name */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Goods Name"
                        value={item.goodsName}
                        onChange={(e) => handleItemChange(index, 'goodsName', e.target.value)}
                        required
                      />
                    </Grid>

                    {/* Unit of Measurement */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Unit of Measurement (Optional)</InputLabel>
                        <Select
                          label="Unit of Measurement (Optional)"
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

                    {/* Unit Price */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    {/* Quantity */}
                    <Grid item xs={12} md={4}>
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

                    {/* Amount (Read-only, calculated) */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Amount"
                        value={item.amount.toFixed(2)}
                        InputProps={{ readOnly: true }}
                        disabled
                      />
                    </Grid>

                    {/* Goods Description */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Goods Description (Optional)"
                        value={item.goodsDescription}
                        onChange={(e) => handleItemChange(index, 'goodsDescription', e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}

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
                  {loading ? "Saving..." : "Create Sales Order"}
                </Button>


                <Link href="/second-hand-goods-sales" passHref>
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

