// Supabase returns its auth errors in English. This maps the ones users can
// realistically hit to Croatian so no English leaks into the interface.
// Matching is done on a lowercased substring — Supabase occasionally rewords
// these, and a substring survives small changes an exact match would not.
const AUTH_ERRORS = [
    ['invalid login credentials',        'Neispravna e-mail adresa ili lozinka.'],
    ['email not confirmed',              'E-mail adresa još nije potvrđena. Provjerite svoju poštu.'],
    ['user already registered',          'Korisnik s ovom e-mail adresom već postoji.'],
    ['already been registered',          'Korisnik s ovom e-mail adresom već postoji.'],
    ['password should be at least',      'Lozinka mora imati barem 6 znakova.'],
    ['new password should be different', 'Nova lozinka mora se razlikovati od stare.'],
    ['unable to validate email address', 'Neispravan format e-mail adrese.'],
    ['email rate limit exceeded',        'Poslano je previše zahtjeva. Pokušajte ponovno za nekoliko minuta.'],
    ['for security purposes',            'Pričekajte nekoliko trenutaka prije novog pokušaja.'],
    ['token has expired',                'Poveznica je istekla. Zatražite novu.'],
    ['invalid or has expired',           'Poveznica je neispravna ili je istekla.'],
    ['auth session missing',             'Vaša sesija je istekla. Molimo prijavite se ponovno.'],
    ['failed to fetch',                  'Nije moguće spojiti se na poslužitelj. Provjerite internetsku vezu.'],
]

const FALLBACK = 'Došlo je do pogreške. Pokušajte ponovno.'

/** Croatian text for a Supabase auth error. */
export function authErrorMessage(error) {
    const raw = error?.message ?? ''
    const needle = raw.toLowerCase()

    for (const [match, translation] of AUTH_ERRORS) {
        if (needle.includes(match)) return translation
    }

    // Unmapped errors would otherwise show up in English. Keep the original in
    // the console so it stays diagnosable, and show Croatian to the user.
    console.error('Neprevedena Supabase auth pogreška:', raw)
    return FALLBACK
}
