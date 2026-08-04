import { supabase } from './supabaseClient'

const MULTI_SLOTS = ['storage', 'fan']   

export async function fetchBuildComponents(ids) {
    const { data, error } = await supabase
        .from('components')
        .select('id, slot, name, price, specs, ram_slots, default_models(model_url, form_factor)')
        .in('id', ids)

    if (error) throw error

    const parts = {}

    for (const row of data) {
        const part = {
            id: row.id,
            name: row.name,
            price: row.price,
            specs: row.specs,
            ramSlots: row.ram_slots,
            modelUrl: row.default_models.model_url,
            formFactor: row.default_models.form_factor,
        }

        if (MULTI_SLOTS.includes(row.slot)) {
            parts[row.slot] = parts[row.slot] ? [...parts[row.slot], part] : [part]
        } else {
            parts[row.slot] = part
        }
    }

    return parts
}