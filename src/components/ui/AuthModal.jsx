import { useState, useEffect } from 'react'
import { Modal, TextInput, PasswordInput, Button, Stack, Text, Anchor, Alert } from '@mantine/core'
import { useForm } from '@mantine/form'
import { supabase } from '../../lib/supabaseClient'
import { useUIStore } from '../../store/useUIStore'

const AUTH_MODES = ['login', 'register', 'reset-request']

const TITLES = {
    login: 'Log in',
    register: 'Create account',
    'reset-request': 'Reset password',
}

const SUBMIT_LABELS = {
    login: 'Log in',
    register: 'Create account',
    'reset-request': 'Send reset link',
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
            email: (value) => /^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email address',

            password: (value) => {
                if (mode === 'reset-request') {
                    return null
                } else {
                    return value.length < 6 ? 'Password must be at least 6 characters' : null
                }
            },

            confirmPassword: (value, values) => {
                if (mode !== 'register') {
                    return null
                } else {
                    return value !== values.password ? 'Passwords do not match' : null
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
                setError(error.message)
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
                setError(error.message)
            } else {
                closeModal()
            }
        }

        if (mode === 'reset-request') {
            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (error) {
                setError(error.message)
            } else {
                setSuccess('Reset link sent. Check your email.')
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
                        label="Email"
                        placeholder='your@email.com'
                        required
                        {...form.getInputProps('email')}
                    />

                    {mode !== 'reset-request' && (
                        <PasswordInput
                            label="Password"
                            required
                            {...form.getInputProps('password')}
                        />
                    )}

                    {mode === 'register' && (
                        <PasswordInput
                            label="Confirm password"
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
                                No account yet?{' '}
                                <Anchor component='button' type='button' size="sm" onClick={() => openModal('register')}>Create one</Anchor>
                            </Text>

                            <Text size="sm" ta="center" c="dimmed">
                                <Anchor component='button' type='button' size="sm" onClick={() => openModal('reset-request')}>Forgot password?</Anchor>
                            </Text>
                        </Stack>
                    )}

                    {mode !== 'login' && (
                       <Text size="sm" ta="center" c="dimmed">
                            Already have an account?{' '}
                            <Anchor component="button" type="button" size="sm" onClick={() => openModal('login')}>
                                Log in
                            </Anchor>
                        </Text> 
                    )}
                </Stack>
            </form>
        </Modal>
    )
}