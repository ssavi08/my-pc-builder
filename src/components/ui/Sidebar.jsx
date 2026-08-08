import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Stack, Select, Button, Alert, Text, Group, Divider,
    ScrollArea, ActionIcon, Accordion, Badge, Loader, Switch,
} from '@mantine/core'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { useBuildParts } from '../../lib/useBuildParts'
import { MAX_FANS_AIR, MAX_FANS_AIO, BUDGET_TIERS } from '../../lib/constants'

const SLOT_ORDER = ['case', 'motherboard', 'cpu', 'cooler', 'gpu', 'ram', 'storage', 'psu', 'fan']

export default function Sidebar() {
    const [purpose, setPurpose] = useState('gaming')
    const [budget, setBudget] = useState(1200)

    const user = useAuthStore((s) => s.user)
    const openModal = useUIStore((s) => s.openModal)
    const panelsVisible = useUIStore((s) => s.panelsVisible)
    const togglePanels = useUIStore((s) => s.togglePanels)
    const queryClient = useQueryClient()

    const componentIds = useBuildStore((s) => s.componentIds)
    const originalComponentIds = useBuildStore((s) => s.originalComponentIds)
    const fanCount = useBuildStore((s) => s.fanCount)
    const reasoning = useBuildStore((s) => s.reasoning)
    const generating = useBuildStore((s) => s.generating)
    const setBuild = useBuildStore((s) => s.setBuild)
    const setFanCount = useBuildStore((s) => s.setFanCount)
    const clearBuild = useBuildStore((s) => s.clearBuild)
    const resetToOriginal = useBuildStore((s) => s.resetToOriginal)
    const setGenerating = useBuildStore((s) => s.setGenerating)

    const { data: parts } = useBuildParts(componentIds)
    const maxFans = parts?.cooler?.coolerType === 'aio' ? MAX_FANS_AIO : MAX_FANS_AIR

    const budgetOptions = useMemo(
        () => BUDGET_TIERS.filter((t) => t.purposes.includes(purpose)),
        [purpose]
    )

    const hasSwaps = useMemo(() => {
        if (!componentIds || !originalComponentIds) return false
        return componentIds.some((id, i) => id !== originalComponentIds[i])
    }, [componentIds, originalComponentIds])

    function handlePurposeChange(next) {
        setPurpose(next)
        const allowed = BUDGET_TIERS.filter((t) => t.purposes.includes(next))
        const max = Number(allowed[allowed.length - 1].value)
        if (budget > max) setBudget(max)
    }

    const liveTotal = useMemo(() => {
        if (!parts) return null

        let sum = 0

        for (const [slot, entry] of Object.entries(parts)) {
            if (slot === 'fan') continue
            const items = (Array.isArray(entry) ? entry : [entry]).filter((p) => p?.price != null)
            for (const p of items) sum += Number(p.price)
        }

        const fan = parts.fan?.[0]
        if (fan?.price != null) sum += Number(fan.price) * fanCount

        return sum
    }, [parts, fanCount])

    const generate = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('generate-build', {
                body: { purpose, budget },
            })

            if (error) {
                const status = error.context?.status
                const body = await error.context?.json().catch(() => null)

                let message
                if (status === 402) message = 'You have no credits left.'
                else if (status === 401) message = 'Your session expired. Please log in again.'
                else if (status === 400) message = body?.error ?? 'Invalid request.'
                else message = 'The AI made a mistake building your PC. Please try again — your credit was not spent.'

                const err = new Error(message)
                err.details = body?.details ?? null
                throw err
            }

            return data
        },
        onMutate: () => {
            clearBuild()
            setGenerating(true)
        },
        onError: () => {
            clearBuild()
        },
        onSettled: () => {
            setGenerating(false)
        },
        onSuccess: (data) => {
            setBuild(data)
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
        },
    })

    const busy = generate.isPending || generating

    return (
        <Stack h="100%" gap="md">
            <Select
                label="Purpose"
                value={purpose}
                onChange={handlePurposeChange}
                allowDeselect={false}
                data={[
                    { value: 'school', label: 'School' },
                    { value: 'work', label: 'Work' },
                    { value: 'gaming', label: 'Gaming' },
                ]}
            />

            <Select
                label="Budget"
                value={String(budget)}
                onChange={(v) => setBudget(Number(v))}
                allowDeselect={false}
                maxDropdownHeight={280}
                data={budgetOptions}
            />

            {!user ? (
                <Button onClick={() => openModal('login')}>Log in to generate</Button>
            ) : (
                <Button
                    onClick={() => generate.mutate()}
                    loading={busy}
                    disabled={busy}
                >
                    Generate build
                </Button>
            )}

            {generate.isError && (
                <Alert color="red" title="Generation failed">
                    <Text size="sm">{generate.error.message}</Text>

                    {generate.error.details?.length > 0 && (
                        <Accordion variant="filled" mt="xs">
                            <Accordion.Item value="why">
                                <Accordion.Control px={0}>
                                    <Text size="xs">Why did this happen?</Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap={4}>
                                        {generate.error.details.map((d, i) => (
                                            <Text key={i} size="xs" c="dimmed">{d}</Text>
                                        ))}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    )}
                </Alert>
            )}

            {componentIds && (
                <>
                    <Divider />

                    <Group justify="space-between">
                        <Text fw={600}>Total</Text>
                        <Badge size="lg" variant="light" color={liveTotal > budget ? 'red' : 'blue'}>
                            {liveTotal?.toFixed(2)} EUR
                        </Badge>
                    </Group>

                    {hasSwaps && (
                        <Group justify="space-between" wrap="nowrap">
                            <Text size="xs" c="dimmed">Build modified</Text>
                            <Button size="compact-xs" variant="subtle" onClick={resetToOriginal}>
                                Reset to AI build
                            </Button>
                        </Group>
                    )}

                    <Divider />

                    <Group justify="space-between">
                        <Text size="sm">Case fans</Text>
                        <Group gap="xs">
                            <ActionIcon
                                variant="default"
                                onClick={() => setFanCount(fanCount - 1)}
                                disabled={fanCount <= 0}
                            >−</ActionIcon>
                            <Text size="sm" w={20} ta="center">{fanCount}</Text>
                            <ActionIcon
                                variant="default"
                                onClick={() => setFanCount(Math.min(fanCount + 1, maxFans))}
                                disabled={fanCount >= maxFans}
                            >+</ActionIcon>
                        </Group>
                    </Group>

                    {fanCount === 0 && (
                        <Text size="xs" c="dimmed" mt={-8}>Add fans to improve airflow</Text>
                    )}

                    <Divider />

                    <Group justify="space-between">
                        <Text size="sm">Side panels</Text>
                        <Switch
                            checked={panelsVisible}
                            onChange={togglePanels}
                            styles={{ track: { cursor: 'pointer' } }}
                        />
                    </Group>

                    <Divider />

                    <ScrollArea style={{ flex: 1 }} type="auto">
                        <Stack gap="xs">
                            {parts ? (
                                SLOT_ORDER.flatMap((slot) => {
                                    const entry = parts[slot]
                                    if (!entry) return []

                                    const items = (Array.isArray(entry) ? entry : [entry])
                                        .filter((p) => p?.id)

                                    return items.map((p) => {
                                        const swapped = originalComponentIds
                                            && !originalComponentIds.includes(p.id)

                                        return (
                                            <Group key={p.id} justify="space-between" wrap="nowrap">
                                                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                                                    <Text size="sm" lineClamp={1}>{p.name}</Text>
                                                    {swapped && (
                                                        <Badge size="xs" variant="light" color="orange">
                                                            swapped
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                                    {Number(p.price).toFixed(2)} €
                                                </Text>
                                            </Group>
                                        )
                                    })
                                })
                            ) : (
                                <Loader size="sm" />
                            )}

                            {reasoning && (
                                <Accordion variant="contained" mt="md">
                                    <Accordion.Item value="reasoning">
                                        <Accordion.Control>Why these parts?</Accordion.Control>
                                        <Accordion.Panel>
                                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                {reasoning}
                                            </Text>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                </Accordion>
                            )}
                        </Stack>
                    </ScrollArea>
                </>
            )}
        </Stack>
    )
}