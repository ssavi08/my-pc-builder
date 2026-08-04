import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Stack, Select, NumberInput, Button, Alert, Text, Group, Divider,
    ScrollArea, ActionIcon, Accordion, Badge, Loader,
} from '@mantine/core'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { useBuildParts } from '../../lib/useBuildParts'

const SLOT_ORDER = ['case', 'motherboard', 'cpu', 'cooler', 'gpu', 'ram', 'storage', 'psu', 'fan']

export default function Sidebar() {
    const [purpose, setPurpose] = useState('gaming')
    const [budget, setBudget] = useState(1200)

    const user = useAuthStore((s) => s.user)
    const openModal = useUIStore((s) => s.openModal)
    const queryClient = useQueryClient()

    const componentIds = useBuildStore((s) => s.componentIds)
    const fanCount = useBuildStore((s) => s.fanCount)
    const reasoning = useBuildStore((s) => s.reasoning)
    const totalPrice = useBuildStore((s) => s.totalPrice)
    const setBuild = useBuildStore((s) => s.setBuild)
    const setFanCount = useBuildStore((s) => s.setFanCount)
    const clearBuild = useBuildStore((s) => s.clearBuild)

    const { data: parts } = useBuildParts(componentIds)

    const liveTotal = useMemo(() => {
        if (!parts) return null

        let sum = 0

        for (const [slot, entry] of Object.entries(parts)) {
            if (slot === 'fan') continue
            const items = Array.isArray(entry) ? entry : [entry]
            for (const p of items) sum += Number(p.price)
        }

        const fan = parts.fan?.[0]
        if (fan) sum += Number(fan.price) * fanCount

        return sum
    }, [parts, fanCount])

    const generate = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('generate-build', {
                body: { purpose, budget },
            })
            if (error) {
                const body = await error.context?.json().catch(() => null)
                throw new Error(body?.details?.join('; ') ?? body?.error ?? error.message)
            }
            return data
        },
        onMutate: () => {
            clearBuild()
        },
        onSuccess: (data) => {
            setBuild(data)
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
        },
    })

    return (
        <Stack h="100%" gap="md">
            <Select
                label="Purpose"
                value={purpose}
                onChange={setPurpose}
                allowDeselect={false}
                data={[
                    { value: 'school', label: 'School' },
                    { value: 'work', label: 'Work' },
                    { value: 'gaming', label: 'Gaming' },
                ]}
            />

            <NumberInput
                label="Budget (EUR)"
                value={budget}
                onChange={setBudget}
                min={550}
                max={10000}
                step={50}
                clampBehavior="strict"
            />

            {!user ? (
                <Button onClick={() => openModal('login')}>Log in to generate</Button>
            ) : (
                <Button
                    onClick={() => generate.mutate()}
                    loading={generate.isPending}
                    disabled={generate.isPending}
                >
                    Generate build
                </Button>
            )}

            {generate.isError && (
                <Alert color="red" title="Generation failed">
                    {generate.error.message}
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
                                onClick={() => setFanCount(fanCount + 1)}
                                disabled={fanCount >= 6}
                            >+</ActionIcon>
                        </Group>
                    </Group>

                    <Divider />

                    <ScrollArea style={{ flex: 1 }} type="auto">
                        <Stack gap="xs">
                            {parts ? (
                                SLOT_ORDER.flatMap((slot) => {
                                    const entry = parts[slot]
                                    if (!entry) return []
                                    const items = Array.isArray(entry) ? entry : [entry]
                                    return items.map((p) => (
                                        <Group key={p.id} justify="space-between" wrap="nowrap">
                                            <Text size="sm" lineClamp={1}>{p.name}</Text>
                                            <Text size="sm" c="dimmed">{Number(p.price).toFixed(2)}</Text>
                                        </Group>
                                    ))
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