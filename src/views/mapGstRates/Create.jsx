"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// MUI
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import { FormControl, InputLabel, Select, MenuItem, Box, FormControlLabel, Checkbox, List, ListItemButton, InputAdornment, IconButton } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"

import Link from "next/link"
import { toast } from "sonner"

const CreateMapGstRate = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    type: "",
    serviceGoodsIds: [],
    slabId: "",
    gstStatus: "APPLICABLE",
    rateId: "",
    minimumValue: "",
    remarks: "",
    status: "A"
  })

  const [goods, setGoods] = useState([])
  const [services, setServices] = useState([])
  const [slabs, setSlabs] = useState([])
  const [rates, setRates] = useState([])
  const [mappedGoodsIds, setMappedGoodsIds] = useState([])
  const [mappedServiceIds, setMappedServiceIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [message, setMessage] = useState("")
  const [goodsServicePanelOpen, setGoodsServicePanelOpen] = useState(false)

  // Load initial data (goods, services, slabs) and already-mapped IDs
  useEffect(() => {
    async function loadData() {
      try {
        const [goodsRes, servicesRes, slabsRes, mappedGoodsRes, mappedServiceRes] = await Promise.all([
          fetch("/api/goods-catalog/list?limit=1000"),
          fetch("/api/service-catalog/list?limit=1000"),
          fetch("/api/gst-rate-slabs-api/list?limit=1000"),
          fetch("/api/map-gst-rates/mapped-ids?type=GOODS"),
          fetch("/api/map-gst-rates/mapped-ids?type=SERVICE")
        ])

        const goodsData = await goodsRes.json()
        const servicesData = await servicesRes.json()
        const slabsData = await slabsRes.json()
        const mappedGoodsData = await mappedGoodsRes.json()
        const mappedServiceData = await mappedServiceRes.json()

        if (goodsData.success) setGoods(goodsData.data || [])
        if (servicesData.success) setServices(servicesData.data || [])
        if (slabsData.success) setSlabs(slabsData.slabs || [])
        if (mappedGoodsData.success) setMappedGoodsIds(mappedGoodsData.mappedIds || [])
        if (mappedServiceData.success) setMappedServiceIds(mappedServiceData.mappedIds || [])
      } catch (error) {
        toast.error("Failed to load master data")
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Load GST Rates
  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch("/api/gst-rate/list?limit=1000")
        const data = await res.json()

        if (data.success) {
          if (formData.slabId) {
            setRates(
              data.rates.filter(r => r.slabId === parseInt(formData.slabId))
            )
          } else {
            setRates(data.rates || [])
          }
        }
      } catch (error) {
        toast.error("Failed to load GST Rates")
      }
    }

    loadRates()
  }, [formData.slabId])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "type") setGoodsServicePanelOpen(false)
    setFormData({
      ...formData,
      [name]: value,
      ...(name === "type" && { serviceGoodsIds: [] }),
      ...(name === "slabId" && { rateId: "" })
    })
  }

  // Filter out already-mapped goods/services
  const availableGoods = goods.filter((g) => !mappedGoodsIds.includes(g.goodsId))
  const availableServices = services.filter((s) => !mappedServiceIds.includes(s.service_id))

  // Summary text for selected goods/services (for the text box)
  const getGoodsServiceSummary = () => {
    const ids = formData.serviceGoodsIds || []
    if (ids.length === 0) return "No items selected"
    if (formData.type === "GOODS") {
      const labels = ids
        .map((id) => {
          const g = availableGoods.find((x) => x.goodsId === id)
          return g ? `${g.goodsName} (${g.goodsCode})` : null
        })
        .filter(Boolean)
      if (labels.length <= 3) return labels.join(", ")
      return `${labels.length} selected: ${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`
    }
    if (formData.type === "SERVICE") {
      const labels = ids
        .map((id) => {
          const s = availableServices.find((x) => x.service_id === id)
          return s ? `${s.service_name} (${s.service_code})` : null
        })
        .filter(Boolean)
      if (labels.length <= 3) return labels.join(", ")
      return `${labels.length} selected: ${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`
    }
    return "No items selected"
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (!formData.type) {
      toast.error("Type is required")
      setMessage("Type is required")
      return
    }

    if (!formData.serviceGoodsIds || formData.serviceGoodsIds.length === 0) {
      toast.error("Select at least one Goods / Service")
      setMessage("Select at least one Goods / Service")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/map-gst-rates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          serviceGoodsIds: formData.serviceGoodsIds,
          slabId: formData.slabId || null,
          rateId: formData.rateId || null,
          minimumValue: formData.minimumValue || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || "GST Rate Mapping(s) created successfully")
        router.push("/map-gst-rates")
      } else {
        toast.error(data.error || "Failed to create mapping")
        setMessage(data.error || "Failed to create mapping")
      }
    } catch (err) {
      toast.error(err.message)
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create GST Rate Mapping" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loadingData}
                >
                  <MenuItem value="GOODS">Goods</MenuItem>
                  <MenuItem value="SERVICE">Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Goods / Service: text box + plus/close to open checkbox section */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  fontWeight: 500,
                  fontSize: "0.875rem"
                }}
              >
                {formData.type === "GOODS"
                  ? "Goods"
                  : formData.type === "SERVICE"
                  ? "Service"
                  : "Goods / Service"}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={getGoodsServiceSummary()}
                readOnly
                disabled={!formData.type || loadingData}
                onClick={() => {
                  if (formData.type && !loadingData && (formData.type === "GOODS" ? availableGoods.length > 0 : availableServices.length > 0)) {
                    setGoodsServicePanelOpen(true)
                  }
                }}
                sx={{
                  "& .MuiInputBase-input": { cursor: formData.type && !loadingData ? "pointer" : "default" },
                  opacity: !formData.type || loadingData ? 0.6 : 1
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {formData.type && !loadingData && (formData.type === "GOODS" ? availableGoods.length > 0 : availableServices.length > 0) ? (
                        goodsServicePanelOpen ? (
                          <IconButton
                            size="small"
                            aria-label="Close selection"
                            onClick={(e) => {
                              e.stopPropagation()
                              setGoodsServicePanelOpen(false)
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            aria-label="Open selection"
                            onClick={(e) => {
                              e.stopPropagation()
                              setGoodsServicePanelOpen(true)
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        )
                      ) : null}
                    </InputAdornment>
                  )
                }}
              />
              {goodsServicePanelOpen && formData.type && (
                <Box
                  sx={{
                    mt: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    "& .scroll-list": {
                      maxHeight: 260,
                      overflowY: "auto",
                      overflowX: "hidden",
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(0,0,0,0.3) transparent",
                      "&::-webkit-scrollbar": { width: 8 },
                      "&::-webkit-scrollbar-track": { bgcolor: "action.hover" },
                      "&::-webkit-scrollbar-thumb": {
                        bgcolor: "action.selected",
                        borderRadius: 4
                      },
                      "&::-webkit-scrollbar-thumb:hover": { bgcolor: "action.disabled" }
                    }
                  }}
                >
                  {formData.type === "GOODS" && (
                    <>
                      {availableGoods.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 2 }}>
                          All goods already have a GST mapping
                        </Typography>
                      ) : (
                        <>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={availableGoods.length > 0 && formData.serviceGoodsIds.length === availableGoods.length}
                                indeterminate={formData.serviceGoodsIds.length > 0 && formData.serviceGoodsIds.length < availableGoods.length}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceGoodsIds: e.target.checked ? availableGoods.map((g) => g.goodsId) : []
                                  }))
                                }}
                              />
                            }
                            label="Select all"
                            sx={{
                              borderBottom: 1,
                              borderColor: "divider",
                              width: "100%",
                              m: 0,
                              py: 1,
                              px: 1.5,
                              bgcolor: "action.hover"
                            }}
                          />
                          <Box className="scroll-list">
                            <List dense disablePadding sx={{ py: 0 }}>
                              {availableGoods.map((item) => (
                                <ListItemButton
                                  key={item.goodsId}
                                  dense
                                  sx={{ py: 0.5, px: 1.5 }}
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      serviceGoodsIds: prev.serviceGoodsIds.includes(item.goodsId)
                                        ? prev.serviceGoodsIds.filter((id) => id !== item.goodsId)
                                        : [...prev.serviceGoodsIds, item.goodsId]
                                    }))
                                  }}
                                >
                                  <Checkbox
                                    checked={formData.serviceGoodsIds.includes(item.goodsId)}
                                    disableRipple
                                    size="small"
                                    sx={{ mr: 1.5 }}
                                  />
                                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                    {item.goodsName} ({item.goodsCode})
                                  </Typography>
                                </ListItemButton>
                              ))}
                            </List>
                          </Box>
                        </>
                      )}
                    </>
                  )}
                  {formData.type === "SERVICE" && (
                    <>
                      {availableServices.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 2 }}>
                          All services already have a GST mapping
                        </Typography>
                      ) : (
                        <>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={availableServices.length > 0 && formData.serviceGoodsIds.length === availableServices.length}
                                indeterminate={formData.serviceGoodsIds.length > 0 && formData.serviceGoodsIds.length < availableServices.length}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceGoodsIds: e.target.checked ? availableServices.map((s) => s.service_id) : []
                                  }))
                                }}
                              />
                            }
                            label="Select all"
                            sx={{
                              borderBottom: 1,
                              borderColor: "divider",
                              width: "100%",
                              m: 0,
                              py: 1,
                              px: 1.5,
                              bgcolor: "action.hover"
                            }}
                          />
                          <Box className="scroll-list">
                            <List dense disablePadding sx={{ py: 0 }}>
                              {availableServices.map((item) => (
                                <ListItemButton
                                  key={item.service_id}
                                  dense
                                  sx={{ py: 0.5, px: 1.5 }}
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      serviceGoodsIds: prev.serviceGoodsIds.includes(item.service_id)
                                        ? prev.serviceGoodsIds.filter((id) => id !== item.service_id)
                                        : [...prev.serviceGoodsIds, item.service_id]
                                    }))
                                  }}
                                >
                                  <Checkbox
                                    checked={formData.serviceGoodsIds.includes(item.service_id)}
                                    disableRipple
                                    size="small"
                                    sx={{ mr: 1.5 }}
                                  />
                                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                    {item.service_name} ({item.service_code})
                                  </Typography>
                                </ListItemButton>
                              ))}
                            </List>
                          </Box>
                        </>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Grid>

            {/* Slab */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rate Slab (Optional)</InputLabel>
                <Select name="slabId" value={formData.slabId} onChange={handleChange}>
                  <MenuItem value="">None</MenuItem>
                  {slabs.map(slab => (
                    <MenuItem key={slab.slabId} value={slab.slabId}>
                      {slab.slabName}
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

            {/* GST Rate */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>GST Rate (Optional)</InputLabel>
                <Select name="rateId" value={formData.rateId} onChange={handleChange}>
                  <MenuItem value="">None</MenuItem>
                  {rates.map(rate => (
                    <MenuItem key={rate.rateId} value={rate.rateId}>
                      {rate.gstRate}%
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
                type="number"
                name="minimumValue"
                value={formData.minimumValue}
                onChange={handleChange}
              />
            </Grid>

            {/* Remarks */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                multiline
                rows={3}
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

            {/* Error Message */}
            {message && (
              <Grid item xs={12}>
                <Typography color="red">{message}</Typography>
              </Grid>
            )}

            {/* Buttons */}
            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">
                <Button variant="contained" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Create Mapping"}
                </Button>

                <Link href="/map-gst-rates">
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "red",
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
      </CardContent>
    </Card>
  )
}

export default CreateMapGstRate
