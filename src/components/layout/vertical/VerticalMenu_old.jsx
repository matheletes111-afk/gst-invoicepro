// MUI Imports
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  // Hooks
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
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
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        <MenuItem href='/dashboard' icon={<i className='ri-home-smile-line' />}>
          Dashboard
        </MenuItem>

        <MenuSection label='Apps & Pages'>
          {/* <MenuItem
            href={`${process.env.NEXT_PUBLIC_PRO_URL}/apps/email`}
            icon={<i className='ri-mail-open-line' />}
            suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
            target='_blank'
          >
            Email
          </MenuItem> */}

          <MenuItem href='/unit' icon={<i className='ri-user-line' />}>
            Unit
          </MenuItem>

          {/* <MenuItem href='/items' icon={<i className='ri-list-check' />}>
            Item
          </MenuItem> */}

          <MenuItem href='/dzongkhag' icon={<i className='ri-map-pin-line' />}>
            Dzongkhag
          </MenuItem>

          <MenuItem href='/gewog' icon={<i className='ri-map-pin-2-line' />}>
            Gewog
          </MenuItem>

          <MenuItem href='/village' icon={<i className='ri-community-line' />}>
            Village
          </MenuItem>

          <MenuItem href='/gst-rate-slabs' icon={<i className='ri-list-check' />}>
            GST Rate Slabs
          </MenuItem>

          <MenuItem href='/gst-rate' icon={<i className='ri-percent-line' />}>
            GST Rate
          </MenuItem>

          <MenuItem href='/map-gst-rates' icon={<i className='ri-link-m' />}>
            Map GST Rates
          </MenuItem>

          <MenuItem href='/currency' icon={<i className='ri-money-dollar-circle-line' />}>
            Currency
          </MenuItem>

          <MenuItem href='/exchange-rate' icon={<i className='ri-exchange-line' />}>
            Exchange Rate Master
          </MenuItem>

          <MenuItem href='/service-cataloge' icon={<i className='ri-book-open-line' />}>
            Service Catalog
          </MenuItem>

          <MenuItem href='/goods-catalog' icon={<i className='ri-shopping-bag-line' />}>
            Goods Catalog
          </MenuItem>

          <MenuItem href='/supplier' icon={<i className='ri-truck-line' />}>
            Supplier Master
          </MenuItem>

          <MenuItem href='/dealer' icon={<i className='ri-store-line' />}>
            Dealer Master
          </MenuItem>

          {/* <MenuItem href='/second-hand-goods-purchase' icon={<i className='ri-shopping-cart-line' />}>
            Second Hand Goods Purchase
          </MenuItem>

          <MenuItem href='/second-hand-goods-inventory' icon={<i className='ri-stack-line' />}>
            Second Hand Goods Inventory
          </MenuItem>

          <MenuItem href='/second-hand-goods-sales' icon={<i className='ri-shopping-bag-3-line' />}>
            Second Hand Goods Sales
          </MenuItem>

          <MenuItem href='/second-hand-goods-sales-invoice' icon={<i className='ri-file-text-line' />}>
            Second Hand Goods Sales Invoice
          </MenuItem> */}

          <MenuItem href='/organization' icon={<i className='ri-building-line' />}>
            Organization
          </MenuItem>

          <MenuItem href='/party' icon={<i className='ri-user-line' />}>
            Party
          </MenuItem>

          <MenuItem href='/sales' icon={<i className='ri-shopping-cart-line' />}>
            Sales
          </MenuItem>


          <MenuItem href='/adjustment' icon={<i className='ri-shopping-cart-line' />}>
            Create Adjustment
          </MenuItem>

          <MenuItem href='/adjustment_list' icon={<i className='ri-shopping-cart-line' />}>
            Adjustment List
          </MenuItem>


          <MenuItem href='/purchase' icon={<i className='ri-shopping-cart-line' />}>
            Purchase
          </MenuItem>

          <MenuItem href='/secondhand-goods-purchase' icon={<i className='ri-shopping-cart-line' />}>
            Second Hand Goods Purchase
          </MenuItem>

          <MenuItem href='/inventory-stock' icon={<i className='ri-shopping-cart-line' />}>
            Second Hand Goods Inventory
          </MenuItem>


          <MenuItem href='/secondhand-goods-sales' icon={<i className='ri-shopping-cart-line' />}>
            Second Hand Goods sale
          </MenuItem>


          <MenuItem href='/gst-statement' icon={<i className='ri-shopping-cart-line' />}>
           Gst Statement
          </MenuItem>

          <MenuItem href='/gst-statement' icon={<i className='ri-shopping-cart-line' />}>
           Gst Statement
          </MenuItem>



          {/* <MenuItem href='/account-settings' icon={<i className='ri-user-settings-line' />}>
            Account Settings
          </MenuItem> */}


          {/* <SubMenu label='Auth Pages' icon={<i className='ri-shield-keyhole-line' />}>
            <MenuItem href='/login' target='_blank'>
              Login
            </MenuItem>
            <MenuItem href='/register' target='_blank'>
              Register
            </MenuItem>
            <MenuItem href='/forgot-password' target='_blank'>
              Forgot Password
            </MenuItem>
          </SubMenu> */}


          {/* <SubMenu label='Miscellaneous' icon={<i className='ri-question-line' />}>
            <MenuItem href='/error' target='_blank'>
              Error
            </MenuItem>
            <MenuItem href='/under-maintenance' target='_blank'>
              Under Maintenance
            </MenuItem>
          </SubMenu> */}


          {/* <MenuItem href='/card-basic' icon={<i className='ri-bar-chart-box-line' />}>
            Cards
          </MenuItem> */}

        </MenuSection>


        {/* 
        <MenuSection label='Forms & Tables'>
          <MenuItem href='/form-layouts' icon={<i className='ri-layout-4-line' />}>
            Form Layouts
          </MenuItem>

          <MenuItem
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/form-elements`}
            icon={<i className='ri-radio-button-line' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            Form Elements
          </MenuItem>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/mui-table`}
            icon={<i className='ri-table-2' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            MUI Tables
          </MenuItem>
        </MenuSection> */}

      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
