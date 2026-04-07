'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner"
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from "next/link";

const Edit = ({ id }) => {
  const router = useRouter()
  const unitId = id

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errors, setErrors] = useState({})

  // Fetch unit data on component mount
  useEffect(() => {
    if (unitId) {
      fetchUnitData()
    }
  }, [unitId])

  // Fetch unit data from API
  const fetchUnitData = async () => {
    try {
      setFetching(true)
      const res = await fetch(`/api/unit/${unitId}`)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.success && data.unit) {
        const unit = data.unit
        setFormData({
          name: unit.name || "",
          description: unit.description || "",
          status: unit.status || "A"
        })
      } else {
        toast.error(data.error || "Failed to fetch unit details")
        router.push('/unit')
      }
    } catch (err) {
      console.error("Error fetching unit:", err)
      toast.error("Error fetching unit data")
      router.push('/unit')
    } finally {
      setFetching(false)
    }
  }

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Unit name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const payload = {
        unitId: parseInt(unitId),
        ...formData
      }

      const res = await fetch("/api/unit/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Unit updated successfully!")
        router.push('/unit')
      } else {
        toast.error(data.error || "Failed to update unit")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Card>
        <CardContent>
          <Typography align="center" sx={{ py: 4 }}>
            Loading unit details...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Edit Unit" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            {/* Unit Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Unit Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Kilogram, Meter, Liter"
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
              />
            </Grid>

            {/* Unit Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the unit (optional)"
                multiline
                rows={3}
                disabled={loading}
              />
            </Grid>

            {/* Status Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="A">Active</MenuItem>
                  <MenuItem value="I">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>


                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  size="large"
                >
                  {loading ? "Updating..." : "Update Unit"}
                </Button>

                  <Link href="/unit" passHref>
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
                    Cancel
                  </Button>
                </Link>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default Edit