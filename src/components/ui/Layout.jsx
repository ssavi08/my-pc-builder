import { AppShell, Burger, Group, Text, Switch, useMantineColorScheme, Button, Menu } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import AuthModal from './AuthModal'

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
    const { colorScheme, toggleColorScheme } = useMantineColorScheme()

    const user = useAuthStore((s) => s.user)
    const openModal = useUIStore((s) => s.openModal)

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
                <Group h="100%" px="md" justify="space-between">
                    <Text fw={700}>MyPCBuilder</Text>
                     <Group gap="xs">
                        {user ? (
                            <Menu shadow="md" width={200} position="bottom-end">
                                <Menu.Target>
                                    <Button variant="subtle" color="gray">Profile</Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Item onClick={() => openModal('saved-builds')}>
                                        Saved builds
                                    </Menu.Item>
                                    <Menu.Item onClick={() => openModal('account')}>
                                        Account
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item color="red" onClick={() => supabase.auth.signOut()}>
                                        Sign out
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        ) : (
                            <Button variant="subtle" color="gray" onClick={() => openModal('login')}>
                                Login
                            </Button>
                        )}

                        <Button component={Link} to="/about" variant="subtle" color="gray">
                            About
                        </Button>

                        <Switch checked={colorScheme === 'dark'} onChange={toggleColorScheme} />
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                Sidebar
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

            <AppShell.Main bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}>
                <Outlet />
            </AppShell.Main>

            <AuthModal />
        </AppShell>
    )
}