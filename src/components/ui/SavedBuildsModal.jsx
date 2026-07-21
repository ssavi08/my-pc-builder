import { Modal, ScrollArea, Stack, Text } from '@mantine/core'
import { useUIStore } from '../../store/useUIStore'

export default function SavedBuildsModal() {
    const activeModal = useUIStore((s) => s.activeModal)
    const closeModal = useUIStore((s) => s.closeModal)

    return (
        <Modal
            opened={activeModal === 'saved-builds'}
            onClose={closeModal}
            title="Saved builds"
            centered
            size="md"
        >
            <ScrollArea h={400} type="auto">
                <Stack gap="sm">
                    <Text size="sm" c="dimmed">No saved builds yet.</Text>
                </Stack>
            </ScrollArea>
        </Modal>
    )

}