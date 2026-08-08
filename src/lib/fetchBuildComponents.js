import { supabase } from './supabaseClient'

const MULTI_SLOTS = ['storage', 'fan']

export async function fetchBuildComponents(ids) {
    const { data, error } = await supabase
        .from('components')
        .select('id, slot, name, price, specs, ram_slots, cooler_type, socket, sockets, ram_type, tdp, wattage, gpu_length_mm, max_gpu_length_mm, igpu, default_models(model_url, form_factor)')
        .in('id', ids)

    if (error) throw error

    const parts = {}

    for (const row of data) {
        const part = {
            // identity and display
            id: row.id,
            name: row.name,
            price: row.price,
            specs: row.specs,

            // 3D rendering
            modelUrl: row.default_models?.model_url ?? null,
            formFactor: row.default_models?.form_factor ?? null,

            // compatibility
            socket: row.socket,
            sockets: row.sockets,
            ramType: row.ram_type,
            ramSlots: row.ram_slots,
            coolerType: row.cooler_type,
            tdp: row.tdp,
            wattage: row.wattage,
            igpu: row.igpu,
            gpuLengthMm: row.gpu_length_mm,
            maxGpuLengthMm: row.max_gpu_length_mm,
        }

        if (MULTI_SLOTS.includes(row.slot)) {
            parts[row.slot] = parts[row.slot] ? [...parts[row.slot], part] : [part]
        } else {
            parts[row.slot] = part
        }
    }

    return parts
}