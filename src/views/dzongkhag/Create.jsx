"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

import Link from "next/link"
import { toast } from "sonner"

const CreateDzongkhag = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error("Dzongkhag Name is required.")
      setMessage("Dzongkhag Name is required.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/dzongkhag/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Dzongkhag created successfully.")
        router.push("/dzongkhag")
      } else {
        toast.error(data.error || "Failed to create Dzongkhag")
        setMessage(data.error || "Failed to create Dzongkhag")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
      setMessage("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create Dzongkhag" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dzongkhag Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Thimphu"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dzongkhag Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
               
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
                  {loading ? "Saving..." : "Create Dzongkhag"}
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
      </CardContent>
    </Card>
  )
}

export default CreateDzongkhag
