'use client'

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

import Card from "@mui/material/Card"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import { FormControl, InputLabel, Select, MenuItem, Box, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Link from 'next/link'

export default function EditPurchaseOrder({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [dealers, setDealers] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [units, setUnits] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    supplierId: "",
    dealerId: "",
    date: "",
    purchaseOrderNo: "",
    purchaseOrderDate: "",
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

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true)
        const [suppliersRes, dealersRes, currenciesRes, unitsRes] = await Promise.all([
          fetch('/api/supplier/list?limit=1000'),
          fetch('/api/dealer/list?limit=1000'),
          fetch('/api/currency/list?limit=1000'),
          fetch('/api/unit/list?limit=1000')
        ])

        const [suppliersData, dealersData, currenciesData, unitsData] = await Promise.all([
          suppliersRes.json(),
          dealersRes.json(),
          currenciesRes.json(),
          unitsRes.json()
        ])

        if (suppliersData.success) setSuppliers(suppliersData.data || [])
        if (dealersData.success) setDealers(dealersData.data || [])
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

  // Load single purchase order
  const loadPurchaseOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/second-hand-goods-purchase/${id}`)
      const data = await res.json()
      if (data.success && data.purchaseOrder) {
        const po = data.purchaseOrder
        setFormData({
          supplierId: po.supplierId?.toString() || "",
          dealerId: po.dealerId?.toString() || "",
          date: po.date ? new Date(po.date).toISOString().split('T')[0] : "",
          purchaseOrderNo: po.purchaseOrderNo || "",
          purchaseOrderDate: po.purchaseOrderDate ? new Date(po.purchaseOrderDate).toISOString().split('T')[0] : "",
          currencyId: po.currencyId?.toString() || "",
          totalPrice: po.totalPrice || 0,
          status: po.status || "A"
        })

        // Load items
        if (po.items && po.items.length > 0) {
          setItems(po.items.map(item => ({
            goodsName: item.goodsName || "",
            goodsDescription: item.goodsDescription || "",
            unitId: item.unitId?.toString() || "",
            unitPrice: item.unitPrice?.toString() || "",
            quantity: item.quantity?.toString() || "",
            amount: item.amount || 0
          })))
        } else {
          setItems([{
            goodsName: "",
            goodsDescription: "",
            unitId: "",
            unitPrice: "",
            quantity: "",
            amount: 0
          }])
        }
      } else {
        toast.error(data.error || "Purchase Order not found")
      }
    } catch (err) {
      toast.error("Failed to load purchase order")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadPurchaseOrder()
  }, [id])

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

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (!formData.date) {
      toast.error("Date is required")
      setSaving(false)
      return
    }

    // Validate items
    const validItems = items.filter(item => item.goodsName && item.unitPrice && item.quantity)
    if (validItems.length === 0) {
      toast.error("At least one valid item is required")
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/second-hand-goods-purchase/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData,
          supplierId: formData.supplierId || null,
          dealerId: formData.dealerId || null,
          currencyId: formData.currencyId || null,
          purchaseOrderDate: formData.purchaseOrderDate || null,
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
        toast.success("Purchase Order updated successfully")
        router.push("/second-hand-goods-purchase")
      } else {
        toast.error(data.error || "Failed to update purchase order")
      }
    } catch (err) {
      toast.error("Error updating purchase order")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Purchase Order" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Purchase Order...</Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={4}>

              {/* Purchase Order Header */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Purchase Order Details</Typography>
              </Grid>

              {/* Supplier */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Supplier (Optional)</InputLabel>
                  <Select
                    label="Supplier (Optional)"
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    disabled={loadingData}
                  >
                    <MenuItem value="">None</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.supplierId} value={supplier.supplierId.toString()}>
                        {supplier.supplierName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Dealer */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Dealer (Optional)</InputLabel>
                  <Select
                    label="Dealer (Optional)"
                    name="dealerId"
                    value={formData.dealerId}
                    onChange={handleChange}
                    disabled={loadingData}
                  >
                    <MenuItem value="">None</MenuItem>
                    {dealers.map((dealer) => (
                      <MenuItem key={dealer.dealerId} value={dealer.dealerId.toString()}>
                        {dealer.dealerName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Date (Date of Goods Receipt)"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Purchase Order No */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Purchase Order No (Optional)"
                  name="purchaseOrderNo"
                  value={formData.purchaseOrderNo}
                  onChange={handleChange}
                />
              </Grid>

              {/* Purchase Order Date */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Purchase Order Date (Optional)"
                  name="purchaseOrderDate"
                  type="date"
                  value={formData.purchaseOrderDate}
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
                      <MenuItem key={currency.currencyId} value={currency.currencyId.toString()}>
                        {currency.currencySymbol} - {currency.currencyName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Total Price */}
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

                      {/* Unit */}
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
                              <MenuItem key={unit.id} value={unit.id.toString()}>
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
                          inputProps={{ min: 0, step: 1 }}
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
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>

                      {/* Amount */}
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
                  <Button variant="contained" type="submit" disabled={saving || loadingData}>
                    {saving ?
                      "Updating..." : "Update Purchase Order"}
                  </Button>

                  <Link href="/second-hand-goods-purchase" passHref>
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
        )}
      </CardContent>
    </Card>
  )
}

