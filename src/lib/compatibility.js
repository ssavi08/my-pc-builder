// Cross-component checks that SQL can't do cleanly, because they depend on
// more than one part at once. The Edge Function validator is the real
// enforcement layer — this exists so the UI never offers an invalid swap.

const PSU_HEADROOM = 1.5

/**
 * Can `candidate` replace the part currently in `slot`?
 * `parts` is the slot-keyed object from useBuildParts.
 * Returns null if fine, or a string explaining why not.
 */
export function checkSwap(slot, candidate, parts) {
    if (slot === 'cpu') return checkCpu(candidate, parts)
    if (slot === 'gpu') return checkGpu(candidate, parts)
    if (slot === 'ram') return checkRam(candidate, parts)
    return null   // storage has no cross-component constraints
}

function checkCpu(cpu, parts) {
    const mobo = parts.motherboard
    const cooler = parts.cooler
    const gpu = parts.gpu
    const psu = parts.psu

    if (mobo && cpu.socket !== mobo.socket) {
        return `Needs socket ${mobo.socket}`
    }

    if (cooler?.sockets && !cooler.sockets.includes(cpu.socket)) {
        return `Your cooler does not support ${cpu.socket}`
    }

    if (!gpu && !cpu.igpu) {
        return 'No integrated graphics, and this build has no GPU'
    }

    const draw = (cpu.tdp ?? 0) + (gpu?.tdp ?? 0)
    if (psu?.wattage && psu.wattage < Math.ceil(draw * PSU_HEADROOM)) {
        return `Needs at least ${Math.ceil(draw * PSU_HEADROOM)}W, you have ${psu.wattage}W`
    }

    return null
}

function checkGpu(gpu, parts) {
    const pcCase = parts.case
    const cpu = parts.cpu
    const psu = parts.psu

    if (pcCase?.maxGpuLengthMm && gpu.gpu_length_mm > pcCase.maxGpuLengthMm) {
        return `Too long: ${gpu.gpu_length_mm}mm, case fits ${pcCase.maxGpuLengthMm}mm`
    }

    const draw = (cpu?.tdp ?? 0) + (gpu.tdp ?? 0)
    if (psu?.wattage && psu.wattage < Math.ceil(draw * PSU_HEADROOM)) {
        return `Needs at least ${Math.ceil(draw * PSU_HEADROOM)}W, you have ${psu.wattage}W`
    }

    return null
}

function checkRam(ram, parts) {
    const mobo = parts.motherboard

    if (mobo && ram.ram_type !== mobo.ramType) {
        return `Needs ${mobo.ramType}`
    }

    const modules = ram.specs?.modules ?? 1
    if (mobo?.ramSlots && modules > mobo.ramSlots) {
        return `${modules} sticks, board has ${mobo.ramSlots} slots`
    }

    return null
}