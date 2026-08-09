import { createTheme, Switch, Modal } from '@mantine/core'

export const theme = createTheme({
    fontFamily: 'Inter, sans-serif',
    headings: { fontFamily: 'Inter, sans-serif' },

    defaultRadius: 'md',
    radius: { md: '0.625rem' },

    primaryColor: 'blue',
    primaryShade: { light: 7, dark: 8 },

    white: '#ffffff',
    black: '#090b0c',

    colors: {
        blue: [
            '#eff6ff', '#dbeafe', '#bedbff', '#8ec5ff', '#51a2ff',
            '#2b7fff', '#155dfc', '#1447e6', '#193cb8', '#1c398e',
        ],
        gray: [
            '#f9fbfb', '#f1f3f3', '#e3e7e8', '#ced5d7', '#b6c0c2',
            '#9ca8ab', '#67787c', '#3e4a4d', '#22292b', '#090b0c',
        ],
        dark: [
            '#f9fbfb', '#e3e7e8', '#9ca8ab', '#67787c', '#2a3134',
            '#22292b', '#161b1d', '#090b0c', '#06080a', '#030405',
        ],
    },

    components: {
        Switch: Switch.extend(
            { styles: { track: { cursor: 'pointer' } }}
        ),

        Modal: Modal.extend({
            defaultProps: {
                zIndex: 300,
            },
        }),
    }

})