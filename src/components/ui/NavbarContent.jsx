import { Group, Text, Button, Switch, Menu, useMantineColorScheme } from '@mantine/core'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'

export default function NavbarContent() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme()
    const user = useAuthStore((s) => s.user)
    const openModal = useUIStore((s) => s.openModal)

    return (
        <Group h="100%" px="md" justify="space-between">
            <Text
                component={Link}
                to="/"
                fw={700}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                MyPCBuilder
            </Text>

            <Group gap="xs">
                {user ? (
                    <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                            <Button variant="subtle" color="gray">Profile</Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item onClick={() => openModal('history')}>
                                Recent builds
                            </Menu.Item>
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

                <Switch
                    checked={colorScheme === 'dark'}
                    onChange={toggleColorScheme}
                    styles={{ track: { cursor: 'pointer' } }}
                />
            </Group>
        </Group>
    )
}