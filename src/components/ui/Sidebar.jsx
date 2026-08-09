import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Stack, Select, Button, Alert, Text, Group, Divider, Box,
    ScrollArea, ActionIcon, Accordion, Badge, Loader, Switch, UnstyledButton,
} from '@mantine/core'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { useBuildParts } from '../../lib/useBuildParts'
import { MAX_FANS_AIR, MAX_FANS_AIO, BUDGET_TIERS } from '../../lib/constants'

const SLOT_ORDER = ['case', 'motherboard', 'cpu', 'cooler', 'gpu', 'ram', 'storage', 'psu', 'fan']

// An open accordion item grows to fill the sidebar; collapsed ones stay at
// header height. minHeight:0 is required — flex children refuse to shrink
// below content size without it, which would break the panel's scrolling.
const FILL = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }

export default function Sidebar() {
    const [purpose, setPurpose] = useState('gaming')
    const [budget, setBudget] = useState(1200)
    const [openSection, setOpenSection] = useState('generate')

    const user = useAuthStore((s) => s.user)
    const openModal = useUIStore((s) => s.openModal)
    const panelsVisible = useUIStore((s) => s.panelsVisible)
    const togglePanels = useUIStore((s) => s.togglePanels)
    const queryClient = useQueryClient()

    const componentIds = useBuildStore((s) => s.componentIds)
    const fanCount = useBuildStore((s) => s.fanCount)
    const generating = useBuildStore((s) => s.generating)
    const setBuild = useBuildStore((s) => s.setBuild)
    const setFanCount = useBuildStore((s) => s.setFanCount)
    const clearBuild = useBuildStore((s) => s.clearBuild)
    const setGenerating = useBuildStore((s) => s.setGenerating)

    const { data: parts } = useBuildParts(componentIds)
    const maxFans = parts?.cooler?.coolerType === 'aio' ? MAX_FANS_AIO : MAX_FANS_AIR

    const budgetOptions = useMemo(
        () => BUDGET_TIERS.filter((t) => t.purposes.includes(purpose)),
        [purpose]
    )

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

    function handlePurposeChange(next) {
        setPurpose(next)
        const allowed = BUDGET_TIERS.filter((t) => t.purposes.includes(next))
        const max = Number(allowed[allowed.length - 1].value)
        if (budget > max) setBudget(max)
    }

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
            setOpenSection('generate')
        },
        onSettled: () => setGenerating(false),
        onSuccess: (data) => {
            setBuild(data)
            setOpenSection('build')
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
        },
    })

    const busy = generate.isPending || generating

    return (
        <Stack h="100%" gap={0}>
            <Accordion
                value={openSection}
                onChange={setOpenSection}
                variant="separated"
                style={FILL}
                styles={{ item: { overflow: 'hidden' } }}
            >
                <Section value="generate" label="Generate build" open={openSection}>
                    <Stack gap="md">
                        <Text size="xs" c="dimmed">
                            Pick the purpose you will use this computer for and how much you want to
                            spend. The AI will build you a compatible PC.
                        </Text>

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
                            <Button onClick={() => generate.mutate()} loading={busy} disabled={busy}>
                                Generate build
                            </Button>
                        )}

                        {generate.isError && (
                            <Alert color="red" title="Generation failed">
                                <Text size="sm">{generate.error.message}</Text>
                                {generate.error.details?.length > 0 && (
                                    <Stack gap={4} mt="xs">
                                        {generate.error.details.map((d, i) => (
                                            <Text key={i} size="xs" c="dimmed">{d}</Text>
                                        ))}
                                    </Stack>
                                )}
                            </Alert>
                        )}
                    </Stack>
                </Section>

                {componentIds && (
                    <Section value="build" label="Build" open={openSection}>
                        <BuildList parts={parts} />
                    </Section>
                )}

                {componentIds && (
                    <Section value="modify" label="Modify" open={openSection}>
                        <Stack gap="md">
                            <Stack gap={4}>
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
                                    <Text size="xs" c="dimmed">Add fans to improve airflow</Text>
                                )}
                            </Stack>

                            <Divider />

                            <Group justify="space-between">
                                <Text size="sm">Side panels</Text>
                                <Switch
                                    checked={panelsVisible}
                                    onChange={togglePanels}
                                    styles={{ track: { cursor: 'pointer' } }}
                                />
                            </Group>
                        </Stack>
                    </Section>
                )}
            </Accordion>

            {componentIds && (
                <Stack
                    gap="xs"
                    pt="md"
                    mt="md"
                    style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
                >
                    <Group justify="space-between">
                        <Text fw={600}>Total</Text>
                        <Badge size="lg" variant="light" color={liveTotal > budget ? 'red' : 'blue'}>
                            {liveTotal?.toFixed(2)} EUR
                        </Badge>
                    </Group>

                    <Button fullWidth variant="light" disabled>
                        Save build
                    </Button>
                </Stack>
            )}
        </Stack>
    )
}

