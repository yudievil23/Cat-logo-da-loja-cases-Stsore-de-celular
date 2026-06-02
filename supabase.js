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

const SUPABASE_URL = "https://sdghwhjxnypyrznctyrf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZ2h3aGp4bnlweXJ6bmN0eXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODQ3NjQsImV4cCI6MjA5NDc2MDc2NH0.jhRoMF6QqV13fbH7Mq4-Qk4acbZRnWNNcBRfOe4_FjQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
