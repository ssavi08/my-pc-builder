export const MM = 0.001

export const FAN_FILL_ORDER = [
    'ANCHOR_fan_rear_1',
    'ANCHOR_fan_front_2',
    'ANCHOR_fan_top_1',
    'ANCHOR_fan_front_1',
    'ANCHOR_fan_top_2',
    'ANCHOR_fan_front_3',
]

export const FAN_FILL_ORDER_WITH_AIO = [
    'ANCHOR_fan_rear_1',
    'ANCHOR_fan_front_2',
    'ANCHOR_fan_front_1',
    'ANCHOR_fan_front_3',
]

// The three build purposes. The `value` strings are validated server-side by
// generate-build and must stay in English — only the labels are translated.
export const PURPOSES = [
    { value: 'school', label: 'Škola' },
    { value: 'work',   label: 'Posao' },
    { value: 'gaming', label: 'Igranje' },
]

export const PURPOSE_LABELS = Object.fromEntries(
    PURPOSES.map((p) => [p.value, p.label])
)

// Slot keys come from the database in English. These are the Croatian names
// shown in the interface — the keys themselves must not be translated.
export const SLOT_LABELS = {
    case: 'Kućište',
    motherboard: 'Matična ploča',
    cpu: 'Procesor',
    cooler: 'Hladnjak',
    gpu: 'Grafička kartica',
    ram: 'Radna memorija',
    storage: 'Pohrana',
    psu: 'Napajanje',
    fan: 'Ventilator',
}

export const BUDGET_TIERS = [
    { value: '600',  label: '600 EUR — početna razina, samo integrirana grafika', purposes: ['school', 'work', 'gaming'] },
    { value: '800',  label: '800 EUR — pristupačno',      purposes: ['school', 'work', 'gaming'] },
    { value: '1000', label: '1000 EUR',                   purposes: ['school', 'work', 'gaming'] },
    { value: '1200', label: '1200 EUR',                   purposes: ['school', 'work', 'gaming'] },
    { value: '1500', label: '1500 EUR — srednja klasa',   purposes: ['school', 'work', 'gaming'] },
    { value: '2000', label: '2000 EUR',                   purposes: ['school', 'work', 'gaming'] },
    { value: '2600', label: '2600 EUR',                   purposes: ['work', 'gaming'] },
    { value: '3200', label: '3200 EUR — viša klasa',      purposes: ['work', 'gaming'] },
    { value: '4000', label: '4000 EUR',                   purposes: ['work', 'gaming'] },
    { value: '5500', label: '5500 EUR — entuzijast',      purposes: ['gaming'] },
    { value: '7500', label: '7500 EUR',                   purposes: ['gaming'] },
    { value: '9000', label: '9000 EUR — maksimum',        purposes: ['gaming'] },
]

export const MAX_FANS_AIR = 6
export const MAX_FANS_AIO = 4

export const DEFAULT_BUILD_IDS = [
    'case-deepcool-macube-110',
    'mobo-gigabyte-a620m-ds3h',
    'cpu-amd-ryzen-5-9600x',
    'cooler-arctic-liquid-freezer-iii-pro-240-a-rgb-2x120mm',
    'gpu-asus-amd-radeon-rx9060xt-prime-oc-8gb',
    'ram-kingston-fury-beast-16gb-2x8gb-ddr5-5600mhz',
    'psu-asus-tuf-gaming-750b-750w',
    'storage-m2-samsung-990-pro-1tb',
    'storage-hdd-seagate-barracuda-8tb',
    'fan-arctic-p12-pro-a-rgb-120mm',
    'storage-ssd-silicon-power-a55-1tb',
]

export const DEFAULT_FAN_COUNT = 4
