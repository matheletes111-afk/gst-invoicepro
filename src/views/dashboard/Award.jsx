'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

const Award = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bestSeller, setBestSeller] = useState(null)
  const [totalSales, setTotalSales] = useState(0)
  const [percentage, setPercentage] = useState(0)
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    // Fetch user info
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success && data.user) {
          setUserName(data.user.name || data.user.email?.split('@')[0] || 'User')
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    // Fetch best seller data
    const fetchBestSeller = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/best-seller')
        const data = await res.json()

        if (data.success && data.data) {
          setBestSeller(data.data.bestSeller)
          setTotalSales(data.data.totalSales)
          setPercentage(data.data.percentage)
        }
      } catch (error) {
        console.error('Error fetching best seller:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
    fetchBestSeller()
  }, [])

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='flex flex-col gap-2 relative items-start'>
          <div className='flex items-center justify-center w-full py-8'>
            <CircularProgress size={40} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-2 relative items-start'>
        <div>
          <Typography variant='h5'>
            {bestSeller 
              ? `Congratulations ${userName}! 🎉`
              : `Hello ${userName}! 👋`
            }
          </Typography>
          <Typography>
            {bestSeller 
              ? `Best seller of the month`
              : `No sales data for this month`
            }
          </Typography>
        </div>
        {bestSeller && (
          <>
            <div>
              <Typography variant='h6' color='primary' sx={{ mb: 0.5 }}>
                {bestSeller.name}
              </Typography>
              <Typography variant='h4' color='primary'>
                Nu. {formatCurrency(bestSeller.amount)}
              </Typography>
              <Typography>
                {percentage}% of monthly sales 🚀
              </Typography>
            </div>
            <Button 
              size='small' 
              variant='contained'
              onClick={() => router.push('/sales')}
            >
              View Sales
            </Button>
          </>
        )}
        {!bestSeller && (
          <Button 
            size='small' 
            variant='contained'
            onClick={() => router.push('/sales')}
          >
            View Sales
          </Button>
        )}
        <img
          src='/images/pages/trophy.png'
          alt='trophy image'
          height={102}
          className='absolute inline-end-7 bottom-6'
        />
      </CardContent>
    </Card>
  )
}

export default Award
