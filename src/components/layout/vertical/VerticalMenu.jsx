'use client'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useState, useEffect, useMemo } from 'react'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const REPORT_ICON = <i className='ri-file-chart-line' />

const APPS_PAGES_ITEMS = [
  { href: '/unit', label: 'Unit', icon: <i className='ri-ruler-line' /> },
  { href: '/dzongkhag', label: 'Dzongkhag', icon: <i className='ri-map-pin-line' /> },
  { href: '/gewog', label: 'Gewog', icon: <i className='ri-map-pin-2-line' /> },
  { href: '/village', label: 'Village', icon: <i className='ri-community-line' /> },
  { href: '/gst-rate-slabs', label: 'GST Rate Slabs', icon: <i className='ri-stack-line' /> },
  { href: '/gst-rate', label: 'GST Rate', icon: <i className='ri-percent-line' /> },
  { href: '/map-gst-rates', label: 'Map GST Rates', icon: <i className='ri-link-m' /> },
  { href: '/currency', label: 'Currency', icon: <i className='ri-money-dollar-circle-line' /> },
  { href: '/exchange-rate', label: 'Exchange Rate Master', icon: <i className='ri-exchange-line' /> },
  { href: '/service-cataloge', label: 'Service Catalog', icon: <i className='ri-file-list-3-line' /> },
  { href: '/goods-catalog', label: 'Goods Catalog', icon: <i className='ri-shopping-bag-line' /> },
  { href: '/supplier', label: 'Supplier Master', icon: <i className='ri-truck-line' /> },
  { href: '/dealer', label: 'Dealer Master', icon: <i className='ri-store-line' /> },
  { href: '/organization', label: 'Organization', icon: <i className='ri-building-line' /> },
  { href: '/party', label: 'Party', icon: <i className='ri-group-line' /> },
  { href: '/sales/create', label: 'Sales', icon: <i className='ri-shopping-bag-3-line' /> },
  { href: '/adjustment', label: 'Create Adjustment', icon: <i className='ri-shield-keyhole-line' /> },
  { href: '/adjustment_list', label: 'Adjustment List', icon: <i className='ri-file-list-line' /> },
  { href: '/purchase', label: 'Purchase', icon: <i className='ri-shopping-bag-line' /> },
  { href: '/secondhand-goods-purchase', label: 'Second Hand Goods Purchase', icon: <i className='ri-handbag-line' /> },
  { href: '/inventory-stock', label: 'Second Hand Goods Inventory', icon: <i className='ri-stack-line' /> },
  { href: '/secondhand-goods-sales', label: 'Second Hand Goods sale', icon: <i className='ri-bar-chart-box-line' /> },
  { href: '/gst-statement', label: 'Gst Statement', icon: <i className='ri-file-chart-line' /> },
]

const REPORTS_ITEMS = [
  { href: '/reports/sales-register', label: 'Sales Register Report', icon: REPORT_ICON },
  { href: '/reports/item-wise-sales-summary', label: 'Item-Wise Sales Summary', icon: REPORT_ICON },
  { href: '/reports/customer-sale-report', label: 'Customer-Wise Sales Report', icon: REPORT_ICON },
  { href: '/reports/sales-orders', label: 'Sales Order vs. Invoice Report', icon: REPORT_ICON },
  { href: '/reports/gst-summary', label: 'GST Summary Report', icon: REPORT_ICON },
  { href: '/reports/invoice-sales-activity-logs', label: 'Sales Invoice Activity Report', icon: REPORT_ICON },
  { href: '/reports/user-activity-log', label: 'User Activity Log', icon: REPORT_ICON },
  { href: '/reports/data-change', label: 'Data Change Log', icon: REPORT_ICON },
  { href: '/reports/top-performing', label: 'Top Customers / Products Report', icon: REPORT_ICON },
  { href: '/reports/gst-trend-analysis', label: 'GST Collection Trend Analysis', icon: REPORT_ICON },
]

const ROLE_MANAGEMENT_ITEMS = [
  { href: '/role', label: 'Role Management', icon: <i className='ri-shield-user-line' /> },
  { href: '/role/create', label: 'Add Role', icon: <i className='ri-user-add-line' /> },
]

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const [sidebarAccess, setSidebarAccess] = useState({
    isSuperAdmin: false,
    allowedEndpoints: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/sidebar-access')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.success) {
          setSidebarAccess({
            isSuperAdmin: data.isSuperAdmin === true,
            allowedEndpoints: Array.isArray(data.allowedEndpoints) ? data.allowedEndpoints : []
          })
        }
      })
      .catch(() => {
        if (!cancelled) setSidebarAccess({ isSuperAdmin: false, allowedEndpoints: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const allowedSet = useMemo(
    () => new Set(sidebarAccess.allowedEndpoints),
    [sidebarAccess.allowedEndpoints]
  )

  const visibleAppsItems = useMemo(() => {
    if (sidebarAccess.isSuperAdmin) return APPS_PAGES_ITEMS
    return APPS_PAGES_ITEMS.filter((item) => allowedSet.has(item.href))
  }, [sidebarAccess.isSuperAdmin, allowedSet])

  const visibleReportsItems = useMemo(() => {
    if (sidebarAccess.isSuperAdmin) return REPORTS_ITEMS
    return REPORTS_ITEMS.filter((item) => allowedSet.has(item.href))
  }, [sidebarAccess.isSuperAdmin, allowedSet])

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        <MenuItem href='/dashboard' icon={<i className='ri-home-smile-line' />}>
          Dashboard
        </MenuItem>

        {!loading && visibleAppsItems.length > 0 && (
          <MenuSection label='Apps & Pages'>
            {visibleAppsItems.map((item) => (
              <MenuItem key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </MenuItem>
            ))}
          </MenuSection>
        )}

        {!loading && visibleReportsItems.length > 0 && (
          <MenuSection label='Reports'>
            {visibleReportsItems.map((item) => (
              <MenuItem key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </MenuItem>
            ))}
          </MenuSection>
        )}

        {!loading && sidebarAccess.isSuperAdmin && (
          <MenuSection label='Role Management'>
            {ROLE_MANAGEMENT_ITEMS.map((item) => (
              <MenuItem key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </MenuItem>
            ))}
          </MenuSection>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
