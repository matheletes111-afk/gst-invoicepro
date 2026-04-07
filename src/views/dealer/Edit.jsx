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


export default function EditDealer({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dzongkhags, setDzongkhags] = useState([])
  const [gewogs, setGewogs] = useState([])
  const [villages, setVillages] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [formData, setFormData] = useState({
    businessLicenseNo: "",
    dealerName: "",
    taxpayerRegStatus: "NO",
    taxpayerRegNo: "",
    taxpayerRegRegion: "",
    dzongkhagId: "",
    gewogId: "",
    villageId: "",
    location: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    status: "A"
  })

  // Taxpayer Registration Regions
  const taxpayerRegions = [
    "RRCO Thimphu",
    "RRCO Paro",
    "RRCO Phuntsholing",
    "RRCO Samtse",
    "RRCO Gelephu",
    "RRCO Samdrupjongkhar",
    "RRCO Mongar",
    "RRCO Bumthang"
  ]

  // Load dzongkhags on mount
  useEffect(() => {
    async function loadDzongkhags() {
      try {
        const res = await fetch('/api/location/dzongkhags')
        const data = await res.json()
        if (data.success) {
          setDzongkhags(data.dzongkhags || [])
        }
      } catch (error) {
        console.error("Error loading dzongkhags:", error)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadDzongkhags()
  }, [])

  // Load gewogs when dzongkhag is selected
  useEffect(() => {
    async function loadGewogs() {
      if (!formData.dzongkhagId) {
        setGewogs([])
        setVillages([])
        return
      }
      try {
        const res = await fetch(`/api/location/gewogs/${formData.dzongkhagId}`)
        const data = await res.json()
        if (data.success) {
          setGewogs(data.gewogs || [])
        }
      } catch (error) {
        console.error("Error loading gewogs:", error)
      }
    }
    loadGewogs()
  }, [formData.dzongkhagId])

  // Load villages when gewog is selected
  useEffect(() => {
    async function loadVillages() {
      if (!formData.gewogId) {
        setVillages([])
        return
      }
      try {
        const res = await fetch(`/api/location/villages/${formData.gewogId}`)
        const data = await res.json()
        if (data.success) {
          setVillages(data.villages || [])
        }
      } catch (error) {
        console.error("Error loading villages:", error)
      }
    }
    loadVillages()
  }, [formData.gewogId])

  // Load single dealer
  const loadDealer = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dealer/${id}`)
      const data = await res.json()
      if (data.success && data.dealer) {
        const d = data.dealer
        setFormData({
          businessLicenseNo: d.businessLicenseNo || "",
          dealerName: d.dealerName || "",
          taxpayerRegStatus: d.taxpayerRegStatus || "NO",
          taxpayerRegNo: d.taxpayerRegNo || "",
          taxpayerRegRegion: d.taxpayerRegRegion || "",
          dzongkhagId: d.dzongkhagId?.toString() || "",
          gewogId: d.gewogId?.toString() || "",
          villageId: d.villageId?.toString() || "",
          location: d.location || "",
          contactName: d.contactName || "",
          contactEmail: d.contactEmail || "",
          contactPhone: d.contactPhone || "",
          status: d.status || "A"
        })
      } else {
        toast.error(data.error || "Dealer not found")
      }
    } catch (err) {
      toast.error("Failed to load dealer")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadDealer()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
      // Reset dependent fields when location changes
      ...(name === 'dzongkhagId' && { gewogId: "", villageId: "" }),
      ...(name === 'gewogId' && { villageId: "" }),
      // Clear taxpayer reg no if status changes to NO
      ...(name === 'taxpayerRegStatus' && value === "NO" && { taxpayerRegNo: "" })
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    // If taxpayer registration status is YES, taxpayerRegNo is mandatory
    if (formData.taxpayerRegStatus === "YES" && !formData.taxpayerRegNo) {
      toast.error("Taxpayer Registration Number is required when registration status is Yes")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/dealer/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData,
          dzongkhagId: formData.dzongkhagId || null,
          gewogId: formData.gewogId || null,
          villageId: formData.villageId || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Dealer updated successfully")
        router.push("/dealer")
      } else {
        toast.error(data.error || "Failed to update dealer")
      }
    } catch (err) {
      toast.error("Error updating dealer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Dealer" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Dealer...</Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={4}>

              {/* Dealer Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dealer Name"
                  name="dealerName"
                  value={formData.dealerName}
                  onChange={handleChange}
                  required
                />
              </Grid>

              {/* Business License No */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business License No (Optional)"
                  name="businessLicenseNo"
                  value={formData.businessLicenseNo}
                  onChange={handleChange}
                />
              </Grid>

              {/* Taxpayer Registration Status */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Taxpayer Registration Status</InputLabel>
                  <Select
                    name="taxpayerRegStatus"
                    value={formData.taxpayerRegStatus}
                    onChange={handleChange}
                  >
                    <MenuItem value="YES">Yes</MenuItem>
                    <MenuItem value="NO">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>


              {formData.taxpayerRegStatus === "YES" && (
                <>

                  {/* Taxpayer Registration No */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={`Taxpayer Registration No ${formData.taxpayerRegStatus === "YES" ? "(Required)" : "(Optional)"}`}
                      name="taxpayerRegNo"
                      value={formData.taxpayerRegNo}
                      onChange={handleChange}
                      required={formData.taxpayerRegStatus === "YES"}
                      disabled={formData.taxpayerRegStatus === "NO"}
                    />
                  </Grid>

                  {/* Taxpayer Registration Region */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Taxpayer Registration Region (Optional)</InputLabel>
                      <Select
                        name="taxpayerRegRegion"
                        value={formData.taxpayerRegRegion}
                        onChange={handleChange}
                      >
                        <MenuItem value="">None</MenuItem>
                        {taxpayerRegions.map((region) => (
                          <MenuItem key={region} value={region}>
                            {region}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                </>
              )}

              {/* Status */}
              <Grid item xs={12} md={6}>
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

              {/* Address Section */}
              <Grid item xs={12}>
                <div className="text-lg font-semibold mb-4">Address</div>
              </Grid>

              {/* Dzongkhag */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Dzongkhag (Optional)</InputLabel>
                  <Select
                    name="dzongkhagId"
                    value={formData.dzongkhagId}
                    onChange={handleChange}
                    disabled={loadingLocations}
                  >
                    <MenuItem value="">None</MenuItem>
                    {dzongkhags.map((dz) => (
                      <MenuItem key={dz.dzongkhagId} value={dz.dzongkhagId.toString()}>
                        {dz.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Gewog */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Gewog / Thromde (Optional)</InputLabel>
                  <Select
                    name="gewogId"
                    value={formData.gewogId}
                    onChange={handleChange}
                    disabled={loadingLocations || !formData.dzongkhagId}
                  >
                    <MenuItem value="">None</MenuItem>
                    {gewogs.map((gw) => (
                      <MenuItem key={gw.gewogId} value={gw.gewogId.toString()}>
                        {gw.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Village */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Village (Optional)</InputLabel>
                  <Select
                    name="villageId"
                    value={formData.villageId}
                    onChange={handleChange}
                    disabled={loadingLocations || !formData.gewogId}
                  >
                    <MenuItem value="">None</MenuItem>
                    {villages.map((vl) => (
                      <MenuItem key={vl.villageId} value={vl.villageId.toString()}>
                        {vl.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location (Optional)"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Contact Section */}
              <Grid item xs={12}>
                <div className="text-lg font-semibold mb-4">Contact Information</div>
              </Grid>

              {/* Contact Name */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Name (Optional)"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                />
              </Grid>

              {/* Contact Email */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Email (Optional)"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              </Grid>

              {/* Contact Phone */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Phone (Optional)"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </Grid>

              {/* Buttons */}
              <Grid item xs={12}>
                <div className="flex items-center justify-between flex-wrap gap-5">
                  <Button variant="contained" type="submit" disabled={loading || loadingLocations}>
                    {loading ? "Updating..." : "Update Dealer"}
                  </Button>

                  <Link href="/dealer" passHref>
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

