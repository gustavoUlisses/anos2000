# Messenger feature

MSN Messenger migrado do projeto `belenyb/msn-react-clone`.

A UI roda isolada em Shadow DOM com Bootstrap/CSS do clone para preservar a aparencia original sem vazar estilos para o Windows XP. A integracao remove Gemini/API externa.

O MSN usa Supabase Realtime para presenca e mensagens privadas entre visitantes quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estao configuradas. As rotas `/api/msn/session` e `/api/msn/messages` usam `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor para criar perfis e persistir historico.
