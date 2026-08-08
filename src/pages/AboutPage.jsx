import { Link } from 'react-router-dom'
import {
    Box, Container, Stack, Title, Text, Button, Divider, List, Group, Badge,
    useMantineColorScheme,
} from '@mantine/core'
import NavbarContent from '../components/ui/NavbarContent'

export default function AboutPage() {
    const { colorScheme } = useMantineColorScheme()

    return (
        <Box style={{ minHeight: '100vh' }} bg={colorScheme === 'dark' ? 'dark.7' : 'white'}>
            <Box
                h={60}
                style={{
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    background: 'var(--mantine-color-body)',
                }}
            >
                <NavbarContent />
            </Box>

            <Container size="sm" py="xl">
                <Stack gap="xl">
                    <Stack gap="xs">
                        <Title order={1}>About MyPCBuilder</Title>
                        <Text c="dimmed">
                            An AI-assisted PC configurator that builds and renders a complete
                            desktop computer in 3D.
                        </Text>
                    </Stack>

                    <Divider />

                    <Stack gap="sm">
                        <Title order={3}>What it does</Title>
                        <Text>
                            You choose what the computer is for — school, work, or gaming — and how
                            much you want to spend. The app then assembles a complete, compatible
                            build and shows it as an interactive 3D model you can rotate, open up,
                            and inspect part by part. Click any component to see its specifications
                            and current prices from Croatian retailers.
                        </Text>
                    </Stack>

                    <Stack gap="sm">
                        <Title order={3}>How a build is generated</Title>
                        <Text>
                            The AI does not pick parts unsupervised. Each request goes through four
                            stages:
                        </Text>

                        <List type="ordered" spacing="sm">
                            <List.Item>
                                <Text fw={600} component="span">Candidate filtering.</Text>{' '}
                                A database function narrows the catalogue to parts that make sense
                                for the given budget, applying a spending ceiling per category so
                                a mid-range build is never offered a flagship graphics card.
                            </List.Item>
                            <List.Item>
                                <Text fw={600} component="span">AI selection.</Text>{' '}
                                The filtered candidates, with their sockets, memory types and
                                physical clearances, are sent to GPT-4o along with the purpose and
                                budget. The model chooses a combination and explains its reasoning.
                            </List.Item>
                            <List.Item>
                                <Text fw={600} component="span">Server-side validation.</Text>{' '}
                                Every returned build is checked against the database before the user
                                sees it: CPU socket against motherboard, memory type, cooler
                                compatibility, graphics card length against case clearance, power
                                supply headroom, and the total against the budget. If a rule is
                                broken, the errors are fed back and the model gets a second attempt.
                                Nothing invalid reaches the screen.
                            </List.Item>
                            <List.Item>
                                <Text fw={600} component="span">3D assembly.</Text>{' '}
                                Each chosen part is rendered from its own 3D model and positioned
                                using mounting points embedded in the case and motherboard geometry,
                                so components sit where they physically belong rather than at
                                hardcoded coordinates.
                            </List.Item>
                        </List>
                    </Stack>

                    <Stack gap="sm">
                        <Title order={3}>Where the data comes from</Title>
                        <Text>
                            Technical specifications relevant to compatibility — sockets, memory
                            types, dimensions, clearances — are curated in the application's own
                            catalogue, since this information is not exposed by retailers in a
                            machine-readable form. Current pricing and availability are retrieved
                            live from Croatian retailers via the Google Search API through SerpApi,
                            and cached server-side to limit request volume.
                        </Text>
                    </Stack>

                    <Stack gap="sm">
                        <Title order={3}>Built with</Title>
                        <Group gap="xs">
                            {['React', 'Vite', 'Three.js', 'React Three Fiber', 'Mantine',
                              'Zustand', 'TanStack Query', 'Supabase', 'PostgreSQL',
                              'OpenAI GPT-4o', 'SerpApi', 'Blender'].map((tech) => (
                                <Badge key={tech} variant="light" size="lg">{tech}</Badge>
                            ))}
                        </Group>
                    </Stack>

                    <Divider />

                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            This is a student project. The component catalogue is a curated subset
                            of the market rather than a complete inventory. Builds are
                            validated for compatibility but are not a substitute for professional
                            advice.
                        </Text>
                    </Stack>

                    <Button component={Link} to="/" size="md" mt="md">
                        Generate a build
                    </Button>
                </Stack>
            </Container>
        </Box>
    )
}