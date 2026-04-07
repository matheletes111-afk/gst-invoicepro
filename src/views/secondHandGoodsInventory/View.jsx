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

import Link from "next/link"

export default function ViewInventory({ id }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [inventory, setInventory] = useState(null)

    /* ================= LOAD INVENTORY ================= */
    const loadInventory = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/second-hand-goods-inventory/${id}`)
            const data = await res.json()

            if (data.success && data.inventory) {
                setInventory(data.inventory)
            } else {
                toast.error(data.error || "Inventory item not found")
                router.push("/second-hand-goods-inventory")
            }
        } catch {
            toast.error("Failed to load inventory item")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadInventory()
    }, [id])

    /* ================= UI ================= */
    return (
        <Card>
            <CardHeader title="View Inventory Item" />
            <CardContent>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading Inventory Item...</Typography>
                    </div>
                ) : (
                    <>
                        <Grid container spacing={4}>

                            {/* Goods Name */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Goods Name</Typography>
                                <Typography>{inventory.goodsName}</Typography>
                                <Divider sx={{ mt: 1 }} />
                            </Grid>

                            {/* Goods Description */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Goods Description</Typography>
                                <Typography>
                                    {inventory.goodsDescription || "—"}
                                </Typography>
                            </Grid>

                            {/* Unit */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Unit of Measurement</Typography>
                                <Typography>
                                    {inventory.unit?.name || "—"}
                                </Typography>
                            </Grid>

                            {/* Unit Price */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Unit Price</Typography>
                                <Typography>
                                    {Number(inventory.unitPrice).toFixed(2)}
                                </Typography>
                            </Grid>

                            {/* Quantity */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Quantity</Typography>
                                <Typography>
                                    {inventory.quantity}
                                </Typography>
                            </Grid>

                            {/* Inventory Value */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">Inventory Value</Typography>
                                <Typography>
                                    {Number(inventory.inventoryValue).toFixed(2)}
                                </Typography>
                            </Grid>

                            {/* Status */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Typography>
                                    {inventory.status === "A" ? "Active" : "Inactive"}
                                </Typography>
                            </Grid>

                            {/* Buttons */}
                            <Grid item xs={12}>
                                <div className="flex items-center justify-between flex-wrap gap-5">

                                    <Link href="/second-hand-goods-inventory">
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
