# Testes Manuais — RollCall

## 1. Alunos (CRUD)

### 1.1 Criar aluno
- [ ] Clicar "Novo Aluno" abre modal
- [ ] Modal exibe título "Novo Aluno"
- [ ] Campo: Nome (ex: João Silva)
- [ ] Seletor de Ano com popup calendário (grid de anos)
- [ ] Clicar no ano abre grid com 12 anos para escolher
- [ ] Setas ‹ › navegam bloco de anos
- [ ] Ano selecionado destacado
- [ ] Submeter com nome vazio não faz nada (required)
- [ ] Preencher e salvar → aluno aparece na grid
- [ ] Fechar modal com X ou clicando fora → não salva

### 1.2 Editar aluno
- [ ] Passar mouse sobre aluno na grid → botão editar aparece
- [ ] Clicar editar → modal com título "Editar Aluno" e dados preenchidos
- [ ] Alterar nome/matrícula e salvar → grid atualizada
- [ ] Alterar matrícula para uma já existente → erro "Matrícula já existe"
- [ ] Alterar matrícula para a mesma do aluno → OK (permitido)

### 1.3 Remover aluno
- [ ] Passar mouse sobre aluno → botão remover aparece
- [ ] Clicar remover → confirm dialog "Tem certeza?"
- [ ] Confirmar → aluno some da grid e frequências associadas são removidas
- [ ] Cancelar → nada acontece

## 2. Grid de Frequência (Chamada)

### 2.1 Renderização
- [ ] Grid exibe todos os alunos cadastrados
- [ ] Colunas: nome + dias do mês + X + A + Σ
- [ ] Avatar com iniciais coloridas ao lado do nome
- [ ] Dias da semana (D, S, T, Q, Q, S, S) nos cabeçalhos
- [ ] Fins de semana com fundo cinza
- [ ] Dia atual com indicador azul

### 2.2 Marcação
- [ ] **Clique** em célula vazia → marca **X** (falta)
- [ ] **Clique** em célula com X → limpa (volta a vazio)
- [ ] **Clique** em célula com A → limpa (volta a vazio)
- [ ] **Duplo clique** em célula vazia → marca **A** (atestado)
- [ ] **Duplo clique** em célula com X → vira **A**
- [ ] **Duplo clique** em célula com A → limpa

### 2.3 Info bar
- [ ] Exibe total de alunos
- [ ] Exibe total de faltas no mês
- [ ] Legenda: X = sem atestado, A = com atestado
- [ ] Atalhos de teclado visíveis no desktop

### 2.4 Empty state
- [ ] Sem alunos → mensagem "Nenhum aluno cadastrado"
- [ ] Link "Novo Aluno" no empty state

## 3. Navegação por Mês/Ano

### 3.1 MonthSelector
- [ ] Exibe 12 meses como pills (Janeiro a Dezembro)
- [ ] Mês atual destacado
- [ ] Clicar em mês → grid muda para aquele mês
- [ ] Setas ‹ e › para navegar ano
- [ ] Ano atualizado no meio

### 3.2 Mobile
- [ ] Em telas pequenas, MonthSelector aparece abaixo da navbar
- [ ] Funciona igual ao desktop

## 4. Navegação por Teclado

