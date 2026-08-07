import { Modal, Stack, Group, Text, Badge, Divider, Loader, Alert, Table, Anchor, Avatar, Title } from '@mantine/core'
import { useOffers } from '../../lib/useOffers'
import { useUIStore } from '../../store/useUIStore'
import { useComponent } from '../../lib/useComponent'

// typed columns worth showing, and how to label them
const SPEC_LABELS = {
    socket: 'Socket',
    sockets: 'Supported sockets',
    ram_type: 'Memory type',
    form_factor: 'Form factor',
    cooler_type: 'Cooler type',
    ram_slots: 'RAM slots',
    tdp: 'TDP',
    wattage: 'Wattage',
    gpu_length_mm: 'Length',
    cooler_height_mm: 'Height',
    radiator_mm: 'Radiator',
    max_gpu_length_mm: 'Max GPU length',
    max_cooler_height_mm: 'Max cooler height',
    max_radiator_mm: 'Max radiator',
}

const UNITS = {
    tdp: 'W',
    wattage: 'W',
    gpu_length_mm: 'mm',
    cooler_height_mm: 'mm',
    radiator_mm: 'mm',
    max_gpu_length_mm: 'mm',
    max_cooler_height_mm: 'mm',
    max_radiator_mm: 'mm',
}

function formatKey(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value) {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
}

function shortName(name) {
    return name?.split(',')[0].trim() ?? 'Component'
}

export default function ComponentModal() {
    const activeModal = useUIStore((s) => s.activeModal)
    const closeModal = useUIStore((s) => s.closeModal)
    const componentId = useUIStore((s) => s.selectedComponentId)

    const { data: component, isLoading, isError } = useComponent(componentId)
    const { data: offers, isLoading: offersLoading } = useOffers(componentId)

    const rows = []

    if (component) {
        // typed columns that are populated for this slot
        for (const [key, label] of Object.entries(SPEC_LABELS)) {
            const value = component[key]
            if (value === null || value === undefined) continue
            rows.push([label, formatValue(value) + (UNITS[key] ?? '')])
        }

        // everything in the specs jsonb
        for (const [key, value] of Object.entries(component.specs ?? {})) {
            if (value === null || value === undefined) continue
            rows.push([formatKey(key), formatValue(value)])
        }
    }

    return (
        <Modal
            opened={activeModal === 'component'}
            onClose={closeModal}
            title={<Text fw={700} size="lg" lineClamp={1}>{shortName(component?.name)}</Text>}
            centered
            size="md"
        >
            {isLoading && <Loader size="sm" />}
            {isError && <Alert color="red">Could not load this component.</Alert>}

            {component && (
                <Stack gap="lg">
                    <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs">
                            <Badge variant="light">{component.slot}</Badge>
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
                        <Text fw={600} size="sm">Specifications</Text>

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

                    <Divider />

                    <Stack gap="sm">
                        <Group justify="space-between" align="center" wrap="nowrap">
                            <Text fw={600} size="sm">Current offers</Text>
                            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                Live retailer prices
                            </Text>
                        </Group>

                        {offersLoading && <Loader size="xs" />}

                        {!offersLoading && offers?.length === 0 && (
                            <Text size="sm" c="dimmed">No Croatian listings found.</Text>
                        )}

                        {offers?.map((offer) => (
                            <Group key={offer.link} justify="space-between" wrap="nowrap" gap="sm">
                                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                    <Avatar
                                        src={offer.favicon}
                                        size={20}
                                        radius="sm"
                                    >
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