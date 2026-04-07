'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styles Imports
import tableStyles from '@core/styles/table.module.css'

const Table = () => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user/list?limit=100')
        const data = await res.json()

        if (data.success && data.users) {
          setUsers(data.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Get role icon and color based on role
  const getRoleConfig = (role) => {
    if (role === 'Admin') {
      return {
        icon: 'ri-vip-crown-line',
        iconClass: 'text-primary'
      }
    }
    return {
      icon: 'ri-user-3-line',
      iconClass: 'text-success'
    }
  }

  // Generate initials from name for avatar
  const getInitials = (name) => {
    if (!name || name === 'N/A') return 'U'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Get avatar color based on email (for consistent colors)
  const getAvatarColor = (email) => {
    const colors = ['primary', 'success', 'warning', 'error', 'info', 'secondary']
    const index = email.length % colors.length
    return colors[index]
  }

  return (
    <Card>
      <div className='overflow-x-auto'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <CircularProgress size={40} />
          </div>
        ) : users.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <Typography color='text.secondary'>No users found</Typography>
          </div>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleConfig = getRoleConfig(user.role)
                const initials = getInitials(user.name)
                const avatarColor = getAvatarColor(user.email)

                return (
                  <tr key={user.id}>
                    <td className='!plb-1'>
                      <div className='flex items-center gap-3'>
                        <CustomAvatar skin='light' color={avatarColor} size={34}>
                          {initials}
                        </CustomAvatar>
                        <div className='flex flex-col'>
                          <Typography color='text.primary' className='font-medium'>
                            {user.name}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {user.email.split('@')[0]}
                          </Typography>
                        </div>
                      </div>
                    </td>
                    <td className='!plb-1'>
                      <Typography>{user.email}</Typography>
                    </td>
                    <td className='!plb-1'>
                      <div className='flex gap-2'>
                        <i className={classnames(roleConfig.icon, roleConfig.iconClass, 'text-[22px]')} />
                        <Typography color='text.primary'>{user.role}</Typography>
                      </div>
                    </td>
                    <td className='!pb-1'>
                      <Chip
                        className='capitalize'
                        variant='tonal'
                        color='success'
                        label='Active'
                        size='small'
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}

export default Table