- [ ] Tab até a grid ganhar foco (ring indigo)
- [ ] **↑↓** move entre alunos
- [ ] **←→** move entre dias
- [ ] **Enter**/**Space** alterna status da célula focada
- [ ] Célula focada tem ring visível
- [ ] Scroll automático ao navegar para fora da viewport
- [ ] Tab sai da grid → focus desaparece

## 5. Paginação

- [ ] Com ≤35 alunos → sem paginação
- [ ] Com >35 alunos → barra de paginação aparece
- [ ] Select: 10, 35, 50 por página
- [ ] Botões "Anterior" e "Próxima"
- [ ] Indicador "Página X de Y"
- [ ] Mudar page size → reseta para página 1
- [ ] Configuração persiste (fechar/abrir app mantém)
- [ ] Configuração incluída no backup (export/import)

## 6. Busca/Filtro

- [ ] Input de busca aparece na navbar na aba Chamada
- [ ] Digitar nome → grid filtra em tempo real
- [ ] Busca case-insensitive (ex: "joão" encontra "João")
- [ ] Limpar busca → volta a mostrar todos
- [ ] Busca some na aba Relatório

## 7. Relatório

### 7.1 Renderização
- [ ] Aba Relatório mostra visão por bimestre (B1 a B4)
- [ ] Cabeçalhos: Aluno, B1 Σ/X/A, B2 Σ/X/A, ..., Ano Σ/X/A
- [ ] Por aluno: totais por bimestre e anuais
- [ ] Linha "Total Geral" no final
- [ ] Ano exibido no título
- [ ] Avatar com iniciais ao lado do nome

### 7.2 Empty state
- [ ] Sem alunos → "Nenhum dado disponível"

### 7.3 Exportar PDF
- [ ] Botão "Exportar PDF" habilitado quando há alunos
- [ ] Botão desabilitado quando não há alunos
- [ ] Clicar → gera PDF com spinner de loading
- [ ] PDF em landscape, contém tabela completa
- [ ] Se conteúdo exceder 1 página, faz paginação automática

## 8. Importar / Exportar

### 8.1 Aba dedicada
- [ ] Aba "Importar/Exportar" no seletor de abas
- [ ] Card Exportar com descrição + botão
- [ ] Card Importar com descrição + botão
- [ ] Aviso: "A importação substitui todos os dados"

### 8.2 Exportar
- [ ] Clicar Exportar → baixa arquivo .json
- [ ] Nome do arquivo: rollcall-backup-YYYY-MM-DD.json
- [ ] JSON contém alunos, frequencias e config
- [ ] Toast "Dados exportados com sucesso!"

### 8.3 Importar
- [ ] Clicar Importar → confirm dialog "Tem certeza?"
- [ ] Cancelar → volta sem alterar
- [ ] Confirmar → abre seletor de arquivo
- [ ] Selecionar JSON válido → dados substituídos
- [ ] Toast "Dados importados com sucesso!"
- [ ] JSON inválido → toast de erro "Erro ao importar dados"
- [ ] JSON com config → config restaurada (ex: page size)

### 8.4 Erros
- [ ] Tentar importar JSON malformado → erro
- [ ] Tentar importar JSON sem campo alunos → erro
- [ ] Erro não quebra o app (ErrorBoundary)

## 9. Histórico por Aluno

- [ ] Passar mouse sobre aluno → botão relógio aparece
- [ ] Clicar → modal com nome/matrícula/avatar
- [ ] Totais anuais: faltas, atestados, geral
- [ ] Timeline por mês com badges dia+X ou dia+A
- [ ] Meses sem ocorrência não aparecem
- [ ] Scroll interno se muitos meses
- [ ] Fechar com X ou clicando fora

## 10. Dark Mode

- [ ] Botão no header alterna dark/light
- [ ] Preferência persiste (localStorage)
- [ ] Detecta preferência do sistema na primeira vez
- [ ] Todos os componentes com dark mode consistente
- [ ] Footer badge "Modo Desenvolvimento" em modo browser

## 11. Error Boundary

- [ ] Se um componente quebrar → tela "Algo deu errado"
- [ ] Exibe mensagem do erro
- [ ] Botão "Recarregar" → reload da página
- [ ] Botão "Voltar ao Início" → volta para raiz

## 12. Responsividade

- [ ] Navbar quebra linha em mobile se necessário
- [ ] Botão "Novo Aluno" mostra só + em telas pequenas
- [ ] Input de busca reduz em mobile
- [ ] Import/Export cards empilham verticalmente em mobile
- [ ] Info bar da grid quebra linha com wrap
- [ ] Legendas (X, A) e atalhos sum em mobile
- [ ] Paginação: "X/Y" em vez de "Página X de Y" em mobile
- [ ] Modais ocupam largura total com margem (mx-4)

## 13. Integração (Fluxos Completos)

### 13.1 Fluxo básico
- [ ] Criar 3 alunos
- [ ] Navegar para março
- [ ] Marcar faltas e atestados em dias diferentes
- [ ] Verificar contadores X, A, Σ por aluno
- [ ] Verificar total de faltas na info bar

### 13.2 Export/import round-trip
- [ ] Criar alunos e marcar frequências
- [ ] Alterar page size para 10
- [ ] Exportar backup
- [ ] Limpar dados (importar JSON vazio)
- [ ] Importar backup
- [ ] Verificar alunos, frequências e config restaurados

### 13.3 Relatório
- [ ] Com dados de vários meses
- [ ] Verificar bimestres B1-B4 com totais corretos
- [ ] Verificar "Total Geral"
- [ ] Exportar PDF

### 13.4 Histórico
- [ ] Selecionar aluno com faltas em vários meses
- [ ] Verificar timeline no modal
- [ ] Confirmar totais anuais batem com relatório

## 14. Casos de Borda

- [ ] Ano bissexto (fevereiro com 29 dias)
- [ ] Ano não bissexto (fevereiro com 28 dias)
- [ ] Mês com 31, 30, 28, 29 dias
- [ ] Nenhum aluno cadastrado
- [ ] Nenhuma frequência no mês
- [ ] 50+ alunos (pular para página 2)
- [ ] Nome com acentos e caracteres especiais
- [ ] Matrícula muito longa
- [ ] Fechar modal de histórico sem dados
- [ ] Clicar "Exportar PDF" sem alunos (desabilitado)

## 15. Rodar Testes Automatizados

```bash
# Todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Build
npm run build
```
