'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'

// Components Imports
import OptionsMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const WeeklyOverview = () => {
  // Hooks
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [totalSales, setTotalSales] = useState(0)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/sales-by-goods-services')
        const data = await res.json()

        if (data.success && data.data) {
          setSalesData(data.data)
          // Calculate total sales from all items
          const total = data.data.reduce((sum, item) => sum + item.totalAmount, 0)
          setTotalSales(total)
        }
      } catch (error) {
        console.error('Error fetching sales data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  // Vars
  const divider = 'var(--mui-palette-divider)'
  const disabled = 'var(--mui-palette-text-disabled)'

  // Prepare chart data
  const categories = salesData.map(item => {
    // Truncate long names for better display
    const name = item.name || 'Unknown'
    return name.length > 15 ? name.substring(0, 15) + '...' : name
  })
  const chartData = salesData.map(item => parseFloat(item.totalAmount) || 0)

  // Generate colors - all orange
  const colors = salesData.map(() => '#FF8C42')

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 7,
        distributed: true,
        columnWidth: '40%'
      }
    },
    stroke: {
      width: 2,
      colors: ['var(--mui-palette-background-paper)']
    },
    legend: { show: false },
    grid: {
      xaxis: { lines: { show: false } },
      strokeDashArray: 7,
      padding: { left: -9, top: -20, bottom: 13 },
      borderColor: divider
    },
    dataLabels: { enabled: false },
    colors: colors.length > 0 ? colors : [
      '#FF8C42',
      '#FF8C42',
      '#FF8C42',
      '#FF8C42',
      '#FF8C42',
      '#FF8C42'
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ['No Data'],
      tickPlacement: 'on',
      labels: { 
        show: true,
        rotate: -45,
        rotateAlways: true,
        style: { 
          colors: disabled, 
          fontSize: theme.typography.body2.fontSize 
        }
      },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      show: true,
      tickAmount: 4,
      labels: {
        offsetY: 2,
        offsetX: -17,
        style: { colors: disabled, fontSize: theme.typography.body2.fontSize },
        formatter: value => {
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`
          } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
          }
          return value.toString()
        }
      }
    }
  }

  const topItem = salesData.length > 0 ? salesData[0] : null
  const topItemPercentage = topItem && totalSales > 0 
    ? ((topItem.totalAmount / totalSales) * 100).toFixed(1) 
    : 0

  return (
    <Card>
      <CardHeader
        title='Sales by Goods/Services'
        action={<OptionsMenu iconClassName='text-textPrimary' options={['Refresh', 'Update', 'Delete']} />}
      />
      <CardContent sx={{ '& .apexcharts-xcrosshairs.apexcharts-active': { opacity: 0 } }}>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <CircularProgress size={40} />
          </div>
        ) : salesData.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <Typography color='text.secondary'>No sales data available for this month</Typography>
          </div>
        ) : (
          <>
            <AppReactApexCharts
              type='bar'
              height={206}
              width='100%'
              series={[{ name: 'Sales Amount', data: chartData }]}
              options={options}
            />
            {topItem && (
              <div className='flex items-center mbe-4 gap-4'>
                <Typography variant='h4'>{topItemPercentage}%</Typography>
                <Typography>
                  {topItem.name} accounts for {topItemPercentage}% of total sales this month
                </Typography>
              </div>
            )}
            <Button fullWidth variant='contained'>
              Details
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default WeeklyOverview
