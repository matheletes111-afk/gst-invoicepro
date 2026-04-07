// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding process...')

  // Define modules with their menus
  const modulesWithMenus = [
    {
      moduleName: 'Masters',
      moduleDescription: 'Master data management for various entities',
      menus: [
        { menuName: 'Unit', menuEndPoint: '/unit', menuDescription: 'Manage units of measurement' },
        { menuName: 'Dzongkhag', menuEndPoint: '/dzongkhag', menuDescription: 'Manage dzongkhags/districts' },
        { menuName: 'Gewog', menuEndPoint: '/gewog', menuDescription: 'Manage gewogs/blocks' },
        { menuName: 'Village', menuEndPoint: '/village', menuDescription: 'Manage villages' },
        { menuName: 'GST Rate Slabs', menuEndPoint: '/gst-rate-slabs', menuDescription: 'Manage GST rate slabs' },
        { menuName: 'GST Rate', menuEndPoint: '/gst-rate', menuDescription: 'Manage GST rates' },
        { menuName: 'Map GST Rates', menuEndPoint: '/map-gst-rates', menuDescription: 'Map GST rates to items' },
        { menuName: 'Currency', menuEndPoint: '/currency', menuDescription: 'Manage currencies' },
        { menuName: 'Exchange Rate Master', menuEndPoint: '/exchange-rate', menuDescription: 'Manage exchange rates' },
        { menuName: 'Service Catalog', menuEndPoint: '/service-cataloge', menuDescription: 'Manage service catalog' },
        { menuName: 'Goods Catalog', menuEndPoint: '/goods-catalog', menuDescription: 'Manage goods catalog' },
        { menuName: 'Supplier Master', menuEndPoint: '/supplier', menuDescription: 'Manage suppliers' },
        { menuName: 'Dealer Master', menuEndPoint: '/dealer', menuDescription: 'Manage dealers' },
        { menuName: 'Organization', menuEndPoint: '/organization', menuDescription: 'Manage organizations' },
        { menuName: 'Party', menuEndPoint: '/party', menuDescription: 'Manage parties/customers' }
      ]
    },
    {
      moduleName: 'Invoice Management',
      moduleDescription: 'Invoice and transaction management',
      menus: [
        { menuName: 'Sales', menuEndPoint: '/sales/create', menuDescription: 'Create sales invoices' },
        { menuName: 'Sales List', menuEndPoint: '/sales', menuDescription: 'List of sales invoices' },
        { menuName: 'Create Adjustment', menuEndPoint: '/adjustment', menuDescription: 'Create adjustments' },
        { menuName: 'Adjustment List', menuEndPoint: '/adjustment_list', menuDescription: 'View adjustments list' },
        { menuName: 'Purchase', menuEndPoint: '/purchase', menuDescription: 'Manage purchases' }
      ]
    },
    {
      moduleName: 'Second Hand Invoicing',
      moduleDescription: 'Second hand goods management',
      menus: [
        { menuName: 'Second Hand Goods Purchase', menuEndPoint: '/secondhand-goods-purchase', menuDescription: 'Purchase second hand goods' },
        { menuName: 'Second Hand Goods Inventory', menuEndPoint: '/inventory-stock', menuDescription: 'Manage second hand goods inventory' },
        { menuName: 'Second Hand Goods sale', menuEndPoint: '/secondhand-goods-sales', menuDescription: 'Sell second hand goods' }
      ]
    },
    {
      moduleName: 'Report Module',
      moduleDescription: 'Reports and analytics',
      menus: [
        { menuName: 'Gst Statement', menuEndPoint: '/gst-statement', menuDescription: 'View GST statements' },
        { menuName: 'Sales Register Report', menuEndPoint: '/reports/sales-register', menuDescription: 'Sales register report' },
        { menuName: 'Item-Wise Sales Summary', menuEndPoint: '/reports/item-wise-sales-summary', menuDescription: 'Item-wise sales summary' },
        { menuName: 'Customer-Wise Sales Report', menuEndPoint: '/reports/customer-sale-report', menuDescription: 'Customer-wise sales report' },
        { menuName: 'Sales Order vs. Invoice Report', menuEndPoint: '/reports/sales-orders', menuDescription: 'Sales order vs invoice report' },
        { menuName: 'GST Summary Report', menuEndPoint: '/reports/gst-summary', menuDescription: 'GST summary report' },
        { menuName: 'Sales Invoice Activity Report', menuEndPoint: '/reports/invoice-sales-activity-logs', menuDescription: 'Sales invoice activity report' },
        { menuName: 'User Activity Log', menuEndPoint: '/reports/user-activity-log', menuDescription: 'User activity log' },
        { menuName: 'Data Change Log', menuEndPoint: '/reports/data-change', menuDescription: 'Data change log' },
        { menuName: 'Top Customers / Products Report', menuEndPoint: '/reports/top-performing', menuDescription: 'Top customers and products report' },
        { menuName: 'GST Collection Trend Analysis', menuEndPoint: '/reports/gst-trend-analysis', menuDescription: 'GST collection trend analysis' }
      ]
    }
  ]

  console.log('📊 Processing modules and menus...')

  // Process each module
  for (const moduleData of modulesWithMenus) {
    // Create or get module
    const module = await prisma.menuModules.upsert({
      where: { moduleName: moduleData.moduleName },
      update: {
        moduleDescription: moduleData.moduleDescription // Update description if module exists
      },
      create: {
        moduleName: moduleData.moduleName,
        moduleDescription: moduleData.moduleDescription
      }
    })

    console.log(`\n📁 Processing module: ${module.moduleName}`)

    // Get existing menus for this module
    const existingMenus = await prisma.menuMaster.findMany({
      where: { moduleId: module.id },
      select: { menuName: true, menuEndPoint: true }
    })

    const existingMenuMap = new Map(
      existingMenus.map(menu => [menu.menuName, menu])
    )

    // Process each menu
    for (const menu of moduleData.menus) {
      const existingMenu = existingMenuMap.get(menu.menuName)

      if (!existingMenu) {
        // Create new menu
        await prisma.menuMaster.create({
          data: {
            moduleId: module.id,
            menuName: menu.menuName,
            menuEndPoint: menu.menuEndPoint,
            menuDescription: menu.menuDescription
          }
        })
        console.log(`  ✅ Created menu: ${menu.menuName} (${menu.menuEndPoint})`)
      } else if (existingMenu.menuEndPoint !== menu.menuEndPoint) {
        // Update menu if endpoint changed
        await prisma.menuMaster.update({
          where: {
            id: existingMenu.id // You'll need the actual ID, this is simplified
          },
          data: {
            menuEndPoint: menu.menuEndPoint,
            menuDescription: menu.menuDescription
          }
        })
        console.log(`  🔄 Updated menu: ${menu.menuName} (${menu.menuEndPoint})`)
      } else {
        console.log(`  ⏭️ Menu already exists: ${menu.menuName}`)
      }
    }
  }

  // Display summary
  console.log('\n📊 Seeding Summary:')
  console.log('==================')

  const allModules = await prisma.menuModules.findMany({
    include: {
      menus: {
        orderBy: {
          menuName: 'asc'
        }
      }
    },
    orderBy: {
      moduleName: 'asc'
    }
  })

  for (const module of allModules) {
    console.log(`\n📁 ${module.moduleName}:`)
    console.log(`   Description: ${module.moduleDescription}`)
    console.log(`   Total Menus: ${module.menus.length}`)
    
    // Group menus by first letter for better visualization
    const menusByLetter = new Map()
    module.menus.forEach(menu => {
      const firstLetter = menu.menuName[0].toUpperCase()
      if (!menusByLetter.has(firstLetter)) {
        menusByLetter.set(firstLetter, [])
      }
      menusByLetter.get(firstLetter).push(menu)
    })

    // Display menus
    for (const [letter, menus] of Array.from(menusByLetter.entries()).sort()) {
      console.log(`   ${letter}:`)
      menus.forEach(menu => {
        console.log(`     - ${menu.menuName} (${menu.menuEndPoint})`)
      })
    }
  }

  // Statistics
  const totalModules = allModules.length
  const totalMenus = allModules.reduce((acc, module) => acc + module.menus.length, 0)

  console.log('\n📈 Final Statistics:')
  console.log(`   Total Modules: ${totalModules}`)
  console.log(`   Total Menus: ${totalMenus}`)
  console.log('\n✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })