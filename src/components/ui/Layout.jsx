import { AppShell, Burger, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'
import NavbarContent from './NavbarContent'
import Sidebar from './Sidebar'

const burgerStyle = {
    position: 'fixed',
    top: 72,
    zIndex: 201,
    padding: 4,
    borderRadius: 'var(--mantine-radius-md)',
    background: 'var(--mantine-color-body)',
    boxShadow: 'var(--mantine-shadow-sm)',
    transition: 'left 200ms ease',
}

export default function Layout() {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)
    const { colorScheme } = useMantineColorScheme()

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 600,
                breakpoint: 'sm',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
            padding={0}
        >
            <AppShell.Header>
                <NavbarContent />
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <Sidebar />
            </AppShell.Navbar>

            <Burger
                visibleFrom="sm"
                opened={desktopOpened}
                onClick={toggleDesktop}
                size="sm"
                style={{
                    ...burgerStyle,
                    left: 'calc(var(--app-shell-navbar-offset, 0px) + 12px)',
                }}
            />

            <Burger
                hiddenFrom="sm"
                opened={mobileOpened}
                onClick={toggleMobile}
                size="sm"
                style={{ ...burgerStyle, right: 12 }}
            />

            <AppShell.Main
                bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}
                style={{ height: 'calc(100vh - var(--app-shell-header-offset, 0px))' }}
            >
                <Outlet />
            </AppShell.Main>
        </AppShell>
    )
}