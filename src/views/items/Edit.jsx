"use client"

// React Imports
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation';

// MUI Imports
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import CircularProgress from "@mui/material/CircularProgress"
import { toast } from "sonner"
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from "next/link"


export default function Edit({ id }) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [message, setMessage] = useState("")
  const [units, setUnits] = useState([])

  const [formData, setFormData] = useState({
    itemType: "",
    name: "",
    code: "",
    desc: "",
    price: "",
    unit: "",
    status: "A"
  })

  // Fetch units on component mount
  useEffect(() => {
    fetchUnits()
  }, [])

  // Fetch units from API
  const fetchUnits = async () => {
    try {
      setLoadingUnits(true)
      const res = await fetch("/api/unit/list")
      const data = await res.json()

      if (data.success) {
        // Filter only Active (status 'A') units
        const activeUnits = data.units.filter(unit => unit.status === 'A')
        setUnits(activeUnits)
      } else {
        toast.error("Failed to load units")
      }
    } catch (error) {
      console.error("Error fetching units:", error)
      toast.error("Error fetching units")
    } finally {
      setLoadingUnits(false)
    }
  }

  const loadItem = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/items/${id}`)
      const data = await res.json()

      if (data.item) {
        setFormData({
          itemType: data.item.itemType || "",
          name: data.item.name || "",
          code: data.item.code || "",
          desc: data.item.desc || "",
          price: data.item.price || "",
          unit: data.item.unit || "",
          status: data.item.status || "A"
        })
      } else {
        // If no item returned, you might show a message or navigate back
        setMessage("Item not found.")
      }
    } catch (err) {
      toast.error("Failed to load item")
      setMessage("Failed to load item.")
    } finally {
      setLoading(false)
    }
  }

  // Load item details for prefill when `id` changes
  useEffect(() => {
    if (id) loadItem()
  }, [id])

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Submit update request
  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Item updated successfully!")
        router.push("/items")
      } else {
        toast.error(data.error || "Failed to update")
      }
    } catch (err) {
      toast.error("Error updating item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Item" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography variant="body2" style={{ marginTop: 12 }}>
              Loading item...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item Type"
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item Code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="desc"
                  value={formData.desc}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={loadingUnits}>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    label="Unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select a unit</MenuItem>
                    {units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingUnits && <CircularProgress size={24} sx={{ mt: 1 }} />}
                </FormControl>
              </Grid>

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


              {message && (
                <Grid item xs={12}>
                  <Typography color="red">{message}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
               <div className="flex items-center justify-between flex-wrap gap-5">

                  <Button variant="contained" type="submit" disabled={loading || loadingUnits}>
                    {loading ? "Updating..." : "Update Item"}
                  </Button>

                  <Link href="/items" passHref>
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
                </div>
              </Grid>

            </Grid>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
