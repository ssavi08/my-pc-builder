import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Stack, Select, Button, Alert, Text, Group, Divider,
    ScrollArea, ActionIcon, Accordion, Badge, Loader, UnstyledButton, TextInput,
} from '@mantine/core'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { useBuildParts } from '../../lib/useBuildParts'
import { useSaveBuild, useUpdateBuild  } from '../../lib/useSaveBuild'
import { MAX_FANS_AIR, MAX_FANS_AIO, BUDGET_TIERS, PURPOSES, PURPOSE_LABELS } from '../../lib/constants'

const SLOT_ORDER = ['case', 'motherboard', 'cpu', 'cooler', 'gpu', 'ram', 'storage', 'psu', 'fan']

// An open accordion item grows to fill the sidebar; collapsed ones stay at
// header height. minHeight:0 is required — flex children refuse to shrink
// below content size without it, which would break the panel's scrolling.
const FILL = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }

export default function Sidebar() {
    const [openSection, setOpenSection] = useState('generate')
    const [naming, setNaming] = useState(false)
    const [buildName, setBuildName] = useState('')

    const user = useAuthStore((s) => s.user)
    const openModal = useUIStore((s) => s.openModal)
    const queryClient = useQueryClient()

    const componentIds = useBuildStore((s) => s.componentIds)
    const fanCount = useBuildStore((s) => s.fanCount)
    const generating = useBuildStore((s) => s.generating)
    const purpose = useBuildStore((s) => s.purpose)
    const budget = useBuildStore((s) => s.budget)
    const setPurpose = useBuildStore((s) => s.setPurpose)
    const setBudget = useBuildStore((s) => s.setBudget)
    const setBuild = useBuildStore((s) => s.setBuild)
    const setFanCount = useBuildStore((s) => s.setFanCount)
    const clearBuild = useBuildStore((s) => s.clearBuild)
    const setGenerating = useBuildStore((s) => s.setGenerating)

    const savedBuildId = useBuildStore((s) => s.savedBuildId)
    const savedBuildName = useBuildStore((s) => s.savedBuildName)
    const markSaved = useBuildStore((s) => s.markSaved)
    const saveBuild = useSaveBuild()
    const archiveBuild = useSaveBuild()
    const updateBuild = useUpdateBuild()

    const reasoning = useBuildStore((s) => s.reasoning)

    const { data: parts } = useBuildParts(componentIds)
    const maxFans = parts?.cooler?.coolerType === 'aio' ? MAX_FANS_AIO : MAX_FANS_AIR

    // A loaded build carries its own budget, which the current tiers may no longer
    // offer for its purpose if the gating is ever changed. Keep it in the list so
    // the Select shows the truth instead of rendering blank.
    const budgetOptions = useMemo(() => {
        const allowed = BUDGET_TIERS.filter((t) => t.purposes.includes(purpose))
        if (allowed.some((t) => Number(t.value) === budget)) return allowed

        return [...allowed, { value: String(budget), label: `${budget} EUR` }]
            .sort((a, b) => Number(a.value) - Number(b.value))
    }, [purpose, budget])


    useEffect(() => {
        saveBuild.reset()
        updateBuild.reset()
        setNaming(false)
        setBuildName('')
    }, [componentIds])

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

    // "Igranje 1200 €" — the same shape used for auto-saved history entries
    function defaultBuildName() {
        return `${PURPOSE_LABELS[purpose] ?? purpose} ${budget} €`
    }

    function startNaming() {
        setBuildName(defaultBuildName())
        setNaming(true)
    }

    function cancelNaming() {
        setNaming(false)
        setBuildName('')
        saveBuild.reset()
    }

    function confirmSave() {
        const name = buildName.trim()
        if (!name) return

        saveBuild.mutate(
            { name, purpose, budget, componentIds, fanCount, reasoning },
            {
                onSuccess: (row) => {
                    markSaved(row.id, row.name)
                    setNaming(false)
                    setBuildName('')
                },
            }
        )
    }

    function handleUpdate() {
        updateBuild.mutate({
            id: savedBuildId,
            name: savedBuildName,
            purpose,
            budget,
            componentIds,
            fanCount,
            reasoning,
        })
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
                if (status === 402) message = 'Nemate više kredita.'
                else if (status === 401) message = 'Vaša sesija je istekla. Molimo prijavite se ponovno.'
                else if (status === 400) message = body?.error ?? 'Neispravan zahtjev.'
                else message = 'Umjetna inteligencija pogriješila je pri sastavljanju računala. Pokušajte ponovno — vaš kredit nije potrošen.'

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

            // archive every generation so nothing is lost if the user doesn't save
            archiveBuild.mutate({
                name: defaultBuildName(),
                purpose,
                budget,
                componentIds: data.componentIds,
                fanCount: 0,
                reasoning: data.reasoning,
                autoSaved: true,
            })
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
                <Section value="generate" label="Generiraj konfiguraciju" open={openSection}>
                    <Stack gap="md">
                        <Text size="xs" c="dimmed">
                            Odaberite namjenu računala i iznos koji želite potrošiti.
                            Umjetna inteligencija složit će vam kompatibilnu konfiguraciju.
                        </Text>

                        <Select
                            label="Namjena"
                            value={purpose}
                            onChange={handlePurposeChange}
                            allowDeselect={false}
                            data={PURPOSES}
                        />

                        <Select
                            label="Proračun"
                            value={String(budget)}
                            onChange={(v) => setBudget(Number(v))}
                            allowDeselect={false}
                            maxDropdownHeight={280}
                            data={budgetOptions}
                        />

                        {!user ? (
                            <Button onClick={() => openModal('login')}>Prijavite se za generiranje</Button>
                        ) : (
                            <Button onClick={() => generate.mutate()} loading={busy} disabled={busy}>
                                Generiraj konfiguraciju
                            </Button>
                        )}

                        {generate.isError && (
                            <Alert color="red" title="Generiranje nije uspjelo">
                                <Text size="sm">{generate.error.message}</Text>
                            </Alert>
                        )}
                    </Stack>
                </Section>

                {componentIds && (
                    <Section value="build" label="Konfiguracija" open={openSection}>
                        <BuildList parts={parts} />
                    </Section>
                )}
            </Accordion>
            
            {componentIds && (
                <Stack gap={4} mt="md">
                    <Group justify="space-between">
                        <Text size="sm">Ventilatori kućišta</Text>
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
                        <Text size="xs" c="dimmed">Dodajte ventilatore za bolji protok zraka</Text>
                    )}
                </Stack>
            )}
            
            {componentIds && (
                <Stack
                    gap="xs"
                    pt="md"
                    mt="md"
                    style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
                >
                    <Group justify="space-between">
                        <Text fw={600}>Ukupno</Text>
                        <Badge size="lg" variant="light" color={'blue'}>
                            {liveTotal?.toFixed(2)} EUR
                        </Badge>
                    </Group>

                    {saveBuild.isError && (
                        <Text size="xs" c="red">Spremanje nije uspjelo. Pokušajte ponovno.</Text>
                    )}

                    {saveBuild.isSuccess && !naming && (
                        <Text size="xs" c="green">Konfiguracija je spremljena.</Text>
                    )}

                    {updateBuild.isSuccess && (
                        <Text size="xs" c="green">Konfiguracija je ažurirana.</Text>
                    )}

                    {!user ? (
                        <Button fullWidth variant="light" onClick={() => openModal('login')}>
                            Prijavite se za spremanje
                        </Button>
                    ) : naming ? (
                        <Stack gap="xs">
                            <TextInput
                                value={buildName}
                                onChange={(e) => setBuildName(e.currentTarget.value)}
                                placeholder="Naziv konfiguracije"
                                maxLength={60}
                                data-autofocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmSave()
                                    if (e.key === 'Escape') cancelNaming()
                                }}
                            />
                            <Group grow gap="xs">
                                <Button variant="default" onClick={cancelNaming}>Odustani</Button>
                                <Button
                                    onClick={confirmSave}
                                    loading={saveBuild.isPending}
                                    disabled={!buildName.trim()}
                                >
                                    Spremi
                                </Button>
                            </Group>
                        </Stack>
                    ) : savedBuildId ? (
                        <Stack gap={4}>
                            <Button
                                fullWidth
                                variant="light"
                                onClick={handleUpdate}
                                loading={updateBuild.isPending}
                            >
                                Ažuriraj konfiguraciju
                            </Button>
                            <Text size="xs" c="dimmed" ta="center" lineClamp={1}>
                                Uređujete „{savedBuildName}”
                            </Text>
                        </Stack>
                    ) : (
                        <Button fullWidth variant="light" onClick={startNaming}>
                            Spremi konfiguraciju
                        </Button>
                    )}
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
    const fanCount = useBuildStore((s) => s.fanCount)

    const hasSwaps = useMemo(() => {
        if (!componentIds || !originalComponentIds) return false
        return componentIds.some((id, i) => id !== originalComponentIds[i])
    }, [componentIds, originalComponentIds])

    if (!parts) return <Loader size="sm" />

    return (
        <Stack gap="xs">
            {hasSwaps && (
                <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed">Konfiguracija je izmijenjena</Text>
                    <Button size="compact-xs" variant="subtle" onClick={resetToOriginal}>
                        Vrati na AI konfiguraciju
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
                                <Text size="sm" c="dimmed">ⓘ</Text>
                                {originalComponentIds && !originalComponentIds.includes(p.id) && (
                                    <Badge size="xs" variant="light" color="orange">zamijenjeno</Badge>
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
                                <Text size="sm">Zašto ove komponente?</Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
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