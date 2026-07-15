import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import { theme } from './lib/theme'
import App from './App.jsx'
import './index.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider theme={theme} defaultColorScheme='light'>
        <App />
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>
)
