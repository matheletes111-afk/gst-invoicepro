// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper'

// Component Imports
import Providers from '@components/Providers'

export default async function UserLayout({ children }) {
  const direction = 'ltr'

  return (
    <Providers direction={direction}>
      <LayoutWrapper
        verticalLayout={
          <>
            {children}
          </>
        }
      />
    </Providers>
  )
}