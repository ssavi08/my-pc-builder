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
                    <Title order={1}>O aplikaciji</Title>

                    <Text>
                        Odaberite namjenu računala i iznos koji želite potrošiti.
                        MyPCBuilder sastavlja kompatibilnu konfiguraciju i prikazuje ju u 3D-u —
                        zarotirajte je, skinite bočne stranice i kliknite bilo koju komponentu
                        kako biste vidjeli njezine specifikacije i trenutne cijene u hrvatskim
                        trgovinama.
                    </Text>

                    <Divider />

                    <Stack gap="xs">
                        <Title order={4}>Kako radi</Title>
                        <Text>
                            Umjetna inteligencija bira iz užeg izbora komponenti našeg kataloga,
                            filtriranog prema odabranom proračunu. Sve što vrati zatim se provjerava
                            u bazi podataka — socket, tip memorije, duljina grafičke kartice,
                            potrošnja i ukupna cijena. Ako nešto ne odgovara, model dobiva povratnu
                            informaciju o pogrešci i pokušava ponovno. Konfiguracija koja ne prođe
                            te provjere nikada ne dolazi na zaslon, a vaš kredit se ne troši.
                        </Text>
                    </Stack>

                    <Stack gap="xs">
                        <Title order={4}>Podaci</Title>
                        <Text>
                            Specifikacije su ručno unesene iz tehničkih specifikacija proizvođača.
                            Cijene se dohvaćaju uživo iz hrvatskih trgovina i pohranjuju tjedan dana.
                        </Text>
                    </Stack>

                    <Stack gap="xs">
                        <Title order={4}>Izrađeno pomoću</Title>
                        <Group gap="xs">
                            {TECH.map((t) => (
                                <Badge key={t} variant="light">{t}</Badge>
                            ))}
                        </Group>
                    </Stack>

                    <Divider />

                    <Text size="sm" c="dimmed">
                        Studentski projekt. Izradio Sandro Savi, 3. godina računarstva,
                        Fakultet elektrotehnike, računarstva i informacijskih tehnologija Osijek (FERIT)
                        Mentor: prof. dr. sc. Ivica Lukić
                    </Text>

                    <Button component={Link} to="/" size="md" w="fit-content">
                        Generiraj konfiguraciju
                    </Button>
                </Stack>
            </Container>
        </Box>
    )
}