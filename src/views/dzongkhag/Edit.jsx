"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import CircularProgress from "@mui/material/CircularProgress"
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

import Link from "next/link"
import { toast } from "sonner"

export default function EditDzongkhag({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "A"
  })

  // Load Dzongkhag data
  const loadDzongkhag = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dzongkhag/${id}`)
      const data = await res.json()

      if (data.success && data.dzongkhag) {
        setFormData({
          name: data.dzongkhag.name || "",
          code: data.dzongkhag.code || "",
          status: data.dzongkhag.status || "A"
        })
      } else {
        setMessage(data.error || "Dzongkhag not found")
      }
    } catch (err) {
      toast.error("Failed to load Dzongkhag")
      setMessage("Failed to load Dzongkhag.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadDzongkhag()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/dzongkhag/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dzongkhagId: id, ...formData })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Dzongkhag updated successfully!")
        router.push("/dzongkhag")
      } else {
        toast.error(data.error || "Failed to update Dzongkhag")
        setMessage(data.error || "Failed to update Dzongkhag")
      }
    } catch (err) {
      toast.error("Error updating Dzongkhag")
      setMessage("Error updating Dzongkhag")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Dzongkhag" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading Dzongkhag...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dzongkhag Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Dzongkhag Name"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dzongkhag Code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Enter Dzongkhag Code"
                  required
                />
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
                  <Typography color="red">{message}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <div className="flex items-center justify-between flex-wrap gap-5">

                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Dzongkhag"}
                  </Button>

                  <Link href="/dzongkhag" passHref>
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
