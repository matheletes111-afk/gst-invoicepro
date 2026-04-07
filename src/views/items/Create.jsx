'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner";
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material'
import Link from "next/link";


const Create = () => {
  const router = useRouter();
  // Form State
  const [formData, setFormData] = useState({
    itemType: "",
    name: "",
    code: "",
    desc: "",
    price: "",
    unit: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [message, setMessage] = useState("")
  const [units, setUnits] = useState([])

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

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/items/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage("Item created successfully!")

        // Clear form
        setFormData({
          itemType: "",
          name: "",
          code: "",
          desc: "",
          price: "",
          unit: "",
          status: "A"
        })
        toast.success("Successfully saved!")
        router.push('/items');
      } else {
        setMessage(data.error || "Failed to create item")
        toast.error(data.error || "Failed to create item")
      }
    } catch (err) {
      setMessage("Error: " + err.message)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader title="Create New Item" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Type"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                placeholder="Electronics, Grocery, etc."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Laptop, T-shirt, etc."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="ITM12345"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                placeholder="Short description..."
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
                placeholder="100.00"
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


            {/* Status Message */}
            {message && (
              <Grid item xs={12}>
                <Typography color={message.includes("success") ? "green" : "red"}>
                  {message}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">
                
                  <Button variant="contained" type="submit" disabled={loading || loadingUnits}>
                    {loading ? "Saving..." : "Create Item"}
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
      </CardContent>
    </Card>
  )
}

export default Create