/**
 * One accordion section. Grows to fill the sidebar when open, and gives its
 * children a single scroll region — never nested.
 */
function Section({ value, label, open, children }) {
    const isOpen = open === value

    return (
        <Accordion.Item value={value} style={isOpen ? FILL : undefined}>
            <Accordion.Control>
                <Text fw={600}>{label}</Text>
            </Accordion.Control>

            <Accordion.Panel style={FILL} styles={{ content: { ...FILL, padding: 0 } }}>
                <ScrollArea h="100%" type="auto" offsetScrollbars px="xs" pb="xs">
                    {children}
                </ScrollArea>
            </Accordion.Panel>
        </Accordion.Item>
    )
}

function BuildList({ parts }) {
    const selectComponent = useUIStore((s) => s.selectComponent)
    const reasoning = useBuildStore((s) => s.reasoning)
    const componentIds = useBuildStore((s) => s.componentIds)
    const originalComponentIds = useBuildStore((s) => s.originalComponentIds)
    const resetToOriginal = useBuildStore((s) => s.resetToOriginal)

    const hasSwaps = useMemo(() => {
        if (!componentIds || !originalComponentIds) return false
        return componentIds.some((id, i) => id !== originalComponentIds[i])
    }, [componentIds, originalComponentIds])

    if (!parts) return <Loader size="sm" />

    return (
        <Stack gap="xs">
            {hasSwaps && (
                <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed">Build modified</Text>
                    <Button size="compact-xs" variant="subtle" onClick={resetToOriginal}>
                        Reset to AI build
                    </Button>
                </Group>
            )}

            {SLOT_ORDER.flatMap((slot) => {
                const entry = parts[slot]
                if (!entry) return []

                if (slot === 'fan') {
                    const fan = Array.isArray(entry) ? entry[0] : entry
                    if (!fan?.id || !fanCount) return []

                    return [(
                        <Group key={fan.id} justify="space-between" wrap="nowrap">
                            <UnstyledButton onClick={() => selectComponent(fan.id)} style={{ minWidth: 0, flex: 1 }}>
                                <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }}>
                                    {fan.name} ×{fanCount}
                                </Text>
                            </UnstyledButton>
                            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                {(Number(fan.price) * fanCount).toFixed(2)} €
                            </Text>
                        </Group>
                    )]
                }
                const items = (Array.isArray(entry) ? entry : [entry]).filter((p) => p?.id)

                return items.map((p) => (
                    <Group key={p.id} justify="space-between" wrap="nowrap">
                        <UnstyledButton
                            onClick={() => selectComponent(p.id)}
                            style={{ minWidth: 0, flex: 1 }}
                        >
                            <Group gap={6} wrap="nowrap">
                                <Text size="sm" lineClamp={1} style={{ cursor: 'pointer' }}>
                                    {p.name}
                                </Text>
                                {originalComponentIds && !originalComponentIds.includes(p.id) && (
                                    <Badge size="xs" variant="light" color="orange">swapped</Badge>
                                )}
                            </Group>
                        </UnstyledButton>

                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {Number(p.price).toFixed(2)} €
                        </Text>
                    </Group>
                ))
            })}

            {reasoning && (
                <>
                    <Divider mt="xs" />
                    <Accordion variant="filled" chevronPosition="left">
                        <Accordion.Item value="reasoning">
                            <Accordion.Control px={0}>
                                <Text size="sm">Why these parts?</Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                    {reasoning}
                                </Text>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </>
            )}
        </Stack>
    )
}