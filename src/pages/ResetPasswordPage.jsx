import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container, Paper, Title, Text, PasswordInput, Button, Stack, Alert, Loader, Center,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { supabase } from '../lib/supabaseClient'
import { authErrorMessage } from '../lib/authErrors'

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
                        else setInvalid('Ova poveznica je neispravna ili je istekla.')
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
                value.length < 6 ? 'Lozinka mora imati barem 6 znakova' : null,
            confirmPassword: (value, values) =>
                value !== values.password ? 'Lozinke se ne podudaraju' : null,
        },
    })

    async function handleSubmit(values) {
        setError(null)
        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password: values.password })

        if (error) {
            setError(authErrorMessage(error))
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
                    <Title order={2}>Postavljanje nove lozinke</Title>

                    {!ready && !invalid && (
                        <Center py="lg">
                            <Loader size="sm" />
                        </Center>
                    )}

                    {invalid && (
                        <>
                            <Alert color="red">{invalid}</Alert>
                            <Button variant="light" onClick={() => navigate('/')}>
                                Natrag na MyPCBuilder
                            </Button>
                        </>
                    )}

                    {success && (
                        <Alert color="green">
                            Lozinka je promijenjena. Vraćamo vas u aplikaciju...
                        </Alert>
                    )}

                    {ready && !success && (
                        <>
                            <Text size="sm" c="dimmed">
                                Odaberite novu lozinku za svoj račun.
                            </Text>

                            <form onSubmit={form.onSubmit(handleSubmit)}>
                                <Stack gap="sm">
                                    {error && <Alert color="red">{error}</Alert>}

                                    <PasswordInput
                                        label="Nova lozinka"
                                        required
                                        {...form.getInputProps('password')}
                                    />
                                    <PasswordInput
                                        label="Potvrdite novu lozinku"
                                        required
                                        {...form.getInputProps('confirmPassword')}
                                    />

                                    <Button type="submit" loading={loading} mt="xs" fullWidth>
                                        Postavi lozinku
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