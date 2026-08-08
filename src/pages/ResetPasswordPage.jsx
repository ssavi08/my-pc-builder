import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container, Paper, Title, Text, PasswordInput, Button, Stack, Alert, Loader, Center,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { supabase } from '../lib/supabaseClient'

export default function ResetPasswordPage() {
    const navigate = useNavigate()

    const [ready, setReady] = useState(false)
    const [invalid, setInvalid] = useState(null)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // supabase-js parses the URL fragment on load and fires this
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setReady(true)
            }
        })

        // fallback: the event may already have fired before we subscribed
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setReady(true)
            } else {
                // give the library a moment to process the fragment
                setTimeout(() => {
                    supabase.auth.getSession().then(({ data }) => {
                        if (data.session) setReady(true)
                        else setInvalid('This reset link is invalid or has expired.')
                    })
                }, 1500)
            }
        })

        return () => sub.subscription.unsubscribe()
    }, [])

    const form = useForm({
        initialValues: { password: '', confirmPassword: '' },
        validate: {
            password: (value) =>
                value.length < 6 ? 'Password must be at least 6 characters' : null,
            confirmPassword: (value, values) =>
                value !== values.password ? 'Passwords do not match' : null,
        },
    })

    async function handleSubmit(values) {
        setError(null)
        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password: values.password })

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
            setTimeout(() => navigate('/'), 2000)
        }

        setLoading(false)
    }

    return (
        <Container size="xs" py="xl">
            <Paper withBorder shadow="sm" p="xl" radius="md">
                <Stack gap="md">
                    <Title order={2}>Reset password</Title>

                    {!ready && !invalid && (
                        <Center py="lg">
                            <Loader size="sm" />
                        </Center>
                    )}

                    {invalid && (
                        <>
                            <Alert color="red">{invalid}</Alert>
                            <Button variant="light" onClick={() => navigate('/')}>
                                Back to MyPCBuilder
                            </Button>
                        </>
                    )}

                    {success && (
                        <Alert color="green">
                            Password updated. Taking you back to the app...
                        </Alert>
                    )}

                    {ready && !success && (
                        <>
                            <Text size="sm" c="dimmed">
                                Choose a new password for your account.
                            </Text>

                            <form onSubmit={form.onSubmit(handleSubmit)}>
                                <Stack gap="sm">
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

                                    <Button type="submit" loading={loading} mt="xs" fullWidth>
                                        Update password
                                    </Button>
                                </Stack>
                            </form>
                        </>
                    )}
                </Stack>
            </Paper>
        </Container>
    )
}