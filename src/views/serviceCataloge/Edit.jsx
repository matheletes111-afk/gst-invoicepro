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
import Link from "next/link"

export default function EditServiceCatalog({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    service_name: "",
    service_code: "",
    service_description: "",
    status: "A"
  })

  // Load single service
  const loadService = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/service-catalog/${id}`)
      const data = await res.json()
      if (data.success && data.slab) {
        const s = data.slab
        setFormData({
          service_name: s.service_name || "",
          service_code: s.service_code || "",
          service_description: s.service_description || "",
          status: s.status || "A"
        })
      } else {
        toast.error(data.error || "Service not found")
      }
    } catch (err) {
      toast.error("Failed to load service")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadService()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/service-catalog/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Service updated successfully")
        router.push("/service-cataloge")
      } else {
        toast.error(data.error || "Failed to update service")
      }
    } catch (err) {
      toast.error("Error updating service")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Service" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Service...</Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={4}>

              {/* Service Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Service Name"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleChange}
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
                  multiline
                  rows={4}
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

                  <Button variant="contained" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Service"}
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
        )}
      </CardContent>
    </Card>
  )
}
