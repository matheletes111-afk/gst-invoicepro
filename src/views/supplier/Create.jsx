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
    businessLicenseNo: "",
    supplierName: "",
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

  const [dzongkhags, setDzongkhags] = useState([])
  const [gewogs, setGewogs] = useState([])
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(true)

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.supplierName) {
      toast.error("Supplier Name is required")
      return
    }

    // If taxpayer registration status is YES, taxpayerRegNo is mandatory
    if (formData.taxpayerRegStatus === "YES" && !formData.taxpayerRegNo) {
      toast.error("Taxpayer Registration Number is required when registration status is Yes")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/supplier/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dzongkhagId: formData.dzongkhagId || null,
          gewogId: formData.gewogId || null,
          villageId: formData.villageId || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Supplier Created Successfully!")

        setFormData({
          businessLicenseNo: "",
          supplierName: "",
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

        router.push("/supplier")
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
      <CardHeader title="Create New Supplier" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Supplier Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                placeholder="Enter supplier name"
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
                placeholder="Enter business license number"
              />
            </Grid>

            {/* Taxpayer Registration Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Taxpayer Registration Status</InputLabel>
                <Select
                  label="Taxpayer Registration Status"
                  name="taxpayerRegStatus"
                  value={formData.taxpayerRegStatus}
                  onChange={handleChange}
                >
                  <MenuItem value="YES">Yes</MenuItem>
                  <MenuItem value="NO">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Taxpayer Registration No */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`Taxpayer Registration No ${formData.taxpayerRegStatus === "YES" ? "(Required)" : "(Optional)"}`}
                name="taxpayerRegNo"
                value={formData.taxpayerRegNo}
                onChange={handleChange}
                placeholder="Enter taxpayer registration number"
                required={formData.taxpayerRegStatus === "YES"}
                disabled={formData.taxpayerRegStatus === "NO"}
              />
            </Grid>

            {/* Taxpayer Registration Region */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Taxpayer Registration Region (Optional)</InputLabel>
                <Select
                  label="Taxpayer Registration Region (Optional)"
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

            {/* Status */}
            <Grid item xs={12} md={6}>
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

            {/* Address Section */}
            <Grid item xs={12}>
              <div className="text-lg font-semibold mb-4">Address</div>
            </Grid>

            {/* Dzongkhag */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Dzongkhag (Optional)</InputLabel>
                <Select
                  label="Dzongkhag (Optional)"
                  name="dzongkhagId"
                  value={formData.dzongkhagId}
                  onChange={handleChange}
                  disabled={loadingLocations}
                >
                  <MenuItem value="">None</MenuItem>
                  {dzongkhags.map((dz) => (
                    <MenuItem key={dz.dzongkhagId} value={dz.dzongkhagId}>
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
                  label="Gewog / Thromde (Optional)"
                  name="gewogId"
                  value={formData.gewogId}
                  onChange={handleChange}
                  disabled={loadingLocations || !formData.dzongkhagId}
                >
                  <MenuItem value="">None</MenuItem>
                  {gewogs.map((gw) => (
                    <MenuItem key={gw.gewogId} value={gw.gewogId}>
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
                  label="Village (Optional)"
                  name="villageId"
                  value={formData.villageId}
                  onChange={handleChange}
                  disabled={loadingLocations || !formData.gewogId}
                >
                  <MenuItem value="">None</MenuItem>
                  {villages.map((vl) => (
                    <MenuItem key={vl.villageId} value={vl.villageId}>
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
                placeholder="Enter additional location details"
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
                placeholder="Enter contact person name"
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
                placeholder="Enter contact email"
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
                placeholder="Enter contact phone"
              />
            </Grid>

            {/* Buttons */}

            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">


                <Button variant="contained" type="submit" disabled={loading || loadingLocations}>
                  {loading ? "Saving..." : "Create Supplier"}
                </Button>

                <Link href="/supplier" passHref>
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

