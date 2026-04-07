'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import Card from "@mui/material/Card"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import Divider from "@mui/material/Divider"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"

import Link from "next/link"

export default function ViewSalesOrder({ id }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [salesOrder, setSalesOrder] = useState(null)

    /* ================= LOAD SALES ORDER ================= */
    const loadSalesOrder = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/second-hand-goods-sales/${id}`)
            const data = await res.json()

            if (data.success && data.salesOrder) {
                setSalesOrder(data.salesOrder)
            } else {
                toast.error(data.error || "Sales Order not found")
                router.push("/second-hand-goods-sales")
            }
        } catch {
            toast.error("Failed to load sales order")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadSalesOrder()
    }, [id])

    /* ================= UI ================= */
    return (
        <Card>
            <CardHeader title="View Sales Order" />
            <CardContent>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading Sales Order...</Typography>
                    </div>
                ) : (
                    <>
                        <Grid container spacing={4}>

                            {/* Header */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Sales Order Details</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            {/* Customer */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Customer Name</Typography>
                                <Typography>{salesOrder.customer || "—"}</Typography>
                            </Grid>

                            {/* Customer TPN */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Customer TPN</Typography>
                                <Typography>{salesOrder.customerTPN || "—"}</Typography>
                            </Grid>

                            {/* Date */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Goods Issue Date</Typography>
                                <Typography>{salesOrder.date}</Typography>
                            </Grid>

                            {/* Invoice No */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Invoice No</Typography>
                                <Typography>{salesOrder.invoiceNo || "—"}</Typography>
                            </Grid>

                            {/* Invoice Date */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Invoice Date</Typography>
                                <Typography>{salesOrder.invoiceDate || "—"}</Typography>
                            </Grid>

                            {/* Currency */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Currency</Typography>
                                <Typography>
                                    {salesOrder.currency
                                        ? `${salesOrder.currency.currencySymbol} - ${salesOrder.currency.currencyName}`
                                        : "—"}
                                </Typography>
                            </Grid>

                            {/* Total Price */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Total Price</Typography>
                                <Typography>
                                    {Number(salesOrder.totalPrice).toFixed(2)}
                                </Typography>
                            </Grid>

                            {/* Items */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mt: 2 }}>Items</Typography>
                            </Grid>

                            {salesOrder.items.map((item, index) => (
                                <Grid item xs={12} key={index}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                            Item {index + 1}
                                        </Typography>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2">Goods Name</Typography>
                                                <Typography>{item.goodsName}</Typography>
                                            </Grid>

                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2">Unit</Typography>
                                                <Typography>{item.unit?.name || "—"}</Typography>
                                            </Grid>

                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2">Unit Price</Typography>
                                                <Typography>{Number(item.unitPrice).toFixed(2)}</Typography>
                                            </Grid>

                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2">Quantity</Typography>
                                                <Typography>{item.quantity}</Typography>
                                            </Grid>

                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle2">Amount</Typography>
                                                <Typography>{Number(item.amount).toFixed(2)}</Typography>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2">Description</Typography>
                                                <Typography>{item.goodsDescription || "—"}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Card>
                                </Grid>
                            ))}

                            {/* Status */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Typography>
                                    {salesOrder.status === "A" ? "Active" : "Inactive"}
                                </Typography>
                            </Grid>

                            {/* Buttons */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>


                                    <Link href="/second-hand-goods-sales">
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

                                </Box>
                            </Grid>

                        </Grid>
                    </>
                )}

            </CardContent>
        </Card>
    )
}
