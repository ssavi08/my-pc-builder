import { useState, useEffect } from 'react'
import { Modal, TextInput, PasswordInput, Button, Stack, Text, Anchor, Alert } from '@mantine/core'
import { useForm } from '@mantine/form'
import { supabase } from '../../lib/supabaseClient'
import { useUIStore } from '../../store/useUIStore'
import { authErrorMessage } from '../../lib/authErrors'

const AUTH_MODES = ['login', 'register', 'reset-request']

const TITLES = {
    login: 'Prijava',
    register: 'Otvaranje računa',
    'reset-request': 'Ponovno postavljanje lozinke',
}

const SUBMIT_LABELS = {
    login: 'Prijavi se',
    register: 'Otvori račun',
    'reset-request': 'Pošalji poveznicu',
}

export default function AuthModal(){
    const activeModal = useUIStore((s) => s.activeModal)
    const openModal = useUIStore((s) => s.openModal)
    const closeModal = useUIStore((s) => s.closeModal)

    const [mode, setMode] = useState('login')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)

    const opened = AUTH_MODES.includes(activeModal)

    useEffect(() => {
        if (AUTH_MODES.includes(activeModal)){
            setMode(activeModal)
            setError(null)
            form.clearErrors()
            setSuccess(null)
        }
    }, [activeModal])

    const form = useForm({
        initialValues: { email: '', password: '', confirmPassword: '' },
        validate: {
            email: (value) => /^\S+@\S+\.\S+$/.test(value) ? null : 'Neispravna e-mail adresa',

            password: (value) => {
                if (mode === 'reset-request') {
                    return null
                } else {
                    return value.length < 6 ? 'Lozinka mora imati barem 6 znakova' : null
                }
            },

            confirmPassword: (value, values) => {
                if (mode !== 'register') {
                    return null
                } else {
                    return value !== values.password ? 'Lozinke se ne podudaraju' : null
                }
            },
        },
    })

    async function handleSubmit(values) {
        setError(null)
        setSuccess(null)
        setLoading(true)

        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })
            if (error) {
                setError(authErrorMessage(error))
            } else {
                closeModal()
            }
        }

        if (mode === 'register') {
            const { error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
            })
            if (error) {
                setError(authErrorMessage(error))
            } else {
                closeModal()
            }
        }

        if (mode === 'reset-request') {
            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (error) {
                setError(authErrorMessage(error))
            } else {
                setSuccess('Poveznica je poslana. Provjerite svoju e-poštu.')
            }
        }

        setLoading(false)
    }

    return (
        <Modal
            opened={opened}
            onClose={closeModal}
            onExitTransitionEnd={() => {
                form.reset()
                setError(null)
                setSuccess(null)
            }}
            title={TITLES[mode]}
            centered
            size="sm"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    {error && <Alert color='red'>{error}</Alert>}
                    {success && <Alert color='blue'>{success}</Alert>}

                    <TextInput
                        label="E-mail adresa"
                        placeholder='vasa@eposta.com'
                        required
                        {...form.getInputProps('email')}
                    />

                    {mode !== 'reset-request' && (
                        <PasswordInput
                            label="Lozinka"
                            required
                            {...form.getInputProps('password')}
                        />
                    )}

                    {mode === 'register' && (
                        <PasswordInput
                            label="Potvrdite lozinku"
                            required
                            {...form.getInputProps('confirmPassword')}
                        />
                    )}

                    <Button type="submit" loading={loading} fullWidth mt="xs">
                        {SUBMIT_LABELS[mode]}
                    </Button>

                    {mode === 'login' && (
                        <Stack gap={4}>
                            <Text size="sm" ta="center" c="dimmed">
                                Nemate račun?{' '}
                                <Anchor component='button' type='button' size="sm" onClick={() => openModal('register')}>Otvorite ga</Anchor>
                            </Text>

                            <Text size="sm" ta="center" c="dimmed">
                                <Anchor component='button' type='button' size="sm" onClick={() => openModal('reset-request')}>Zaboravljena lozinka?</Anchor>
                            </Text>
                        </Stack>
                    )}

                    {mode !== 'login' && (
                       <Text size="sm" ta="center" c="dimmed">
                            Već imate račun?{' '}
                            <Anchor component="button" type="button" size="sm" onClick={() => openModal('login')}>
                                Prijavite se
                            </Anchor>
                        </Text> 
                    )}
                </Stack>
            </form>
        </Modal>
    )
}