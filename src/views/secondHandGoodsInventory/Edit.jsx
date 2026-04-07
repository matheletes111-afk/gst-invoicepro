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
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from 'next/link'

export default function EditInventory({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [formData, setFormData] = useState({
    goodsName: "",
    goodsDescription: "",
    unitId: "",
    unitPrice: "",
    quantity: "",
    inventoryValue: 0,
    status: "A"
  })

  // Load units for dropdown
  useEffect(() => {
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

  // Load single inventory item
  const loadInventory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/second-hand-goods-inventory/${id}`)
      const data = await res.json()
      if (data.success && data.inventory) {
        const inv = data.inventory
        setFormData({
          goodsName: inv.goodsName || "",
          goodsDescription: inv.goodsDescription || "",
          unitId: inv.unitId?.toString() || "",
          unitPrice: inv.unitPrice?.toString() || "",
          quantity: inv.quantity?.toString() || "",
          inventoryValue: inv.inventoryValue || 0,
          status: inv.status || "A"
        })
      } else {
        toast.error(data.error || "Inventory item not found")
      }
    } catch (err) {
      toast.error("Failed to load inventory item")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadInventory()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/second-hand-goods-inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData,
          unitId: formData.unitId || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Inventory item updated successfully")
        router.push("/second-hand-goods-inventory")
      } else {
        toast.error(data.error || "Failed to update inventory item")
      }
    } catch (err) {
      toast.error("Error updating inventory item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Inventory Item" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Inventory Item...</Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={4}>

              {/* Goods Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goods Name"
                  name="goodsName"
                  value={formData.goodsName}
                  onChange={handleChange}
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
                  multiline
                  rows={4}
                />
              </Grid>

              {/* Unit of Measurement */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit of Measurement (Optional)</InputLabel>
                  <Select
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    disabled={loadingUnits}
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  name="unitPrice"
                  type="number"
                  value={formData.unitPrice}
                  onChange={handleChange}
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
                    {loading ? "Updating..." : "Update Inventory Item"}
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
        )}
      </CardContent>
    </Card>
  )
}

