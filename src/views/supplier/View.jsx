'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import Card from "@mui/material/Card"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Divider from "@mui/material/Divider"

import Link from "next/link"

export default function View({ id }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supplier, setSupplier] = useState(null)

    /* ================= LOAD SUPPLIER ================= */
    const loadSupplier = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/supplier/${id}`)
            const data = await res.json()

            if (data.success && data.supplier) {
                setSupplier(data.supplier)
            } else {
                toast.error(data.error || "Supplier not found")
                router.push("/supplier")
            }
        } catch (err) {
            toast.error("Failed to load supplier")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadSupplier()
    }, [id])

    /* ================= UI ================= */
    return (
        <Card>
            <CardHeader title="Supplier Details" />
            <CardContent>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading Supplier...</Typography>
                    </div>
                ) : (
                    <>
                        <Grid container spacing={4}>

                            {/* ================= BASIC INFO ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Basic Information</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Supplier Name</Typography>
                                <Typography>{supplier.supplierName || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Business License No</Typography>
                                <Typography>{supplier.businessLicenseNo || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Taxpayer Registration Status</Typography>
                                <Typography>{supplier.taxpayerRegStatus === "YES" ? "Yes" : "No"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Taxpayer Registration No</Typography>
                                <Typography>{supplier.taxpayerRegNo || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Taxpayer Registration Region</Typography>
                                <Typography>{supplier.taxpayerRegRegion || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Typography>
                                    {supplier.status === "A" ? "Active" : "Inactive"}
                                </Typography>
                            </Grid>

                            {/* ================= ADDRESS ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Address</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Dzongkhag</Typography>
                                <Typography>{supplier.dzongkhag?.name || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Gewog / Thromde</Typography>
                                <Typography>{supplier.gewog?.name || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Village</Typography>
                                <Typography>{supplier.village?.name || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Location</Typography>
                                <Typography>{supplier.location || "-"}</Typography>
                            </Grid>

                            {/* ================= CONTACT ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Contact Information</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Contact Name</Typography>
                                <Typography>{supplier.contactName || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Contact Email</Typography>
                                <Typography>{supplier.contactEmail || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Contact Phone</Typography>
                                <Typography>{supplier.contactPhone || "-"}</Typography>
                            </Grid>

                            {/* ================= ACTIONS ================= */}
                            <Grid item xs={12}>
                                <div className="flex gap-4 mt-4">



                                    <Link href="/supplier">
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
                    </>
                )}

            </CardContent>
        </Card>
    )
}
