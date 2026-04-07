'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

const Create = () => {
  const router = useRouter()

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

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
      const res = await fetch("/api/unit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Unit created successfully!")

        // Clear form
        setFormData({
          name: "",
          description: "",
          status: "A"
        })

        router.push('/unit')
      } else {
        toast.error(data.error || "Failed to create unit")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create New Unit" />
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
                  {loading ? "Creating..." : "Create Unit"}
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
    </Card >
  )
}

export default Create