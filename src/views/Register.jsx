'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import Illustrations from '@components/Illustrations'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

const Register = ({ mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoadingOrgs(true)
        const res = await fetch('/api/organization/all')
        const data = await res.json()

        if (data.success) {
          setOrganizations(data.organizations || [])
        } else {
          setError(data.error || 'Failed to load organizations')
        }
      } catch (err) {
        console.error('Error fetching organizations:', err)
        setError('Failed to load organizations')
      } finally {
        setLoadingOrgs(false)
      }
    }

    fetchOrganizations()
  }, [])

  // Submit Handler
  const handleRegister = async e => {
    e.preventDefault()
    setError('')

    // Validation
    if (!organizationId) {
      setError('Organization is required')
      return
    }

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, organizationId: parseInt(organizationId) })
      })

      const data = await res.json()

      if (!res.ok) {
        setLoading(false)
        setError(data.error || 'Something went wrong')
        return
      }

      // Success — redirect to login
      router.push('/login')

    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='p-6 sm:!p-12'>
          <Link href='/' className='flex justify-center items-start mbe-6'>
            <Logo />
          </Link>

          <Typography variant='h4'>Adventure starts here 🚀</Typography>

          <div className='flex flex-col gap-5'>
            <Typography className='mbs-1'>
              Make your app management easy and fun!
            </Typography>

            {/* ERROR MESSAGE */}
            {error && (
              <Typography color='error' className='text-center'>
                {error}
              </Typography>
            )}

            {/* FORM */}
            <form noValidate autoComplete='off' onSubmit={handleRegister} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='Username'
                value={name}
                onChange={e => setName(e.target.value)}
              />

              <TextField
                fullWidth
                label='Email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <TextField
                fullWidth
                label='Password'
                type={isPasswordShown ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Organization Selection */}
              <FormControl fullWidth required>
                <InputLabel>Organization</InputLabel>
                <Select
                  value={organizationId}
                  onChange={e => setOrganizationId(e.target.value)}
                  label='Organization'
                  disabled={loadingOrgs}
                >
                  {loadingOrgs ? (
                    <MenuItem value='' disabled>
                      Loading organizations...
                    </MenuItem>
                  ) : organizations.length === 0 ? (
                    <MenuItem value='' disabled>
                      No organizations available
                    </MenuItem>
                  ) : (
                    organizations.map(org => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name} ({org.orgType})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Checkbox />}
                label={
                  <>
                    <span>I agree to </span>
                    <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                      privacy policy & terms
                    </Link>
                  </>
                }
              />
              <Button fullWidth variant='contained' type='submit'>
                Sign Up
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>Already have an account?</Typography>
                <Typography component={Link} href='/login' color='primary'>
                  Sign in instead
                </Typography>
              </div>
              <Divider className='gap-3'>Or</Divider>
              <div className='flex justify-center items-center gap-2'>
                <IconButton size='small' className='text-facebook'>
                  <i className='ri-facebook-fill' />
                </IconButton>
                <IconButton size='small' className='text-twitter'>
                  <i className='ri-twitter-fill' />
                </IconButton>
                <IconButton size='small' className='text-github'>
                  <i className='ri-github-fill' />
                </IconButton>
                <IconButton size='small' className='text-googlePlus'>
                  <i className='ri-google-fill' />
                </IconButton>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default Register
