// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'
import { Toaster } from 'sonner';

export const metadata = {
  title: 'iTaxPro - GST Made Simple',
  description:
    'iTaxPro - GST Made Simple',
  icons: [
    { rel: 'icon', url: '/logo.jpeg', type: 'image/jpeg' }
  ]
}

const RootLayout = ({ children }) => {
  // Vars
  const direction = 'ltr'

  return (
    <html id='__next' dir={direction}>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
       <Toaster richColors position="top-right" />
      {children}
      
      </body>
    </html>
  )
}

export default RootLayout
