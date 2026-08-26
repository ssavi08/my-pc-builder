import { Paper, Stack, Group, Loader, Text, Button } from '@mantine/core'
import { useSceneBuild } from '../../lib/useSceneBuild'
import { useBuildParts } from '../../lib/useBuildParts'

// Covers the gap the in-canvas spinner cannot: the component fetch that runs
// before any model URL is even known. ComputerAssembly renders nothing during
// that window, so without this the viewport is silently blank.
export default function SceneStatus() {
    const { componentIds } = useSceneBuild()

    // Same query key as ComputerAssembly — react-query serves both from one fetch.
    const { isLoading, isError, error, isFetching, refetch } = useBuildParts(componentIds)

    if (!isLoading && !isError) return null

    return (
        <Paper
            withBorder
            shadow="sm"
            radius="md"
            px="lg"
            py="md"
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
                pointerEvents: isError ? 'auto' : 'none',   // never block orbiting
            }}
        >
            {isLoading ? (
                <Group gap="sm" wrap="nowrap">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">Loading build…</Text>
                </Group>
            ) : (
                <Stack gap="xs" align="center">
                    <Text size="sm" fw={500}>Could not load this build</Text>
                    <Text size="xs" c="dimmed" ta="center" maw={260}>
                        {error?.message ?? 'Something went wrong while fetching the components.'}
                    </Text>
                    <Button
                        size="xs"
                        variant="light"
                        mt={4}
                        loading={isFetching}
                        onClick={() => refetch()}
                    >
                        Try again
                    </Button>
                </Stack>
            )}
        </Paper>
    )
}
