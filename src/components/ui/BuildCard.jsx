import { Card, Group, Stack, Text, Badge, ActionIcon } from '@mantine/core'
import { PURPOSE_LABELS } from '../../lib/constants'

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('hr-HR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function BuildCard({ build, onLoad, onDelete, deleting }) {
    return (
        <Card
            withBorder
            padding="sm"
            radius="md"
            onClick={() => onLoad(build)}
            style={{ cursor: 'pointer' }}
        >
            <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                    <Text fw={600} size="sm" lineClamp={1}>{build.name}</Text>

                    <Group gap="xs">
                        <Badge size="sm" variant="light">
                            {PURPOSE_LABELS[build.purpose] ?? build.purpose}
                        </Badge>
                        <Text size="sm" c="dimmed">
                            {Number(build.budget).toFixed(0)} €
                        </Text>
                    </Group>

                    <Text size="xs" c="dimmed">
                        {formatDate(build.created_at)}
                        {build.fan_count > 0 && ` · ${build.fan_count} fans`}
                    </Text>
                </Stack>

                <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    aria-label="Delete build"
                    loading={deleting}
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(build.id)
                    }}
                >
                    ×
                </ActionIcon>
            </Group>
        </Card>
    )
}