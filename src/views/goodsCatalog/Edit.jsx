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

export default function EditGoodsCatalog({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [formData, setFormData] = useState({
    goodsName: "",
    goodsCode: "",
    goodsDescription: "",
    goodsPrice: "",
    unitId: "",
    status: "A"
  })

  // Load units for dropdown
  useEffect(() => {
    async function loadUnits() {
      try {
        const res = await fetch('/api/unit/list?limit=1000')
        const data = await res.json()
        if (data.success) {
          setUnits(data.units || [])
        }
      } catch (error) {
        console.error("Error loading units:", error)
      } finally {
        setLoadingUnits(false)
      }
    }
    loadUnits()
  }, [])

  // Load single goods
  const loadGoods = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/goods-catalog/${id}`)
      const data = await res.json()
      if (data.success && data.goods) {
        const g = data.goods
        setFormData({
          goodsName: g.goodsName || "",
          goodsCode: g.goodsCode || "",
          goodsDescription: g.goodsDescription || "",
          goodsPrice: g.goodsPrice?.toString() || "",
          unitId: g.unitId?.toString() || "",
          status: g.status || "A"
        })
      } else {
        toast.error(data.error || "Goods not found")
      }
    } catch (err) {
      toast.error("Failed to load goods")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadGoods()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/goods-catalog/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Goods updated successfully")
        router.push("/goods-catalog")
      } else {
        toast.error(data.error || "Failed to update goods")
      }
    } catch (err) {
      toast.error("Error updating goods")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Goods" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Goods...</Typography>
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
                />
              </Grid>

              {/* Goods Code / HS Code */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goods Code / HS Code"
                  name="goodsCode"
                  value={formData.goodsCode}
                  onChange={handleChange}
                />
              </Grid>

              {/* Goods Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goods Description"
                  name="goodsDescription"
                  value={formData.goodsDescription}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>

              {/* Goods Price */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Goods Price"
                  name="goodsPrice"
                  type="number"
                  value={formData.goodsPrice}
                  onChange={handleChange}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>

              {/* Unit */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    disabled={loadingUnits}
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  {loading ? "Updating..." : "Update Goods"}
                </Button>

                  <Link href="/goods-catalog" passHref>
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

