import Scene from '../components/3d/Scene'
import { supabase } from '../lib/supabaseClient'

export default function MainPage() {
    async function testGenerate() {
        const { data, error } = await supabase.functions.invoke('generate-build', {
            body: { purpose: 'gaming', budget: 1200 },
        })
        console.log('build:', data)
        console.log('error:', error)
    }

    return (
        <div style={{ height: '100%' }}>
            <Scene />
        </div>
    )
}