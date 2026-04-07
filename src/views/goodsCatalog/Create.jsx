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
    goodsCode: "",
    goodsDescription: "",
    goodsPrice: "",
    unitId: "",
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.goodsName) {
      toast.error("Goods Name is required")
      return
    }

    if (!formData.goodsCode) {
      toast.error("Goods Code (HS Code) is required")
      return
    }

    if (!formData.goodsPrice || parseFloat(formData.goodsPrice) <= 0) {
      toast.error("Valid Goods Price is required")
      return
    }

    if (!formData.unitId) {
      toast.error("Unit is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/goods-catalog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Goods Created Successfully!")

        setFormData({
          goodsName: "",
          goodsCode: "",
          goodsDescription: "",
          goodsPrice: "",
          unitId: "",
          status: "A"
        })

        router.push("/goods-catalog")
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
      <CardHeader title="Create New Goods" />
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
                placeholder="Example: Laptop Computer"
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
                placeholder="Example: 8471.30"
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
                placeholder="Describe the goods..."
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
                placeholder="0.00"
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>

            {/* Unit */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  label="Unit"
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  disabled={loadingUnits}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
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
                  {loading ? "Saving..." : "Create Goods"}
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
      </CardContent>
    </Card>
  )
}

export default Create

