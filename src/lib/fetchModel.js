import { supabase } from './supabaseClient'

export async function fetchModel(componentId) {
    const { data, error } = await supabase.from('components')
    .select('id, name, slot, default_models(model_url, mount_anchors, name)')
    .eq('id', componentId)
    .single()

    if(error || !data?.default_models) {
        console.error('fetchedModel: lookup fialed', error)
        return null
    }

    return data.default_models
}