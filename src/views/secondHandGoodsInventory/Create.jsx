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
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { toast } from "sonner"
import Link from 'next/link'

const Create = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    goodsName: "",
    goodsDescription: "",
    unitId: "",
    unitPrice: "",
    quantity: "",
    inventoryValue: 0,
    status: "A"
  })

  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(true)

  useEffect(() => {
    // Load units for dropdown
    async function loadUnits() {
      try {
        const res = await fetch('/api/unit/list?limit=1000')
        const data = await res.json()
        if (data.success) {
          setUnits(data.units?.filter(u => u.status === 'A' && u.isDeleted === 0) || [])
        }
      } catch (error) {
        console.error("Error loading units:", error)
      } finally {
        setLoadingUnits(false)
      }
    }
    loadUnits()
  }, [])

  // Calculate inventory value when unitPrice or quantity changes
  useEffect(() => {
    const unitPrice = parseFloat(formData.unitPrice) || 0
    const quantity = parseFloat(formData.quantity) || 0
    setFormData(prev => ({ ...prev, inventoryValue: unitPrice * quantity }))
  }, [formData.unitPrice, formData.quantity])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.goodsName) {
      toast.error("Goods Name is required")
      return
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      toast.error("Valid Unit Price is required")
      return
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error("Valid Quantity is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/second-hand-goods-inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          unitId: formData.unitId || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Inventory Item Created Successfully!")

        setFormData({
          goodsName: "",
          goodsDescription: "",
          unitId: "",
          unitPrice: "",
          quantity: "",
          inventoryValue: 0,
          status: "A"
        })

        router.push("/second-hand-goods-inventory")
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create New Inventory Item" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Goods Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Goods Name"
                name="goodsName"
                value={formData.goodsName}
                onChange={handleChange}
                placeholder="Enter goods name"
                required
              />
            </Grid>

            {/* Goods Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Goods Description (Optional)"
                name="goodsDescription"
                value={formData.goodsDescription}
                onChange={handleChange}
                placeholder="Describe the goods..."
                multiline
                rows={4}
              />
            </Grid>

            {/* Unit of Measurement */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unit of Measurement (Optional)</InputLabel>
                <Select
                  label="Unit of Measurement (Optional)"
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  disabled={loadingUnits}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Price"
                name="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="0.00"
                inputProps={{ step: "0.01", min: "0" }}
                required
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0.00"
                inputProps={{ step: "0.01", min: "0" }}
                required
              />
            </Grid>

            {/* Inventory Value (Read-only, calculated) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Inventory Value"
                name="inventoryValue"
                value={formData.inventoryValue.toFixed(2)}
                InputProps={{ readOnly: true }}
                disabled
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
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

                <Button variant="contained" type="submit" disabled={loading || loadingUnits}>
                  {loading ? "Saving..." : "Create Inventory Item"}
                </Button>

                <Link href="/second-hand-goods-inventory" passHref>
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

