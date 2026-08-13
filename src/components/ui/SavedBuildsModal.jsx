import {
    Modal, ScrollArea, Stack, Text, Card, Group, Badge,
    ActionIcon, Loader, Center,
} from '@mantine/core'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { useSavedBuilds } from '../../lib/useSavedBuilds'
import { useDeleteBuild } from '../../lib/useSaveBuild'

const PURPOSE_LABELS = {
    school: 'School',
    work: 'Work',
    gaming: 'Gaming',
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('hr-HR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function SavedBuildsModal() {
    const activeModal = useUIStore((s) => s.activeModal)
    const closeModal = useUIStore((s) => s.closeModal)
    const loadBuild = useBuildStore((s) => s.loadBuild)

    const { data: builds, isLoading, isError } = useSavedBuilds()
    const deleteBuild = useDeleteBuild()

    function handleLoad(build) {
        loadBuild(build)
        closeModal()
    }

    return (
        <Modal
            opened={activeModal === 'saved-builds'}
            onClose={closeModal}
            title={<Text fw={700} size="lg">Saved builds</Text>}
            centered
            size="md"
        >
            {isLoading && (
                <Center py="xl"><Loader size="sm" /></Center>
            )}

            {isError && (
                <Text size="sm" c="red">Could not load your saved builds.</Text>
            )}

            {builds?.length === 0 && (
                <Stack gap={4} py="md">
                    <Text size="sm" c="dimmed">No saved builds yet.</Text>
                    <Text size="xs" c="dimmed">
                        Generate a build, then use Save build in the sidebar.
                    </Text>
                </Stack>
            )}

            {builds?.length > 0 && (
                <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                    <Stack gap="sm">
                        {builds.map((build) => (
                            <Card
                                key={build.id}
                                withBorder
                                padding="sm"
                                radius="md"
                                onClick={() => handleLoad(build)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Group justify="space-between" wrap="nowrap" align="flex-start">
                                    <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                                        <Text fw={600} size="sm" lineClamp={1}>
                                            {build.name}
                                        </Text>

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
                                        loading={
                                            deleteBuild.isPending &&
                                            deleteBuild.variables === build.id
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteBuild.mutate(build.id)
                                        }}
                                    >
                                        ×
                                    </ActionIcon>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                </ScrollArea.Autosize>
            )}
        </Modal>
    )
}