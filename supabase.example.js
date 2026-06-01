// =============================================================
// supabase.example.js - ARQUIVO DE EXEMPLO
// Copie este arquivo como supabase.js e preencha com suas credenciais
// NUNCA commite supabase.js com credenciais reais no GitHub
// =============================================================

// Cole aqui a URL do seu projeto Supabase
// Exemplo: https://xxxxxxxxxxxxxxxxxxxx.supabase.co
const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SUPABASE";

// Cole aqui a anon public key do seu projeto Supabase
// Encontre em: Settings > API > Project API keys > anon public
// NUNCA use a service_role key no front-end
const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY";

// Inicializa o cliente Supabase (requer o CDN carregado no index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
