'use client'

// React Imports
import { useState, useEffect } from 'react'

//MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

const Transactions = () => {
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState({
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalServices: 0
  })

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/statistics')
        const data = await res.json()

        if (data.success && data.data) {
          setStatistics(data.data)
        }
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const data = [
    {
      stats: loading ? '...' : formatNumber(statistics.totalSales),
      title: 'Sales',
      color: 'primary',
      icon: 'ri-pie-chart-2-line'
    },
    {
      stats: loading ? '...' : formatNumber(statistics.totalCustomers),
      title: 'Customers',
      color: 'success',
      icon: 'ri-group-line'
    },
    {
      stats: loading ? '...' : formatNumber(statistics.totalProducts),
      color: 'warning',
      title: 'Products',
      icon: 'ri-macbook-line'
    },
    {
      stats: loading ? '...' : formatNumber(statistics.totalServices),
      color: 'info',
      title: 'Services',
      icon: 'ri-service-line'
    }
  ]

  return (
    <Card className='bs-full'>
      <CardHeader
        title='Transactions'
        action={<OptionMenu iconClassName='text-textPrimary' options={['Refresh', 'Share', 'Update']} />}
        subheader={
          <p className='mbs-3'>
            <span className='font-medium text-textPrimary'>Current Month Statistics</span>
            <span className='text-textSecondary'> this month</span>
          </p>
        }
      />
      <CardContent className='!pbs-5'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <CircularProgress size={40} />
          </div>
        ) : (
          <Grid container spacing={2}>
            {data.map((item, index) => (
              <Grid item xs={6} md={3} key={index}>
                <div className='flex items-center gap-3'>
                  <CustomAvatar variant='rounded' color={item.color} className='shadow-xs'>
                    <i className={item.icon}></i>
                  </CustomAvatar>
                  <div>
                    <Typography>{item.title}</Typography>
                    <Typography variant='h5'>{item.stats}</Typography>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}

export default Transactions
