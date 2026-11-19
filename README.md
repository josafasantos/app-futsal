# Na Quadra — Futsal

Aplicativo completo para gerenciamento de pelada de futsal (futebol de salão / society) para celular e computador. Desenvolvido com React 19, TypeScript, Vite, Tailwind CSS e suporte a PWA.

## 🚀 Como rodar e testar

Requer Node.js 22+ (recomendado: 24).

```powershell
npm install
npm test
npm run dev
npm run build
```

## 🌐 Firebase & Deploy

- **Projeto**: `app-futsal-5693e`
- **Conta**: `josafaalvesdossantos@gmail.com`
- **URL de Produção**: [https://app-futsal-5693e.web.app](https://app-futsal-5693e.web.app)
- **Console**: [https://console.firebase.google.com/project/app-futsal-5693e/overview](https://console.firebase.google.com/project/app-futsal-5693e/overview)

Para atualizar a publicação no Firebase Hosting:

```powershell
npm run build
firebase deploy --only hosting --account josafaalvesdossantos@gmail.com
```

Ao abrir em `http://localhost:5173`, o app já inicia funcional com jogadores de demonstração no modo local (salvando no `localStorage`), permitindo testar sorteio, cronômetro, gols, artilharia, fila e relatórios imediatamente.

---

## ⚽ Regras do Futsal implementadas

1. **Formato configurável na quadra**:
   - Padrão **5 contra 5** (10 em quadra), com opção no menu de configurações para **4x4** (quadras reduzidas) ou **6x6** (society/quadras médias).
2. **Duração cronometrada**:
   - Partidas de **10 minutos corridos** (ajustável de 5 a 20 minutos).
   - Cronômetro digital integrado na tela com alerta visual de tempo esgotado e botões de pausar/iniciar/zerar.
3. **Rodízio e Permanência**:
   - O vencedor continua para a próxima partida.
   - **Regra dos dois jogos**: Cada formação sai ao completar dois jogos consecutivos, mesmo ganhando.
   - **Empate**:
     - Se um time já completou 2 jogos, ele sai da quadra. O desafiante (que jogou apenas 1) permanece.
     - Se ambos estavam no seu primeiro jogo, o time da casa/incumbente permanece.
     - Os jogadores do time que sai retornam ao final da fila na ordem de escalação.
4. **Prioridade da primeira participação**:
   - Ao confirmar uma chegada, quem ainda não jogou nenhuma partida no dia entra na fila **na frente de quem já jogou**. A ordem de chegada entre os novos é preservada.
   - O botão de adiar (seta para baixo) permite enviar voluntariamente alguém para o fim da fila mantendo a presença.
5. **Gols e Artilharia**:
   - Botão **+ GOL** permite selecionar rapidamente quem marcou o gol para contabilizar na tela de **Artilharia**, ou registrar gol rápido sem autor.
   - Botão de desfazer gol caso seja marcado incorretamente.
6. **Substituições e Trocas**:
   - O administrador pode substituir um jogador em quadra pelo primeiro da fila de espera a qualquer momento.
   - Permuta direta entre jogadores do Time A e Time B ("Trocar jogadores de time").

---

## 👥 Perfis de Acesso

- **Adm (Administrador)**: Controle total. Iniciar/finalizar dia, cadastrar jogadores, confirmar chegadas, operar placar e cronômetro, indicar juiz, trocar jogadores, editar regras e acessar relatórios completos.
- **Jogador (Visualizador)**: Modo somente leitura. Acompanha em tempo real o placar ao vivo, cronômetro, escalações, próximo time, fila de espera e regras.

O alternador de perfil fica acessível no topo da barra de navegação para facilitar testes entre visão do adm e do jogador.

---

## 📱 Telas do Aplicativo

- **Quadra**: Placar com nomes dos times, gols, cronômetro digital em destaque, escalação, juiz da partida, indicação do próximo time e botão de confirmar resultado.
- **Fila**: Próximo time em destaque (com aviso se incompleto), lista sequencial com crachá de "1ª Partida" e botão de adiar vez para o fim da fila.
- **Presença**: Lista de confirmados com limite de vagas configurável (ex: 30 vagas), check-in de chegada em ordem real, e modal para gerenciar cadastros (adicionar, editar, inativar ou excluir).
- **Relatórios**:
  - ⚽ **Artilharia**: Ranking de gols marcados por jogador.
  - 🏆 **Vitórias & Jogos**: Jogos, vitórias, empates, derrotas e taxa de aproveitamento (%).
  - 📅 **Presenças**: Frequência e total de dias presentes.
  - ❌ **Faltas**: Jogadores que confirmaram na lista mas não compareceram.
  - 📜 **Histórico**: Registro completo das partidas finalizadas com placar e juiz.
- **Regras**: Texto das regras da pelada, editável e persistente pelo administrador.
