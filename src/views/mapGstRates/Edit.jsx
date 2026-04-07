"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import Card from "@mui/material/Card"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

import Link from "next/link"

export default function EditMapGstRates({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [goods, setGoods] = useState([])
  const [services, setServices] = useState([])
  const [slabs, setSlabs] = useState([])
  const [rates, setRates] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    type: "",
    serviceGoodsId: "",
    slabId: "",
    gstStatus: "APPLICABLE",
    rateId: "",
    minimumValue: "",
    remarks: "",
    status: "A"
  })

  /* ---------- LOAD INITIAL DATA ---------- */
  useEffect(() => {
    async function loadData() {
      try {
        const [goodsRes, servicesRes, slabsRes] = await Promise.all([
          fetch("/api/goods-catalog/list?limit=1000"),
          fetch("/api/service-catalog/list?limit=1000"),
          fetch("/api/gst-rate-slabs-api/list?limit=1000")
        ])

        const goodsData = await goodsRes.json()
        const servicesData = await servicesRes.json()
        const slabsData = await slabsRes.json()

        if (goodsData.success) setGoods(goodsData.data || [])
        if (servicesData.success) setServices(servicesData.data || [])
        if (slabsData.success) setSlabs(slabsData.slabs || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  /* ---------- LOAD RATES ---------- */
  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch("/api/gst-rate/list?limit=1000")
        const data = await res.json()

        if (data.success) {
          if (formData.slabId) {
            setRates(
              data.rates.filter(
                r => r.slabId === parseInt(formData.slabId)
              )
            )
          } else {
            setRates(data.rates || [])
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadRates()
  }, [formData.slabId])

  /* ---------- LOAD MAPPING ---------- */
  const loadMapping = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/map-gst-rates/${id}`)
      const data = await res.json()

      if (data.success && data.mapping) {
        const m = data.mapping
        setFormData({
          type: m.type || "",
          serviceGoodsId: m.serviceGoodsId?.toString() || "",
          slabId: m.slabId?.toString() || "",
          gstStatus: m.gstStatus || "APPLICABLE",
          rateId: m.rateId?.toString() || "",
          minimumValue: m.minimumValue?.toString() || "",
          remarks: m.remarks || "",
          status: m.status || "A"
        })
      } else {
        toast.error(data.error || "Mapping not found")
      }
    } catch {
      toast.error("Failed to load mapping")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadMapping()
  }, [id])

  /* ---------- HANDLE CHANGE ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
      ...(name === "slabId" && { rateId: "" })
    })
  }

  /* ---------- UPDATE ---------- */
  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/map-gst-rates/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData,
          slabId: formData.slabId || null,
          rateId: formData.rateId || null,
          minimumValue: formData.minimumValue || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Mapping updated successfully!")
        router.push("/map-gst-rates")
      } else {
        toast.error(data.error || "Failed to update mapping")
      }
    } catch {
      toast.error("Error updating mapping")
    } finally {
      setLoading(false)
    }
  }

  /* ---------- UI ---------- */
  return (
    <Card>
      <CardHeader title="Edit GST Rate Mapping" />
      <CardContent>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading Mapping...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              {/* Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select name="type" value={formData.type} onChange={handleChange}>
                    <MenuItem value="GOODS">Goods</MenuItem>
                    <MenuItem value="SERVICE">Service</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Goods / Service */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>
                    {formData.type === "GOODS" ? "Goods" : "Service"}
                  </InputLabel>
                  <Select
                    name="serviceGoodsId"
                    value={formData.serviceGoodsId}
                    onChange={handleChange}
                    disabled={!formData.type || loadingData}
                  >
                    {formData.type === "GOODS" &&
                      goods.map(item => (
                        <MenuItem key={item.goodsId} value={item.goodsId.toString()}>
                          {item.goodsName} ({item.goodsCode})
                        </MenuItem>
                      ))}

                    {formData.type === "SERVICE" &&
                      services.map(item => (
                        <MenuItem key={item.service_id} value={item.service_id.toString()}>
                          {item.service_name} ({item.service_code})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Slab */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Rate Slab (Optional)</InputLabel>
                  <Select name="slabId" value={formData.slabId} onChange={handleChange}>
                    <MenuItem value="">None</MenuItem>
                    {slabs.map(s => (
                      <MenuItem key={s.slabId} value={s.slabId.toString()}>
                        {s.slabName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* GST Status */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>GST Status</InputLabel>
                  <Select name="gstStatus" value={formData.gstStatus} onChange={handleChange}>
                    <MenuItem value="APPLICABLE">Applicable</MenuItem>
                    <MenuItem value="EXEMPT">Exempt</MenuItem>
                    <MenuItem value="ZERO_RATED">Zero Rated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Rate */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>GST Rate (Optional)</InputLabel>
                  <Select name="rateId" value={formData.rateId} onChange={handleChange}>
                    <MenuItem value="">None</MenuItem>
                    {rates.map(r => (
                      <MenuItem key={r.rateId} value={r.rateId.toString()}>
                        {r.gstRate}% {r.slab?.slabName ? `(${r.slab.slabName})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Minimum Value */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Value (Optional)"
                  name="minimumValue"
                  type="number"
                  value={formData.minimumValue}
                  onChange={handleChange}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks (Optional)"
                  name="remarks"
                  multiline
                  rows={4}
                  value={formData.remarks}
                  onChange={handleChange}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={formData.status} onChange={handleChange}>
                    <MenuItem value="A">Active</MenuItem>
                    <MenuItem value="I">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Buttons */}
              <Grid item xs={12}>
                <div className="flex items-center justify-between flex-wrap gap-5">

                  <Button variant="contained" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Mapping"}
                  </Button>

                  <Link href="/map-gst-rates">
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "red",
                        color: "white",
                        "&:hover": { backgroundColor: "#cc0000" }
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
