import {
    Modal, Stack, Group, Text, Badge, Divider, Loader, Alert, Table,
    Anchor, Avatar, Collapse, Button,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useOffers } from '../../lib/useOffers'
import { useComponent } from '../../lib/useComponent'
import { useBuildParts } from '../../lib/useBuildParts'
import { useSwapOptions } from '../../lib/useSwapOptions'
import { checkSwap } from '../../lib/compatibility'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { SLOT_LABELS } from '../../lib/constants'

const SWAPPABLE = ['cpu', 'gpu', 'ram', 'storage']

// Typed columns worth showing, in render order: [label, unit].
// Key order here is the order the spec table renders.
const SPEC_COLUMNS = {
    socket: ['Socket'],
    sockets: ['Podržani socketi'],
    ram_type: ['Tip memorije'],
    form_factor: ['Format'],
    cooler_type: ['Tip hladnjaka'],
    ram_slots: ['Utori za memoriju'],
    tdp: ['TDP', ' W'],
    wattage: ['Snaga', ' W'],
    gpu_length_mm: ['Duljina', ' mm'],
    cooler_height_mm: ['Visina', ' mm'],
    radiator_mm: ['Radijator', ' mm'],
    max_gpu_length_mm: ['Najveća duljina grafičke', ' mm'],
    max_cooler_height_mm: ['Najveća visina hladnjaka', ' mm'],
    max_radiator_mm: ['Najveći radijator', ' mm'],
}

// specs jsonb keys whose generic Title Case would be wrong or unit-less.
// Anything not listed here falls through to formatKey().
const SPEC_KEYS = {
    argb: ['ARGB'],
    boost_clock: ['Boost takt'],
    cache_mb: ['Predmemorija', ' MB'],
    capacity_gb: ['Kapacitet', ' GB'],
    chip_brand: ['Čip'],
    cl: ['CAS latencija'],
    fan_count: ['Ventilatori'],
    fan_size_mm: ['Veličina ventilatora', ' mm'],
    pwm: ['PWM'],
    rating: ['Učinkovitost'],
    read_mbps: ['Brzina čitanja', ' MB/s'],
    rpm: ['RPM'],
    size_mm: ['Veličina', ' mm'],
    speed_mhz: ['Radni takt', ' MHz'],
    vram_gb: ['VRAM', ' GB'],
    wifi: ['Wi-Fi'],
    write_mbps: ['Brzina pisanja', ' MB/s'],
}

function formatKey(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value) {
    if (typeof value === 'boolean') return value ? 'Da' : 'Ne'
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
}

function shortName(name) {
    return name?.split(',')[0].trim() ?? 'Komponenta'
}

