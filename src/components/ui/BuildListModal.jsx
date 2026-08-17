import { Modal, ScrollArea, Stack, Text, Loader, Center } from '@mantine/core'
import { useUIStore } from '../../store/useUIStore'
import { useBuildStore } from '../../store/useBuildStore'
import { useSavedBuilds } from '../../lib/useSavedBuilds'
import { useDeleteBuild } from '../../lib/useSaveBuild'
import BuildCard from './BuildCard'

export default function BuildListModal({ modalName, title, autoSaved, emptyText, emptyHint }) {
    const activeModal = useUIStore((s) => s.activeModal)
    const closeModal = useUIStore((s) => s.closeModal)
    const loadBuild = useBuildStore((s) => s.loadBuild)

    const { data: builds, isLoading, isError } = useSavedBuilds(autoSaved)
    const deleteBuild = useDeleteBuild()

    function handleLoad(build) {
        loadBuild(build)
        closeModal()
    }

    return (
        <Modal
            opened={activeModal === modalName}
            onClose={closeModal}
            title={<Text fw={700} size="lg">{title}</Text>}
            centered
            size="md"
        >
            {isLoading && <Center py="xl"><Loader size="sm" /></Center>}

            {isError && (
                <Text size="sm" c="red">Could not load your builds.</Text>
            )}

            {builds?.length === 0 && (
                <Stack gap={4} py="md">
                    <Text size="sm" c="dimmed">{emptyText}</Text>
                    {emptyHint && <Text size="xs" c="dimmed">{emptyHint}</Text>}
                </Stack>
            )}

            {builds?.length > 0 && (
                <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                    <Stack gap="sm">
                        {builds.map((build) => (
                            <BuildCard
                                key={build.id}
                                build={build}
                                onLoad={handleLoad}
                                onDelete={(id) => deleteBuild.mutate(id)}
                                deleting={deleteBuild.isPending && deleteBuild.variables === build.id}
                            />
                        ))}
                    </Stack>
                </ScrollArea.Autosize>
            )}
        </Modal>
    )
}