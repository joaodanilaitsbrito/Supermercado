// ══════════════════════════════════════
//  supabase-config.js
//  Configuração da conexão com o Supabase
// ══════════════════════════════════════

const SUPA_URL = 'https://mbnaiwqahxzzpxjxeyet.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibmFpd3FhaHh6enB4anhleWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDQwNTgsImV4cCI6MjA5NDUyMDA1OH0.fLJEDa9QVgvey871kYSB_4HpYgWi_F0tzEEkw2N6U9Y';

const { createClient } = supabase;
const db = createClient(SUPA_URL, SUPA_KEY);
