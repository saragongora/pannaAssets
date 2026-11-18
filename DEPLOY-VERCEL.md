# Publicar Panna Assets na Vercel

## Via GitHub
1. Crie um repositório no GitHub e envie **o conteúdo desta pasta**, mantendo `index.html` na raiz do repositório.
2. Na Vercel, escolha Add New > Project e importe o repositório.
3. Configure Framework Preset: **Other**; Root Directory: `./`; Build Command: **vazio**; Output Directory: **vazio** (padrão de site estático).
4. Clique Deploy. A página inicial será `index.html`.

## Atenção
- O protótipo salva equipamentos e transferências no `localStorage` de cada navegador. Não há sincronização entre usuários ou dispositivos.
- O login é demonstrativo, não é autenticação segura para produção. Não publique dados reais ou sensíveis antes de implementar backend, autenticação e permissões.
- Para testar os exemplos atualizados em um navegador que já utilizava o sistema, mantenha o comportamento de migração da Etapa 32.
- `vercel.json` apenas indica configurações estáticas básicas; não requer npm ou Vite.
