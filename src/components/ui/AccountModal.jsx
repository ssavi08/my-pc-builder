import { useState } from 'react'
import { Modal, Stack, Group, Text, Badge, Divider, Loader, PasswordInput, Button, Alert, Collapse, Anchor } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useProfile } from '../../lib/useProfile'

export default function AccountModal() {
    const activeModal = useUIStore((s) => s.activeModal)
    const closeModal = useUIStore((s) => s.closeModal)
    const user = useAuthStore((s) => s.user)

    const { data: profile, isLoading, isError } = useProfile()

    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)
    const [formOpened, { toggle: toggleForm, close: closeForm }] = useDisclosure(false)

    const form = useForm({
        initialValues: { password: '', confirmPassword: '' },
        validate: {
            password: (value) => value.length < 6 ? 'Password must be at least 6 characters' : null,
            confirmPassword: (value, values) => value !== values.password ? 'Passwords do not match' : null,
        },
    })

    function handleCancel() {
        closeForm()
        form.reset()
        setError(null)
    }

    async function handleUpdatePassword(values) {
        setError(null)
        setSuccess(null)
        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password: values.password })

        if (error) {
            setError(error.message)
        } else {
            setSuccess('Password updated.')
            form.reset()
            closeForm()
        }

        setLoading(false)
    }

    return (
        <Modal
            opened={activeModal === 'account'}
            onClose={closeModal}
            onExitTransitionEnd={() => {
                form.reset()
                closeForm()
                setError(null)
                setSuccess(null)
            }}
            title="Account"
            centered
            size="sm"
        >
            <Stack gap="lg">
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Email</Text>
                        <Text size="sm">{user?.email}</Text>
                    </Group>

                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Credits</Text>
                        {isLoading && <Loader size="xs" />}
                        {isError && <Text size="sm" c="red">Failed to load</Text>}
                        {profile && <Badge variant="light">{profile.credits}</Badge>}
                    </Group>
                </Stack>

                <Divider />

                <Stack gap="xs">
                    <Anchor component="button" type="button" size="sm" fw={600} onClick={toggleForm} style={{ alignSelf: 'flex-start' }}>
                        Update password
                    </Anchor>

                    {success && <Alert color="blue">{success}</Alert>}

                    <Collapse expanded={formOpened}>
                        <form onSubmit={form.onSubmit(handleUpdatePassword)}>
                            <Stack gap="xs">
                                {error && <Alert color="red">{error}</Alert>}

                                <PasswordInput
                                    label="New password"
                                    required
                                    {...form.getInputProps('password')}
                                />
                                <PasswordInput
                                    label="Confirm new password"
                                    required
                                    {...form.getInputProps('confirmPassword')}
                                />

                                <Group justify="flex-end" mt="xs">
                                    <Button variant="default" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={loading}>
                                        Update password
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Collapse>
                </Stack>
            </Stack>
        </Modal>
    )
}