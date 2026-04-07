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

export default function ViewPurchaseOrder({ id }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [purchaseOrder, setPurchaseOrder] = useState(null)

    /* ================= LOAD PURCHASE ORDER ================= */
    const loadPurchaseOrder = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/second-hand-goods-purchase/${id}`)
            const data = await res.json()

            if (data.success && data.purchaseOrder) {
                setPurchaseOrder(data.purchaseOrder)
            } else {
                toast.error(data.error || "Purchase Order not found")
                router.push("/second-hand-goods-purchase")
            }
        } catch {
            toast.error("Failed to load Purchase Order")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadPurchaseOrder()
    }, [id])

    /* ================= UI ================= */
    return (
        <Card>
            <CardHeader title="View Purchase Order" />
            <CardContent>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading Purchase Order...</Typography>
                    </div>
                ) : (
                    <>
                        <Grid container spacing={4}>

                            {/* ================= HEADER ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6">Purchase Order Details</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Supplier</Typography>
                                <Typography>{purchaseOrder.supplier?.supplierName || "—"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Dealer</Typography>
                                <Typography>{purchaseOrder.dealer?.dealerName || "—"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Date (Goods Receipt)</Typography>
                                <Typography>
                                    {purchaseOrder.date
                                        ? new Date(purchaseOrder.date).toLocaleDateString()
                                        : "—"}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Purchase Order No</Typography>
                                <Typography>{purchaseOrder.purchaseOrderNo || "—"}</Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2">Purchase Order Date</Typography>
                                <Typography>
                                    {purchaseOrder.purchaseOrderDate
                                        ? new Date(purchaseOrder.purchaseOrderDate).toLocaleDateString()
                                        : "—"}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Currency</Typography>
                                <Typography>
                                    {purchaseOrder.currency
                                        ? `${purchaseOrder.currency.currencySymbol} - ${purchaseOrder.currency.currencyName}`
                                        : "—"}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Total Price</Typography>
                                <Typography>
                                    {Number(purchaseOrder.totalPrice || 0).toFixed(2)}
                                </Typography>
                            </Grid>

                            {/* ================= ITEMS ================= */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mt: 2 }}>Items</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            {purchaseOrder.items?.map((item, index) => (
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

                            {/* ================= STATUS ================= */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Typography>
                                    {purchaseOrder.status === "A" ? "Active" : "Inactive"}
                                </Typography>
                            </Grid>

                            {/* ================= ACTIONS ================= */}
                            <Grid item xs={12}>
                                <Box display="flex" gap={2} mt={3}>


                                    <Link href="/second-hand-goods-purchase">
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
