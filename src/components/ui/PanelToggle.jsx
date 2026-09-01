import { Switch, Paper, Group, Text } from '@mantine/core'
import { useUIStore } from '../../store/useUIStore'

export default function PanelToggle() {
    const panelsVisible = useUIStore((s) => s.panelsVisible)
    const togglePanels = useUIStore((s) => s.togglePanels)

    return (
        <Paper
            withBorder
            shadow="sm"
            radius="md"
            px="sm"
            py={6}
            style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 50,
            }}
        >
            <Group gap="xs" wrap="nowrap">
                <Text size="sm">Bočne stranice</Text>
                <Switch
                    checked={panelsVisible}
                    onChange={togglePanels}
                    size="sm"
                    styles={{ track: { cursor: 'pointer' } }}
                />
            </Group>
        </Paper>
    )
}