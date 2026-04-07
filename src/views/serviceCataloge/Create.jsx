'use client'

import { useState } from 'react'
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
import Link from "next/link"

const Create = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    service_name: "",
    service_code: "",
    service_description: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.service_name) {
      toast.error("Service Name is required")
      return
    }

    if (!formData.service_code) {
      toast.error("Service Code is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/service-catalog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Service Created Successfully!")

        setFormData({
          service_name: "",
          service_code: "",
          service_description: "",
          status: "A"
        })

        router.push("/service-cataloge")
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
      <CardHeader title="Create New Service" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Service Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Name"
                name="service_name"
                value={formData.service_name}
                onChange={handleChange}
                placeholder="Example: Website Development"
              />
            </Grid>

            {/* Service Code */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Code"
                name="service_code"
                value={formData.service_code}
                onChange={handleChange}
                placeholder="Example: SERV-001"
              />
            </Grid>

            {/* Service Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Description"
                name="service_description"
                value={formData.service_description}
                onChange={handleChange}
                placeholder="Describe the service..."
                multiline
                rows={4}
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


                <Button variant="contained" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Create Service"}
                </Button>



                <Link href="/service-cataloge" passHref>
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
