'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

const FormLayoutsBasic = () => {
    // Form State
    const [formData, setFormData] = useState({
        itemType: "",
        name: "",
        code: "",
        desc: "",
        price: "",
        unit: ""
    })

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    // Handle Input Change
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        try {
            const res = await fetch("/api/items/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price)
                })
            })

            const data = await res.json()

            if (data.success) {
                setMessage("Item created successfully!")

                // Clear form
                setFormData({
                    itemType: "",
                    name: "",
                    code: "",
                    desc: "",
                    price: "",
                    unit: ""
                })
            } else {
                setMessage(data.error || "Failed to create item")
            }
        } catch (err) {
            setMessage("Error: " + err.message)
        }

        setLoading(false)
    }

    return (
        <Card>
            <CardHeader title="Create New Item" />
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={5}>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Item Type"
                                name="itemType"
                                value={formData.itemType}
                                onChange={handleChange}
                                placeholder="Electronics, Grocery, etc."
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Item Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Laptop, T-shirt, etc."
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Item Code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="ITM12345"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="desc"
                                value={formData.desc}
                                onChange={handleChange}
                                placeholder="Short description..."
                                multiline
                                rows={3}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="100.00"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="pcs, kg, box, etc."
                            />
                        </Grid>

                        {/* Status Message */}
                        {message && (
                            <Grid item xs={12}>
                                <Typography color={message.includes("success") ? "green" : "red"}>
                                    {message}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <div className="flex items-center justify-between flex-wrap gap-5">
                                <Button variant="contained" type="submit" disabled={loading}>
                                    {loading ? "Saving..." : "Create Item"}
                                </Button>
                            </div>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
    )
}

export default FormLayoutsBasic
