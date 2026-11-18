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

## Etapa 22 — Conclusão das manutenções (MAN2)

Ao alterar uma manutenção para **Concluída** na tela de Manutenções pendentes, o sistema solicita data da execução, responsável, observações e insumos realmente utilizados. A realização é salva em `historicoManutencoes` e aparece no histórico do equipamento. Para preventivas com periodicidade reconhecida, calcula a próxima data usando o calendário e mantém o plano pendente para o próximo ciclo. Para corretivas, a conclusão encerra a manutenção. Os registros anteriores não são apagados.

**Atenção:** a integração é local (`localStorage`) e precisa ser testada no navegador com dados reais. Periodicidades desconhecidas exigem confirmação e não são reagendadas automaticamente.

### Etapa 24 — Gerenciamento responsivo (GE1 e GE2)
- GE1: cartões de indicadores em 2 colunas no celular; busca e filtro empilhados; tabela apresentada como cartões rotulados no celular e com rolagem horizontal em tablets.
- GE2: cabeçalho, botões, abas, dados, manutenção, histórico, QR Code e confirmação de exclusão adaptados para telas pequenas.
- Menu lateral: no celular inicia fechado, pode ser aberto pelo botão existente e fechado tocando fora ou pressionando Escape.
- Arquivos alterados: `GE1.html`, `GE2.html`, `panna.js`, `styles.css`; criado `panna-ge-responsive.js`.
- Todos os blocos novos ou alterados contêm comentários `ETAPA 24` para facilitar manutenção.
- Nenhuma alteração no formato dos dados do localStorage.


### Etapa 25 — Cadastro/edição responsivos e ações da listagem
- CE1 (cadastro e edição) adapta campos para 2 colunas em tablets e 1 em celulares; menu lateral móvel, anexos, preventivas e botões adaptáveis.
- GE1: ícones de inativar/reativar e excluir agora funcionam, com confirmação e atualização imediata dos indicadores.
- Inativação e reativação registram eventos no histórico; exclusão é definitiva e remove os dados vinculados ao equipamento.
- Trechos adicionados/alterados identificados com comentários `ETAPA 25`.


## Etapa 26 — Menu recolhido, chamados responsivos e Kanban
- **ETAPA 26:** o menu lateral inicia recolhido em todas as páginas que o utilizam, tanto em desktop quanto em mobile; abre pelo botão de menu.
- **ETAPA 26:** na tela MAN1, a tabela de chamados vira cartões com rótulos em celulares (até 700px), mantendo indicadores, filtros e modal.
- **ETAPA 26:** ao selecionar Kanban em MAN2, o filtro Situação muda automaticamente para Todas as situações; em Lista, o filtro mantém o comportamento normal.
- Os trechos modificados foram marcados com comentários `ETAPA 26`.


## ETAPA 27 — Transferências funcionais
- TE1: listagem, contadores e filtros reais, busca, cadastro em modal com busca incremental de equipamentos (12 sugestões).
- TE2: detalhes e linha do tempo da transferência; transições Não começou → Em movimento → Recebida, com cancelamento antes de recebimento.
- Cada transição exige ou permite registrar data, transportadora, motorista, rastreio, responsável pelo recebimento e observações.
- A localização do equipamento só muda na confirmação de recebimento. Cada transição gera um evento no histórico do equipamento.
- Transferências em aberto duplicadas para o mesmo equipamento são bloqueadas.
- Persistência em localStorage: `panna-assets-transferencias-v1` (protótipo, não multiusuário).
- Responsividade isolada em `.panna-transfer` e comentários `ETAPA 27` nos novos trechos.
- A listagem anterior continha exemplos estáticos; os novos registros são reais.


## ETAPA 28 — Transferências: Kanban e cadastro por etapas
- Adicionado modo Kanban com colunas Pendente, Em movimento e Recebida; alternância com Lista.
- Terminologia “Não começou” alterada para “Pendente”.
- Ordenação inicial por prioridade (Urgente, Alta, Normal); opções por data de criação, previsão e equipamento.
- Cadastro inicial registra apenas equipamento, origem, destino, prioridade, responsável na origem e observações.
- Previsão, transportadora, motorista, rastreio e contato são solicitados ao iniciar movimento; responsável no destino ao confirmar recebimento.
- Alterações identificadas por comentários ETAPA 28.


### ETAPA 29 — Interface do operador
- Removido o botão de ver informações do equipamento da tela `operacao-campo.html`.
- Os botões de ação começam sem seleção/destaque; destaque ocorre apenas em hover/foco.
- Centralizados o cabeçalho e o painel, com ajustes responsivos para celular.
- Leitura do QR Code e Enter identificam o equipamento sem redirecionar automaticamente; a navegação ocorre ao escolher Abrir chamado ou Registrar avaria.
- Alterações identificadas com comentários `ETAPA 29`.


## Etapa 30 — Ajustes nas telas do operador
- **ETAPA 30:** cabeçalho e painel alinhados na identificação, abertura de chamado e registro de avaria.
- **ETAPA 30:** área de QR Code reduzida visualmente, sem remover a leitura por câmera.
- **ETAPA 30:** botão Cancelar retorna para `operacao-campo.html` (a antiga `consulta-equipamento.html` não existe no pacote), levando o código do equipamento.
- **ETAPA 30:** formulários com apresentação consistente, foco visível e ações adaptadas a celulares.


## ETAPA 31 — Equipamentos demonstrativos mais completos
- Os seis equipamentos iniciais agora possuem dados técnicos, identificação patrimonial, responsáveis, observações, planos preventivos com insumos, chamados em diferentes situações e eventos de exemplo.
- Todos os nomes, números, valores, datas e ocorrências adicionados são **fictícios** e servem exclusivamente à demonstração.
- **Importante:** a carga inicial só é usada quando não existe a chave `panna-assets-equipamentos-v1` no localStorage. Para visualizar os novos exemplos em um navegador que já tenha registros, use um perfil/navegador sem dados prévios. Não apague a chave sem fazer backup, pois isso excluiria cadastros e histórico locais.
- Mudança restrita ao arquivo `equipamentos-iniciais.js`, sem alterar a lógica ou os dados salvos pelo usuário.


## ETAPA 32 — Atualização dos exemplos antigos
- Corrige a exibição dos dados demonstrativos em navegadores que já tinham os seis equipamentos iniciais no `localStorage`.
- Completa apenas campos técnicos vazios e adiciona planos preventivos completos somente quando o equipamento não possui um array de planos.
- Mantém nomes, situações, datas existentes, campos preenchidos pelo usuário, chamados e histórico. Não altera equipamentos com outros códigos ou identificação técnica já preenchida.
- Executa uma única vez por equipamento com marcador `_pannaDemoEnriquecidoV32`; não é necessário limpar o navegador.
- Todos os trechos adicionados estão comentados como `ETAPA 32`.
