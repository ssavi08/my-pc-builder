import { useEffect } from 'react'
import PartNode from './PartNode'
import Anchored from './Anchored'
import { FAN_FILL_ORDER, FAN_FILL_ORDER_WITH_AIO } from '../../lib/constants'
import { useBuildStore } from '../../store/useBuildStore'
import { useUIStore } from '../../store/useUIStore'
import { useBuildParts } from '../../lib/useBuildParts'

export default function ComputerAssembly({ componentIds: idsProp, fanCount: fanProp, ...props }) {
    const storeIds = useBuildStore((s) => s.componentIds)
    const componentIds = idsProp ?? storeIds

    const { data: parts, isLoading, isError } = useBuildParts(componentIds)

    if (isLoading || isError || !parts?.case?.modelUrl) return null

    const storage = parts.storage ?? []
    const m2Drives  = storage.filter((d) => d.formFactor === 'M.2')
    const bayDrives = storage.filter((d) => d.formFactor === '2.5 inch')
    const hddDrives = storage.filter((d) => d.formFactor === '3.5 inch')

    return (
        <group {...props}>
            <PartNode url={parts.case.modelUrl}>
                {(caseNodes) => (
                    <>
                        <SidePanels caseNodes={caseNodes} />
                        {parts.psu?.modelUrl && (
                            <Anchored nodes={caseNodes} name="ANCHOR_psu">
                                <PartNode url={parts.psu.modelUrl} componentId={parts.psu.id} />
                            </Anchored>
                        )}

                        <StorageDrives drives={bayDrives} nodes={caseNodes} prefix="ANCHOR_ssd_" />
                        <StorageDrives drives={hddDrives} nodes={caseNodes} prefix="ANCHOR_hdd_" />
                        <Fans parts={parts} caseNodes={caseNodes} fanCount={fanProp} />

                        {parts.motherboard?.modelUrl && (
                            <Anchored nodes={caseNodes} name="ANCHOR_motherboard">
                                <PartNode url={parts.motherboard.modelUrl} componentId={parts.motherboard.id}>
                                    {(moboNodes) => (
                                        <>
                                            {parts.cpu?.modelUrl && (
                                                <Anchored nodes={moboNodes} name="ANCHOR_cpu">
                                                    <PartNode url={parts.cpu.modelUrl} componentId={parts.cpu.id}/>
                                                </Anchored>
                                            )}
                                            {parts.cooler?.modelUrl && (
                                                <Anchored nodes={moboNodes} name="ANCHOR_cooler">
                                                    <PartNode url={parts.cooler.modelUrl} componentId={parts.cooler.id}/>
                                                </Anchored>
                                            )}
                                            {parts.gpu?.modelUrl && (
                                                <Anchored nodes={moboNodes} name="ANCHOR_gpu">
                                                    <PartNode url={parts.gpu.modelUrl} componentId={parts.gpu.id}/>
                                                </Anchored>
                                            )}

                                            <RamSticks parts={parts} moboNodes={moboNodes} />
                                            <StorageDrives drives={m2Drives} nodes={moboNodes} prefix="ANCHOR_m2_" />
                                        </>
                                    )}
                                </PartNode>
                            </Anchored>
                        )}
                    </>
                )}
            </PartNode>
        </group>
    )
}

function SidePanels({ caseNodes }) {
    const panelsVisible = useUIStore((s) => s.panelsVisible)

    useEffect(() => {
        for (const name of Object.keys(caseNodes)) {
            if (name.toLowerCase().includes('panel')) {
                caseNodes[name].visible = panelsVisible
                caseNodes[name].raycast = () => null   // never intercept pointer events
            }
        }
    }, [caseNodes, panelsVisible])

    return null
}

function RamSticks({ parts, moboNodes }) {
    const ram = parts.ram
    if (!ram?.modelUrl) return null

    const anchorNames = Object.keys(moboNodes)
        .filter((n) => n.startsWith('ANCHOR_ram_'))
        .sort()

    const modules = ram.specs?.modules ?? 1
    const count = Math.min(modules, parts.motherboard?.ramSlots ?? 4, anchorNames.length)

    return anchorNames.slice(0, count).map((name) => (
        <Anchored key={name} nodes={moboNodes} name={name}>
            <PartNode url={ram.modelUrl} componentId={ram.id} />
        </Anchored>
    ))
}

function StorageDrives({ drives, nodes, prefix }) {
    if (!drives?.length) return null

    const anchors = Object.keys(nodes).filter((n) => n.startsWith(prefix)).sort()

    let used = 0
    return drives.map((drive) => {
        if (!drive?.modelUrl) return null
        if (used >= anchors.length) return null

        const name = anchors[used++]
        return (
            <Anchored key={name} nodes={nodes} name={name}>
                <PartNode url={drive.modelUrl} componentId={drive.id} />
            </Anchored>
        )
    })
}

function Fans({ parts, caseNodes, fanCount: fanProp }) {
    const storeFanCount = useBuildStore((s) => s.fanCount)
    const fanCount = fanProp ?? storeFanCount

    const fan = parts.fan?.[0]
    if (!fan?.modelUrl || !fanCount) return null

    const isAio = parts.cooler?.coolerType === 'aio'
    const order = isAio ? FAN_FILL_ORDER_WITH_AIO : FAN_FILL_ORDER

    const anchorNames = order.filter((name) => caseNodes[name])
    const n = Math.min(fanCount, anchorNames.length)

    return anchorNames.slice(0, n).map((name) => (
        <Anchored key={name} nodes={caseNodes} name={name}>
            <PartNode url={fan.modelUrl} componentId={fan.id} />
        </Anchored>
    ))
}