export default function Anchored({ nodes, name, children }) {
    const anchor = nodes[name]
    if(!anchor) {
        return null
    }

    return (
        <group position={anchor.position} rotation={anchor.rotation}>
            {children}
        </group>
    )
}