export default function ComponentModal() {
    const activeModal = useUIStore((s) => s.activeModal)
    const closeModal = useUIStore((s) => s.closeModal)
    const componentId = useUIStore((s) => s.selectedComponentId)

    const componentIds = useBuildStore((s) => s.componentIds)
    const swapComponent = useBuildStore((s) => s.swapComponent)

    const [showOptions, { toggle: toggleOptions, close: closeOptions }] = useDisclosure(false)

    const { data: component, isLoading, isError } = useComponent(componentId)
    const { data: offers, isLoading: offersLoading } = useOffers(componentId)
    const { data: parts } = useBuildParts(componentIds)
    const { data: options, isLoading: optionsLoading } = useSwapOptions(
        componentId,
        componentIds,
        showOptions,
    )

    const canSwap = component && SWAPPABLE.includes(component.slot)

    function handleSwap(newId) {
        swapComponent(componentId, newId)
        closeModal()
    }

    const rows = []

    if (component) {
        // typed columns that are populated for this slot
        for (const [key, [label, unit]] of Object.entries(SPEC_COLUMNS)) {
            const value = component[key]
            if (value === null || value === undefined) continue
            rows.push([label, formatValue(value) + (unit ?? '')])
        }

        // everything in the specs jsonb
        for (const [key, value] of Object.entries(component.specs ?? {})) {
            if (value === null || value === undefined) continue
            const [label, unit] = SPEC_KEYS[key] ?? [formatKey(key)]
            rows.push([label, formatValue(value) + (unit ?? '')])
        }
    }

    return (
        <Modal
            opened={activeModal === 'component'}
            onClose={closeModal}
            onExitTransitionEnd={closeOptions}
            title={<Text fw={700} size="lg">{shortName(component?.name)}</Text>}
            centered
            size="md"
        >
            {isLoading && <Loader size="sm" />}
            {isError && <Alert color="red">Nije moguće učitati ovu komponentu.</Alert>}

            {component && (
                <Stack gap="lg">
                    <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs">
                            <Badge variant="light">{SLOT_LABELS[component.slot] ?? component.slot}</Badge>
                            {component.brand && (
                                <Badge variant="outline" color="gray">{component.brand}</Badge>
                            )}
                        </Group>
                        <Text fw={700} size="lg" style={{ whiteSpace: 'nowrap' }}>
                            {Number(component.price).toFixed(2)} EUR
                        </Text>
                    </Group>

                    <Divider />

                    <Stack gap="xs">
                        <Text fw={600} size="sm">Specifikacije</Text>

                        <Table withRowBorders={false} verticalSpacing="xs">
                            <Table.Tbody>
                                {rows.map(([label, value]) => (
                                    <Table.Tr key={label}>
                                        <Table.Td pl={0} w="55%">
                                            <Text size="sm" c="dimmed">{label}</Text>
                                        </Table.Td>
                                        <Table.Td pr={0} ta="right">
                                            <Text size="sm">{value}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Stack>

                    {canSwap && (
                        <>
                            <Divider />

                            <Stack gap="sm">
                                <Button variant="light" onClick={toggleOptions} fullWidth>
                                    {showOptions ? 'Sakrij alternative' : 'Više opcija'}
                                </Button>

                                <Collapse expanded={showOptions}>
                                    <Stack gap="xs">
                                        {optionsLoading && <Loader size="xs" />}

                                        {!optionsLoading && options?.length === 0 && (
                                            <Text size="sm" c="dimmed">
                                                U katalogu nema kompatibilnih alternativa.
                                            </Text>
                                        )}

                                        {options?.map((opt) => {
                                            const problem = parts
                                                ? checkSwap(component.slot, opt, parts)
                                                : null
                                            const delta = Number(opt.price_delta)

                                            return (
                                                <Group
                                                    key={opt.id}
                                                    justify="space-between"
                                                    wrap="nowrap"
                                                    gap="sm"
                                                    p="xs"
                                                    style={{
                                                        border: '1px solid var(--mantine-color-default-border)',
                                                        borderRadius: 'var(--mantine-radius-sm)',
                                                        opacity: problem ? 0.55 : 1,
                                                    }}
                                                >
                                                    <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                                                        <Text size="sm" lineClamp={1}>{opt.name}</Text>

                                                        <Group gap="xs" wrap="nowrap">
                                                            <Text size="xs" c="dimmed">
                                                                {Number(opt.price).toFixed(2)} EUR
                                                            </Text>
                                                            <Text
                                                                size="xs"
                                                                fw={600}
                                                                c={delta > 0 ? 'red' : delta < 0 ? 'green' : 'dimmed'}
                                                            >
                                                                {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                                                            </Text>
                                                        </Group>

                                                        {problem && (
                                                            <Text size="xs" c="red">{problem}</Text>
                                                        )}
                                                    </Stack>

                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        disabled={!!problem}
                                                        onClick={() => handleSwap(opt.id)}
                                                    >
                                                        Zamijeni
                                                    </Button>
                                                </Group>
                                            )
                                        })}
                                    </Stack>
                                </Collapse>
                            </Stack>
                        </>
                    )}

                    <Divider />

                    <Stack gap="sm">
                        <Group justify="space-between" align="center" wrap="nowrap">
                            <Text fw={600} size="sm">Trenutne ponude</Text>
                            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                Cijene iz trgovina uživo
                            </Text>
                        </Group>

                        {offersLoading && <Loader size="xs" />}

                        {!offersLoading && offers?.length === 0 && (
                            <Text size="sm" c="dimmed">Nema pronađenih ponuda u hrvatskim trgovinama.</Text>
                        )}

                        {offers?.map((offer) => (
                            <Group key={offer.link} justify="space-between" wrap="nowrap" gap="sm">
                                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                    <Avatar src={offer.favicon} size={20} radius="sm">
                                        {offer.retailer?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <Anchor
                                        href={offer.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="sm"
                                        lineClamp={1}
                                    >
                                        {offer.retailer}
                                    </Anchor>
                                </Group>
                                <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                                    {offer.price.toFixed(2)} EUR
                                </Text>
                            </Group>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Modal>
    )
}