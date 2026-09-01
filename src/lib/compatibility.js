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
    return null   
}

function checkCpu(cpu, parts) {
    const mobo = parts.motherboard
    const cooler = parts.cooler
    const gpu = parts.gpu
    const psu = parts.psu

    if (mobo && cpu.socket !== mobo.socket) {
        return `Potreban je socket ${mobo.socket}`
    }

    if (cooler?.sockets && !cooler.sockets.includes(cpu.socket)) {
        return `Vaš hladnjak ne podržava ${cpu.socket}`
    }

    if (!gpu && !cpu.igpu) {
        return 'Nema integrirane grafike, a konfiguracija nema grafičku karticu'
    }

    const draw = (cpu.tdp ?? 0) + (gpu?.tdp ?? 0)
    if (psu?.wattage && psu.wattage < Math.ceil(draw * PSU_HEADROOM)) {
        return `Potrebno je najmanje ${Math.ceil(draw * PSU_HEADROOM)} W, a imate ${psu.wattage} W`
    }

    return null
}

function checkGpu(gpu, parts) {
    const pcCase = parts.case
    const cpu = parts.cpu
    const psu = parts.psu

    if (pcCase?.maxGpuLengthMm && gpu.gpu_length_mm > pcCase.maxGpuLengthMm) {
        return `Preduga: ${gpu.gpu_length_mm} mm, u kućište stane ${pcCase.maxGpuLengthMm} mm`
    }

    const draw = (cpu?.tdp ?? 0) + (gpu.tdp ?? 0)
    if (psu?.wattage && psu.wattage < Math.ceil(draw * PSU_HEADROOM)) {
        return `Potrebno je najmanje ${Math.ceil(draw * PSU_HEADROOM)} W, a imate ${psu.wattage} W`
    }

    return null
}

function checkRam(ram, parts) {
    const mobo = parts.motherboard

    if (mobo && ram.ram_type !== mobo.ramType) {
        return `Potreban je ${mobo.ramType}`
    }

    const modules = ram.specs?.modules ?? 1
    if (mobo?.ramSlots && modules > mobo.ramSlots) {
        return `${modules} modula, a ploča ima ${mobo.ramSlots} utora`
    }

    return null
}