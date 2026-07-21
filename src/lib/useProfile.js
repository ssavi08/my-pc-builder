import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { useAuthStore } from "../store/useAuthStore";

export function useProfile() {
    const user = useAuthStore((s) => s.user)

    return useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits', 'last_credit_grant')
                .single()

            if(error) {
                throw error
            } else {
                return data
            }
        },

        enabled: !!user,
    })
}