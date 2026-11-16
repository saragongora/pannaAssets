# Panna Assets

Sistema acadêmico de gerenciamento de equipamentos do Grupo Panna, desenvolvido em **HTML, CSS e JavaScript**, sem backend.

## Como executar

Abra `index.html` em um servidor local (por exemplo, Live Server do VS Code).

**Acessos de demonstração:**
- Administrador: usuário `adm`, senha `123`.
- Operador: usuário `operador`, senha `123`.

As senhas estão no JavaScript.

## O que já foi feito

- Login de demonstração com dois perfis e menus separados, incluindo menu lateral recolhível.
- Cadastro, listagem, pesquisa, edição, inativação, reativação e exclusão de equipamentos.
- Dados de exemplo e persistência de equipamentos no `localStorage`.
- Detalhes do equipamento com informações, QR Code ilustrativo e abas.
- Cadastro de várias manutenções preventivas por equipamento, com periodicidade, próxima data e múltiplos insumos.
- Sugestões de tipos de manutenção conforme o grupo do equipamento.
- Registro de execução de preventivas, histórico e reagendamento automático conforme a periodicidade.
- Histórico de eventos por equipamento (ações realizadas nas versões que já registravam eventos).
- Telas do operador para identificar equipamento por código, abrir chamado e registrar avaria.
- Avaria que impede o uso gera automaticamente um chamado e muda o equipamento para Parado.
- Solicitações de manutenção para o administrador, com pesquisa, filtro por prioridade e detalhes em modal.
- Indicadores **Total de chamados**, **Urgentes**, **Aceitos** e **Recusados**. Os dois últimos abrem listas em que o administrador pode alterar a decisão; cada mudança gera um evento no histórico.
- Menu Manutenção com opções Solicitações e Pendentes. A página de Pendentes ainda é provisória.

## O que falta fazer

- **Responsividade:** revisar e adaptar todas as telas para celulares, tablets e diferentes resoluções.
- **Manutenções pendentes:** desenvolver a tela para acompanhar chamados aceitos e preventivas.
- **Nova manutenção:** criar o modal para adicionar manutenções diretamente na área administrativa.
- **Transferências:** tornar a tela e o fluxo de transferência funcionais, incluindo histórico.
- **Design:** melhorar consistência visual, ícones, espaçamentos, formulários e acessibilidade.
- **Chamados:** completar fluxo de execução, conclusão e acompanhamento das manutenções corretivas.
- **QR Code:** implementar geração/leitura real pela câmera; hoje há imagem ilustrativa e busca manual.
- **Fotos e anexos:** armazenar os arquivos enviados, e não apenas seus nomes.
- **Relatórios:** criar telas e indicadores de acompanhamento.
- **Autenticação e dados compartilhados:** criar backend, banco de dados e login seguro para uso real entre dispositivos.
- **Testes:** validar navegação, regras de negócio e armazenamento no navegador.
- Adicionar logo da panna

## Organização do código

- `panna.js`: funções originais de equipamentos, preventivas e histórico.
- `panna-integracao.js`: login demonstrativo, operador, chamados e integração com a administração.
- `equipamentos-iniciais.js`: dados iniciais de demonstração.
- `styles.css`: estilos gerais e ajustes visuais.
- `CE*.html`, `GE*.html`, `MAN*.html`, `OC*-MOBILE.html`: páginas do sistema.

## Observações importantes

O `localStorage` guarda dados **somente no navegador e origem utilizados**. Não sincroniza computadores ou celulares diferentes. Limpar os dados do navegador pode apagar os registros. Antes de usar em uma empresa, será necessário backend e controle de acesso no servidor.

Este README descreve o estado atual do protótipo; as funcionalidades pendentes não estão prontas para uso.
