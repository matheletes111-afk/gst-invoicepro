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
    const [dealer, setDealer] = useState(null)

    /* ================= LOAD DEALER ================= */
    const loadDealer = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/dealer/${id}`)
            const data = await res.json()

            if (data.success && data.dealer) {
                setDealer(data.dealer)
            } else {
                toast.error(data.error || "Dealer not found")
                router.push("/dealer")
            }
        } catch {
            toast.error("Failed to load dealer")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadDealer()
    }, [id])

    /* ================= UI ================= */
    return (
        <Card>
            <CardHeader title="Dealer Details" />
            <CardContent>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading Dealer...</Typography>
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
                                <Typography variant="subtitle2">Dealer Name</Typography>
                                <Typography>{dealer.dealerName || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Business License No</Typography>
                                <Typography>{dealer.businessLicenseNo || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Taxpayer Registration Status</Typography>
                                <Typography>{dealer.taxpayerRegStatus === "YES" ? "Yes" : "No"}</Typography>
                            </Grid>

                            {dealer.taxpayerRegStatus === "YES" && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2">Taxpayer Registration No</Typography>
                                        <Typography>{dealer.taxpayerRegNo || "-"}</Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2">Taxpayer Registration Region</Typography>
                                        <Typography>{dealer.taxpayerRegRegion || "-"}</Typography>
                                    </Grid>
                                </>)}



                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Typography>
                                    {dealer.status === "A" ? "Active" : "Inactive"}
                                </Typography>
                            </Grid>

                            {/* ================= ADDRESS ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Address</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Dzongkhag</Typography>
                                <Typography>{dealer.dzongkhag?.name || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Gewog / Thromde</Typography>
                                <Typography>{dealer.gewog?.name || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Village</Typography>
                                <Typography>{dealer.village?.name || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Location</Typography>
                                <Typography>{dealer.location || "-"}</Typography>
                            </Grid>

                            {/* ================= CONTACT ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Contact Information</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Contact Name</Typography>
                                <Typography>{dealer.contactName || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Contact Email</Typography>
                                <Typography>{dealer.contactEmail || "-"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Contact Phone</Typography>
                                <Typography>{dealer.contactPhone || "-"}</Typography>
                            </Grid>

                            {/* ================= ACTIONS ================= */}
                            <Grid item xs={12}>
                                <div className="flex gap-4 mt-4">



                                    <Link href="/dealer">
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
