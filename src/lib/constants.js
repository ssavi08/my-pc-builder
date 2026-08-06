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

export const BUDGET_TIERS = [
    { value: '600',  label: '600 EUR — entry, contains only iGPU',  purposes: ['school', 'work', 'gaming'] },
    { value: '800',  label: '800 EUR — budget',          purposes: ['school', 'work', 'gaming'] },
    { value: '1000', label: '1000 EUR',                  purposes: ['school', 'work', 'gaming'] },
    { value: '1200', label: '1200 EUR',                  purposes: ['school', 'work', 'gaming'] },
    { value: '1500', label: '1500 EUR — mid range',      purposes: ['school', 'work', 'gaming'] },
    { value: '2000', label: '2000 EUR',                  purposes: ['school', 'work', 'gaming'] },
    { value: '2600', label: '2600 EUR',                  purposes: ['work', 'gaming'] },
    { value: '3200', label: '3200 EUR — high end',       purposes: ['work', 'gaming'] },
    { value: '4000', label: '4000 EUR',                  purposes: ['work', 'gaming'] },
    { value: '5500', label: '5500 EUR — enthusiast',     purposes: ['gaming'] },
    { value: '7500', label: '7500 EUR',                  purposes: ['gaming'] },
    { value: '9000', label: '9000 EUR — maximum',        purposes: ['gaming'] },
]

export const MAX_FANS_AIR = 6
export const MAX_FANS_AIO = 4