// =============================================================
// supabase.js - Configuracao do cliente Supabase
// INSTRUCOES:
// 1. Acesse https://supabase.com/dashboard
// 2. Abra seu projeto cases-store-catalogo
// 3. Va em Settings > API
// 4. Copie a Project URL e cole em SUPABASE_URL
// 5. Copie a anon public key e cole em SUPABASE_ANON_KEY
// NUNCA use a service_role key aqui
// =============================================================

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SUPABASE";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
