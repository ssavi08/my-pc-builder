import { Link } from 'react-router-dom'
import {
    Box, Container, Stack, Title, Text, Button, Divider, Group, Badge,
    useMantineColorScheme,
} from '@mantine/core'
import NavbarContent from '../components/ui/NavbarContent'

const TECH = [
    'React', 'Three.js', 'React Three Fiber', 'Mantine', 'Zustand',
    'TanStack Query', 'Supabase', 'GPT-4o', 'SerpApi', 'Blender',
]

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
                <Stack gap="lg">
                    <Title order={1}>About</Title>

                    <Text>
                        Pick what the computer is for and how much you want to spend.
                        MyPCBuilder puts together a compatible build and shows it in 3D —
                        rotate it, take the side panel off, click any part to see its specs
                        and what Croatian shops are charging for it right now.
                    </Text>

                    <Divider />

                    <Stack gap="xs">
                        <Title order={4}>How it works</Title>
                        <Text>
                            The AI picks from a shortlist, which is filtered by your selected budget, from our
                            component catalogue. Whatever it returns is then checked against the
                            database — socket, memory type, card length, power draw, the total
                            price. If something doesn't fit, it gets told what it got wrong and tries again.
                            A build that fails those checks never reaches the screen, and your credit is not spent.
                        </Text>
                    </Stack>

                    <Stack gap="xs">
                        <Title order={4}>The data</Title>
                        <Text>
                            Specs are entered by hand from manufacturer datasheets. Prices
                            are pulled live from Croatian retailers and cached for a week.
                        </Text>
                    </Stack>

                    <Stack gap="xs">
                        <Title order={4}>Built with</Title>
                        <Group gap="xs">
                            {TECH.map((t) => (
                                <Badge key={t} variant="light">{t}</Badge>
                            ))}
                        </Group>
                    </Stack>

                    <Divider />

                    <Text size="sm" c="dimmed">
                        Student project made by Sandro Savi 3rd year of CompSci at Faculty of Electrical Engineering, University of Osijek. Mentor: prof. dr. sc. Ivica Lukić
                    </Text>

                    <Button component={Link} to="/" size="md" w="fit-content">
                        Generate a build
                    </Button>
                </Stack>
            </Container>
        </Box>
    )
}